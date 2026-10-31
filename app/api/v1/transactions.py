from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import logging

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
from app.services.llm_adapter import parse_expense_text
from app.services.asr import transcribe_audio
from app.core.security import get_current_user 

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/transactions", tags=["Transactions"])


# === ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: Найти или создать категорию по названию ===
def get_or_create_category_by_name(db: Session, category_name: str, user_id: UUID) -> Category:
    """Находит категорию по названию для конкретного пользователя или создаёт новую."""
    category = db.query(Category).filter(
        Category.name == category_name,
        Category.user_id == user_id
    ).first()
    
    if not category:
        category = Category(user_id=user_id, name=category_name, icon="")
        db.add(category)
        db.commit()
        db.refresh(category)
    
    return category


# === ЭНДПОИНТ 1: Парсинг текста через LLM (можно оставить без auth для тестов) ===
@router.post(
    "/parse",
    response_model=TransactionParseResponse,
    summary="Распарсить текст через LLM"
)
async def parse_transaction(payload: TransactionParseRequest):
    try:
        result = await parse_expense_text(payload.text)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Ошибка LLM: {str(e)}")


# === ЭНДПОИНТ 2: Транскрибация аудио (ASR) ===
@router.post(
    "/transcribe",
    summary="Транскрибация аудио в текст (ASR)"
)
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Файл должен быть аудиоформата")
    
    try:
        audio_bytes = await file.read()
        text = transcribe_audio(audio_bytes)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки аудио: {str(e)}")


# === ЭНДПОИНТ 3: Голосовой ввод (Аудио -> Текст -> Парсинг) ===
@router.post(
    "/voice",
    response_model=TransactionParseResponse,
    summary="Голосовой ввод: Аудио -> Текст -> Парсинг"
)
async def voice_transaction(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Файл должен быть аудиоформата")
    
    try:
        audio_bytes = await file.read()
        text = transcribe_audio(audio_bytes)
        logger.info(f"🎙 ASR распознал текст: '{text}'")
        
        parsed_data = await parse_expense_text(text)
        return parsed_data
    except Exception as e:
        raise HTTPException(status_code=500, detail="Внутренняя ошибка при обработке голосового ввода")


# === ЭНДПОИНТ 4: Сквозной процесс (парсинг + сохранение) ===
@router.post(
    "/parse-and-save",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Распарсить текст и сохранить транзакцию"
)
async def parse_and_save_transaction(
    payload: TransactionParseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # <-- ЗАЩИТА
):
    try:
        parsed_data = await parse_expense_text(payload.text)
        
        if parsed_data.amount is None or parsed_data.amount <= 0:
            raise HTTPException(status_code=400, detail="Сумма не распознана или некорректна")
        
        # Используем current_user.id вместо тестового пользователя!
        category = get_or_create_category_by_name(db, parsed_data.category.value, current_user.id)
        
        transaction_date = datetime.now()
        if parsed_data.date:
            try:
                parsed_date = datetime.strptime(parsed_data.date, "%Y-%m-%d")
                transaction_date = parsed_date.replace(tzinfo=transaction_date.tzinfo)
            except ValueError:
                pass
        
        new_transaction = Transaction(
            user_id=current_user.id,  # <-- ЗАЩИТА
            amount=parsed_data.amount,
            currency="RUB",
            category_id=category.id,
            description=parsed_data.description,
            source="voice" if payload.text else "llm",
            transaction_date=transaction_date,
            status="pending"
        )
        
        db.add(new_transaction)
        db.commit()
        db.refresh(new_transaction)
        return new_transaction
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при создании транзакции: {str(e)}")


# === ЭНДПОИНТ 5: Создать транзакцию вручную ===
@router.post(
    "/",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать транзакцию"
)
async def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # <-- ЗАЩИТА
):
    # Проверяем, что категория принадлежит именно этому пользователю
    category = db.query(Category).filter(
        Category.id == transaction.category_id,
        Category.user_id == current_user.id  # <-- ЗАЩИТА
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    
    new_transaction = Transaction(
        user_id=current_user.id,  # <-- ЗАЩИТА
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


# === ЭНДПОИНТ 6: Получить список транзакций ===
@router.get(
    "/",
    response_model=List[TransactionResponse],
    summary="Получить список транзакций"
)
async def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # <-- ЗАЩИТА
):
    # Фильтруем ТОЛЬКО транзакции текущего пользователя
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if status_filter:
        query = query.filter(Transaction.status == status_filter)
        
    query = query.order_by(desc(Transaction.transaction_date))
    return query.offset(skip).limit(limit).all()


# === ЭНДПОИНТ 7: Обновить транзакцию ===
@router.patch(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Обновить транзакцию"
)
async def update_transaction(
    transaction_id: UUID,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # <-- ЗАЩИТА
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id  # <-- ЗАЩИТА
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Транзакция не найдена")
    
    if payload.status == "confirmed":
        if not transaction.amount or transaction.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount обязателен для подтверждения")
        if not transaction.category_id:
            raise HTTPException(status_code=400, detail="Category обязателен для подтверждения")
            
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)
        
    db.commit()
    db.refresh(transaction)
    return transaction


# === ЭНДПОИНТ 8: Удалить транзакцию ===
@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить транзакцию"
)
async def delete_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # <-- ЗАЩИТА
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id  # <-- ЗАЩИТА
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Транзакция не найдена")
        
    db.delete(transaction)
    db.commit()
    return None


# === ЭНДПОИНТ 9: Получить список категорий ===
@router.get(
    "/categories",
    response_model=List[CategoryResponse],
    summary="Получить список категорий"
)
async def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # <-- ЗАЩИТА
):
    categories = db.query(Category).filter(Category.user_id == current_user.id).all()
    
    if not categories:
        standard = [
            {"name": "Еда", "icon": ""}, {"name": "Транспорт", "icon": "🚗"},
            {"name": "Жилье", "icon": ""}, {"name": "Развлечения", "icon": "🎬"},
            {"name": "Здоровье", "icon": ""}, {"name": "Одежда", "icon": "👕"},
            {"name": "Связь", "icon": ""}, {"name": "Прочее", "icon": "📦"},
        ]
        for cat_data in standard:
            db.add(Category(user_id=current_user.id, name=cat_data["name"], icon=cat_data["icon"]))
        db.commit()
        categories = db.query(Category).filter(Category.user_id == current_user.id).all()
        
    return categories


# === ЭНДПОИНТ 10: Создать категорию ===
@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать категорию"
)
async def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # <-- ЗАЩИТА
):
    existing = db.query(Category).filter(
        Category.user_id == current_user.id,
        Category.name == payload.name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Категория уже существует")
        
    new_cat = Category(user_id=current_user.id, name=payload.name, icon=payload.icon)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat


# === ЭНДПОИНТ 11: Удалить категорию ===
@router.delete(
    "/categories/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить категорию"
)
async def delete_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # <-- ЗАЩИТА
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")
        
    count = db.query(Transaction).filter(Transaction.category_id == category_id).count()
    if count > 0:
        raise HTTPException(status_code=400, detail=f"Категория используется в {count} транзакциях")
        
    db.delete(category)
    db.commit()
    return None