from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from enum import Enum


class CategoryName(str, Enum):
    """Категории расходов (ИСПРАВЛЕНО: убраны пробелы)"""
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
    text: str = Field(
        ..., 
        description="Сырой текст от пользователя или ASR", 
        example="Купил кофе за 250 рублей",
        min_length=1,
        max_length=500
    )
    
    @field_validator('text')
    @classmethod
    def text_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Текст не может быть пустым')
        return v.strip()


class TransactionParseResponse(BaseModel):
    """То, что вернул GigaChat"""
    amount: Optional[float] = Field(
        None, 
        description="Сумма (null, если ИИ не услышал)", 
        example=250.0,
        ge=0
    )
    category: CategoryName = Field(
        ..., 
        description="Категория строкой", 
        example="Еда"
    )
    date: Optional[str] = Field(
        None, 
        description="Дата в формате YYYY-MM-DD или null", 
        example="2026-10-01"
    )
    description: str = Field(
        ..., 
        description="Краткое описание", 
        example="Кофе",
        max_length=500
    )


class TransactionCreate(BaseModel):
    """То, что фронтенд шлёт, когда пользователь нажал 'Подтвердить'"""
    amount: float = Field(
        ..., 
        description="Сумма транзакции", 
        example=250.0,
        gt=0
    )
    category_id: UUID = Field(
        ..., 
        description="UUID категории из БД"
    )
    transaction_date: Optional[datetime] = Field(
        None, 
        description="Дата транзакции"
    )
    description: Optional[str] = Field(
        None, 
        description="Описание",
        max_length=500
    )
    
    @field_validator('amount')
    @classmethod
    def amount_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError('Сумма должна быть больше 0')
        return v


class TransactionUpdate(BaseModel):
    """Для PATCH запроса (редактирование). Все поля опциональны."""
    amount: Optional[float] = Field(None, gt=0)
    category_id: Optional[UUID] = None
    transaction_date: Optional[datetime] = None
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = None
    
    @field_validator('amount')
    @classmethod
    def amount_must_be_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError('Сумма должна быть больше 0')
        return v
    
    @field_validator('status')
    @classmethod
    def status_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        valid_statuses = ['pending', 'confirmed', 'rejected']
        if v is not None and v not in valid_statuses:
            raise ValueError(f'Статус должен быть одним из: {valid_statuses}')
        return v


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
    name: str = Field(..., example="Еда", min_length=1, max_length=100)
    icon: Optional[str] = Field(None, example="", max_length=50)