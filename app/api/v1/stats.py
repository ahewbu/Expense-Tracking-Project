from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
from datetime import date

from app.db import get_db
from app.models.models import User, Category, Transaction
from app.schemas.transaction import StatsSummaryResponse, CategoryStat, PeriodInfo
from app.core.security import get_current_user

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get(
    "/summary",
    response_model=StatsSummaryResponse,
    summary="Сводная статистика по расходам",
    description="Возвращает сумму расходов по категориям с фильтрацией по датам."
)
async def get_stats_summary(
    date_from: Optional[str] = Query(None, description="Дата начала периода (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Дата конца периода (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Возвращает сводную статистику расходов пользователя.
    
    Параметры:
    - date_from: дата начала периода (опционально)
    - date_to: дата конца периода (опционально)
    
    Если даты не указаны — возвращается статистика за всё время.
    """
    # Базовый запрос: JOIN транзакций с категориями
    query = (
        db.query(
            Category.id.label("category_id"),
            Category.name.label("category_name"),
            func.sum(Transaction.amount).label("total")
        )
        .join(Transaction, Category.id == Transaction.category_id)
        .filter(Transaction.user_id == current_user.id)
        .filter(Transaction.status == "confirmed")  # Только подтверждённые транзакции
    )
    
    # Фильтрация по датам
    if date_from:
        try:
            from_date = date.fromisoformat(date_from)
            query = query.filter(Transaction.transaction_date >= from_date)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Неверный формат даты date_from: {date_from}. Ожидается YYYY-MM-DD"
            )
    
    if date_to:
        try:
            to_date = date.fromisoformat(date_to)
            query = query.filter(Transaction.transaction_date <= to_date)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Неверный формат даты date_to: {date_to}. Ожидается YYYY-MM-DD"
            )
    
    # Группировка по категории
    query = query.group_by(Category.id, Category.name).order_by(func.sum(Transaction.amount).desc())
    
    results = query.all()
    
    # Формируем ответ
    by_category = [
        CategoryStat(
            category_id=row.category_id,
            category_name=row.category_name,
            total=float(row.total)
        )
        for row in results
    ]
    
    total = sum(cat.total for cat in by_category)
    
    return StatsSummaryResponse(
        period=PeriodInfo(from_date=date_from, to_date=date_to),
        total=total,
        by_category=by_category
    )