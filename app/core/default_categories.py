# app/core/default_categories.py
from app.models.models import Category
import logging

logger = logging.getLogger(__name__)

# Список 20 базовых категорий с иконками
DEFAULT_CATEGORIES = [
    # Обязательные траты
    {"name": "Продукты"},
    {"name": "Рестораны и кафе"},
    {"name": "Транспорт"},
    {"name": "Жильё и ЖКХ"},
    {"name": "Связь и интернет"},
    {"name": "Здоровье"},
    {"name": "Страхование"},
    
    # Опциональные траты
    {"name": "Развлечения"},
    {"name": "Одежда и обувь"},
    {"name": "Красота и уход"},
    {"name": "Электроника"},
    {"name": "Дом и ремонт"},
    {"name": "Образование"},
    {"name": "Путешествия"},
    {"name": "Спорт"},
    {"name": "Подарки"},
    {"name": "Дети"},
    {"name": "Питомцы"},
    {"name": "Финансы"},
    {"name": "Прочее"},
]


def create_default_categories(db, user_id):
    """
    Создаёт 20 базовых категорий для нового пользователя.
    Если категории уже существуют — пропускает их.
    """
    logger.info(f"Создание дефолтных категорий для пользователя {user_id}")
    
    created_count = 0
    for cat_data in DEFAULT_CATEGORIES:
        # Проверяем, нет ли уже такой категории у пользователя
        exists = db.query(Category).filter(
            Category.name == cat_data["name"],
            Category.user_id == user_id
        ).first()
        
        if not exists:
            category = Category(
                name=cat_data["name"],
                user_id=user_id
            )
            db.add(category)
            created_count += 1
    
    if created_count > 0:
        db.commit()
        logger.info(f"Создано {created_count} новых категорий для пользователя {user_id}")
    else:
        logger.info(f"Все дефолтные категории уже существуют для пользователя {user_id}")