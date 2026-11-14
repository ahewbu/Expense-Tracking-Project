# scripts/fix_svyaz_category.py
"""
Скрипт для переноса транзакций из 'Связь' в 'Связь и интернет' и удаления старой категории.
Запуск: docker exec -it glenzhik_api python -m scripts.fix_svyaz_category
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal
from app.models.models import Category, Transaction

def fix_svyaz():
    db = SessionLocal()
    try:
        print("🔍 Поиск категорий...")
        old_cat = db.query(Category).filter(Category.name == "Связь").first()
        new_cat = db.query(Category).filter(Category.name == "Связь и интернет").first()

        if not old_cat:
            print("✅ Категория 'Связь' уже удалена или не существует. Всё отлично!")
            return

        if not new_cat:
            print("❌ Ошибка: Категория 'Связь и интернет' не найдена в базе!")
            return

        print(f"📦 Перенос транзакций из '{old_cat.name}' в '{new_cat.name}'...")
        # Переносим все транзакции со старой категории на новую
        count = db.query(Transaction).filter(
            Transaction.category_id == old_cat.id
        ).update({"category_id": new_cat.id})
        
        print(f"   Перенесено транзакций: {count}")

        print(f"🗑 Удаление старой категории '{old_cat.name}'...")
        db.delete(old_cat)
        db.commit()
        
        print("✅ Готово! Категория 'Связь' успешно удалена, транзакции перенесены.")

    except Exception as e:
        db.rollback()
        print(f"❌ Ошибка при выполнении: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_svyaz()