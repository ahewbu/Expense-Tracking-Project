# scripts/migrate_categories.py
"""
Миграция: объединение дубликатов категорий и перенос транзакций.
Запуск: docker exec -it glenzhik_api python -m scripts.migrate_categories
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal
from app.models.models import User, Category, Transaction
from app.core.default_categories import DEFAULT_CATEGORIES, create_default_categories
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Маппинг старых категорий на новые
CATEGORY_MAPPING = {
    "Еда": None,  # Специальная логика: зависит от описания
    "Жилье": "Жильё и ЖКХ",
    "Связь": "Связь и интернет",
    "Одежда": "Одежда и обувь",
}

# Ключевые слова для разделения "Еды" на "Продукты" и "Рестораны и кафе"
RESTAURANT_KEYWORDS = {
    "ресторан", "кафе", "кофе", "пицца", "суш", "ролл", "бургер", 
    "макдональдс", "kfc", "бургер", "шаурма", "доставк", "яндекс.еда",
    "delivery", "takeaway", "обед", "ужин", "завтрак"
}


def get_new_category_for_food(transaction: Transaction, user_categories: dict) -> Category:
    """Определяет новую категорию для транзакции из старой 'Еда'."""
    description = (transaction.description or "").lower()
    
    # Если в описании есть ресторанная лексика → "Рестораны и кафе"
    if any(keyword in description for keyword in RESTAURANT_KEYWORDS):
        target_name = "Рестораны и кафе"
    else:
        target_name = "Продукты"
    
    # Возвращаем категорию из словаря user_categories
    return user_categories.get(target_name)


def migrate_user(db, user: User):
    """Мигрирует категории для одного пользователя."""
    logger.info(f"\n{'='*60}")
    logger.info(f"Пользователь: {user.email} (ID: {user.id})")
    logger.info(f"{'='*60}")
    
    # 1. Создаём дефолтные категории (если их нет)
    create_default_categories(db, user.id)
    
    # 2. Загружаем все категории пользователя в словарь {name: Category}
    user_categories = {
        cat.name: cat for cat in 
        db.query(Category).filter(Category.user_id == user.id).all()
    }
    
    logger.info(f"Найдено категорий: {len(user_categories)}")
    
    # 3. Собираем старые категории, которые нужно мигрировать
    old_categories_to_migrate = []
    for old_name in CATEGORY_MAPPING.keys():
        if old_name in user_categories:
            old_cat = user_categories[old_name]
            # Проверяем, есть ли транзакции в этой категории
            tx_count = db.query(Transaction).filter(
                Transaction.category_id == old_cat.id
            ).count()
            if tx_count > 0:
                old_categories_to_migrate.append((old_name, old_cat, tx_count))
    
    if not old_categories_to_migrate:
        logger.info("Нет старых категорий с транзакциями для миграции. Пропускаем.")
        return
    
    logger.info(f"Найдено старых категорий для миграции: {len(old_categories_to_migrate)}")
    
    # 4. Мигрируем транзакции
    total_moved = 0
    for old_name, old_cat, tx_count in old_categories_to_migrate:
        logger.info(f"\n  Миграция категории '{old_name}' ({tx_count} транзакций):")
        
        transactions = db.query(Transaction).filter(
            Transaction.category_id == old_cat.id
        ).all()
        
        for tx in transactions:
            if old_name == "Еда":
                # Специальная логика для "Еды"
                new_cat = get_new_category_for_food(tx, user_categories)
            else:
                # Прямой маппинг
                new_name = CATEGORY_MAPPING[old_name]
                new_cat = user_categories.get(new_name)
            
            if new_cat:
                tx.category_id = new_cat.id
                total_moved += 1
                logger.info(f"    - Транзакция '{tx.description[:30]}...' → '{new_cat.name}'")
            else:
                # Если новая категория не найдена, оставляем в "Прочее"
                other_cat = user_categories.get("Прочее")
                if other_cat:
                    tx.category_id = other_cat.id
                    total_moved += 1
                    logger.info(f"    - Транзакция '{tx.description[:30]}...' → 'Прочее' (целевая не найдена)")
    
    db.commit()
    logger.info(f"\n  ✅ Всего перенесено транзакций: {total_moved}")
    
    # 5. Удаляем старые категории (если в них больше нет транзакций)
    for old_name, old_cat, _ in old_categories_to_migrate:
        remaining_tx = db.query(Transaction).filter(
            Transaction.category_id == old_cat.id
        ).count()
        
        if remaining_tx == 0:
            db.delete(old_cat)
            logger.info(f"  🗑 Удалена старая категория '{old_name}'")
        else:
            logger.info(f"  ⚠ Категория '{old_name}' не удалена (осталось {remaining_tx} транзакций)")
    
    db.commit()


def main():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        logger.info(f"Найдено пользователей: {len(users)}")
        
        for user in users:
            migrate_user(db, user)
        
        logger.info(f"\n{'='*60}")
        logger.info("✅ МИГРАЦИЯ ЗАВЕРШЕНА!")
        logger.info(f"{'='*60}")
        
        # Финальная статистика
        for user in users:
            cats = db.query(Category).filter(Category.user_id == user.id).all()
            txs = db.query(Transaction).filter(Transaction.user_id == user.id).count()
            logger.info(f"Пользователь {user.email}: {len(cats)} категорий, {txs} транзакций")
            
    except Exception as e:
        logger.error(f"Ошибка миграции: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()