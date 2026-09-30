from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Получаем DATABASE_URL из переменных окружения
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://glenzhik:glenzhik_secret@db:5432/glenzhik"
)

# Создаём движок (engine) для подключения к БД
engine = create_engine(DATABASE_URL, echo=True)

# Создаём фабрику сессий
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей
Base = declarative_base()


def get_db():
    """
    Генератор для получения сессии БД.
    Используется в зависимостях FastAPI.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()