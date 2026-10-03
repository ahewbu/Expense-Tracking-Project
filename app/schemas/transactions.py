# app/schemas/transaction.py
from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from enum import Enum

class CategoryName(str, Enum):
    FOOD = "Еда"
    TRANSPORT = "Транспорт"
    HOUSING = "Жилье"
    ENTERTAINMENT = "Развлечения"
    HEALTH = "Здоровье"
    CLOTHING = "Одежда"
    COMMUNICATION = "Связь"
    OTHER = "Прочее"

class TransactionParseRequest(BaseModel):
    """То, что фронтенд шлёт после голосового ввода"""
    text: str = Field(..., description="Сырой текст от пользователя или ASR")

class TransactionParseResponse(BaseModel):
    """То, что вернул GigaChat"""
    amount: Optional[float] = Field(None, description="Сумма (null, если ИИ не услышал)")
    category: CategoryName = Field(..., description="Категория строкой")
    date: Optional[str] = Field(None, description="Дата в формате YYYY-MM-DD или null")
    description: str = Field(..., description="Краткое описание")

class TransactionCreate(BaseModel):
    """То, что фронтенд шлёт, когда пользователь нажал 'Подтвердить'"""
    amount: float = Field(..., description="Сумма транзакции")
    category_id: UUID = Field(..., description="UUID категории из БД")
    transaction_date: Optional[datetime] = Field(None, description="Дата транзакции")
    description: Optional[str] = Field(None, description="Описание")


class TransactionUpdate(BaseModel):
    """Для PATCH запроса (редактирование). Все поля опциональны."""
    amount: Optional[float] = None
    category_id: Optional[UUID] = None
    transaction_date: Optional[datetime] = None
    description: Optional[str] = None


class TransactionResponse(BaseModel):
    """То, что бэкенд возвращает при GET и после POST/PATCH"""
    id: UUID
    user_id: UUID
    amount: float
    currency: str
    category_id: Optional[UUID] = None
    description: Optional[str] = None
    source: str
    transaction_date: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True  

class CategoryResponse(BaseModel):
    id: UUID
    name: str
    icon: Optional[str] = None

    class Config:
        from_attributes = True


class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = None
