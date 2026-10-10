from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.db import get_db
from app.models.models import User, Category, Transaction
from app.schemas.transaction import (
    TransactionParseRequest,
    TransactionParseResponse,
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    CategoryResponse,
    CategoryCreate,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


# === ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: Получить или создать тестового пользователя ===
def get_or_create_test_user(db: Session) -> User:
    """Создаёт тестового пользователя, если его нет."""
    user = db.query(User).filter(User.email == "test@glenzhik2007.ru").first()
    if not user:
        user = User(
            email="test@glenzhik2007.ru",
            full_name="Тестовый пользователь"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


# === ЭНДПОИНТ 1: Парсинг текста через LLM ===
@router.post(
    "/parse",
    response_model=TransactionParseResponse,
    summary="Распарсить текст через LLM",
    description="Принимает сырой текст (голосовой ввод), отправляет в GigaChat, возвращает распознанную транзакцию в формате JSON."
)
async def parse_transaction(payload: TransactionParseRequest):
    """
    Пример запроса:
    ```json
    {"text": "Купил кофе за 250 рублей"}
    ```
    """
    try:
        from app.services.llm_adapter import parse_expense_text
        result = await parse_expense_text(payload.text)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при вызове LLM: {str(e)}"
        )


# === ЭНДПОИНТ 2: Создать транзакцию ===
@router.post(
    "/",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать транзакцию",
    description="Сохраняет подтверждённую транзакцию в PostgreSQL."
)
async def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db)
):
    """Сохраняет транзакцию после подтверждения пользователем."""
    user = get_or_create_test_user(db)
    
    category = db.query(Category).filter(Category.id == transaction.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Категория с ID {transaction.category_id} не найдена"
        )
    
    new_transaction = Transaction(
        user_id=user.id,
        amount=transaction.amount,
        currency="RUB",
        category_id=transaction.category_id,
        description=transaction.description,
        source="manual",
        transaction_date=transaction.transaction_date or datetime.now(),
        status="pending"
    )
    
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    
    return new_transaction


# === ЭНДПОИНТ 3: Получить список транзакций (ЗАДАНИЕ 7.1) ===
@router.get(
    "/",
    response_model=List[TransactionResponse],
    summary="Получить список транзакций",
    description="Возвращает список транзакций пользователя с пагинацией и фильтрацией."
)
async def get_transactions(
    skip: int = Query(0, ge=0, description="Количество пропускаемых записей (offset)"),
    limit: int = Query(100, ge=1, le=1000, description="Максимальное количество записей"),
    status_filter: Optional[str] = Query(None, alias="status", description="Фильтр по статусу: pending, confirmed, rejected"),
    db: Session = Depends(get_db)
):
    """
    Возвращает список транзакций с пагинацией и фильтрацией.
    
    Параметры:
    - skip: количество пропускаемых записей (для пагинации)
    - limit: максимальное количество записей (1-1000)
    - status: фильтр по статусу (pending, confirmed, rejected)
    
    Сортировка: по transaction_date DESC (новые сначала)
    """
    # Базовый запрос
    query = db.query(Transaction)
    
    # Фильтрация по статусу, если передан
    if status_filter:
        if status_filter not in ["pending", "confirmed", "rejected"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Статус должен быть одним из: pending, confirmed, rejected"
            )
        query = query.filter(Transaction.status == status_filter)
    
    # Сортировка по transaction_date DESC (новые сначала)
    query = query.order_by(desc(Transaction.transaction_date))
    
    # Пагинация
    transactions = query.offset(skip).limit(limit).all()
    
    return transactions


# === ЭНДПОИНТ 4: Обновить транзакцию (ЗАДАНИЕ 7.2) ===
@router.patch(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Обновить транзакцию",
    description="Обновляет поля конкретной транзакции."
)
async def update_transaction(
    transaction_id: UUID,
    payload: TransactionUpdate,
    db: Session = Depends(get_db)
):
    """
    Обновляет транзакцию по ID.
    
    Если status меняется на 'confirmed' — проверяет обязательные поля (amount, category_id).
    """
    # Находим транзакцию
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Транзакция не найдена"
        )
    
    # Если статус меняется на confirmed — проверяем обязательные поля
    if payload.status == "confirmed":
        if not transaction.amount or transaction.amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Для подтверждения транзакции поле amount обязательно"
            )
        if not transaction.category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Для подтверждения транзакции поле category_id обязательно"
            )
    
    # Обновляем только переданные поля
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


# === ЭНДПОИНТ 5: Удалить транзакцию ===
@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить транзакцию",
    description="Удаляет транзакцию по ID."
)
async def delete_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db)
):
    """Удаляет транзакцию."""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Транзакция не найдена"
        )
    
    db.delete(transaction)
    db.commit()
    
    return None


# === ЭНДПОИНТ 6: Получить список категорий ===
@router.get(
    "/categories",
    response_model=List[CategoryResponse],
    summary="Получить список категорий",
    description="Возвращает все категории пользователя. Фронтенд использует это для маппинга строки от ИИ в UUID."
)
async def get_categories(db: Session = Depends(get_db)):
    """Возвращает список категорий."""
    user = get_or_create_test_user(db)
    
    categories = db.query(Category).filter(Category.user_id == user.id).all()
    
    if not categories:
        standard_categories = [
            {"name": "Еда", "icon": ""},
            {"name": "Транспорт", "icon": ""},
            {"name": "Жилье", "icon": ""},
            {"name": "Развлечения", "icon": "🎬"},
            {"name": "Здоровье", "icon": ""},
            {"name": "Одежда", "icon": "👕"},
            {"name": "Связь", "icon": ""},
            {"name": "Прочее", "icon": "📦"},
        ]
        
        for cat_data in standard_categories:
            category = Category(
                user_id=user.id,
                name=cat_data["name"],
                icon=cat_data["icon"]
            )
            db.add(category)
        
        db.commit()
        categories = db.query(Category).filter(Category.user_id == user.id).all()
    
    return categories


# === ЭНДПОИНТ 7: Создать категорию ===
@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать категорию",
    description="Создаёт новую категорию для пользователя."
)
async def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db)
):
    """Создаёт категорию."""
    user = get_or_create_test_user(db)
    
    existing = db.query(Category).filter(
        Category.user_id == user.id,
        Category.name == payload.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Категория '{payload.name}' уже существует"
        )
    
    new_category = Category(
        user_id=user.id,
        name=payload.name,
        icon=payload.icon
    )
    
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    return new_category