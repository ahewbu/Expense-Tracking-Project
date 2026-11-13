from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from app.db import get_db
from app.models.models import Transaction, User
from app.services.llm_adapter import generate_expense_insights
from app.core.security import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/insights", tags=["AI Insights"])


@router.get(
    "/",
    summary="Получить AI-анализ расходов за период",
    description="Анализирует подтверждённые транзакции текущего пользователя за указанный период."
)
async def get_ai_insights(
    date_from: Optional[str] = Query(None, description="Дата начала периода (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Дата конца периода (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Определяем период (по умолчанию последние 30 дней)
    today = datetime.now().date()
    
    if date_to:
        try:
            end_dt = datetime.strptime(date_to, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Неверный формат date_to. Используйте YYYY-MM-DD")
    else:
        end_dt = today
        
    if date_from:
        try:
            start_dt = datetime.strptime(date_from, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Неверный формат date_from. Используйте YYYY-MM-DD")
    else:
        start_dt = today - timedelta(days=30)

    if start_dt > end_dt:
        raise HTTPException(status_code=400, detail="date_from не может быть позже date_to")

    logger.info(f"📊 Генерация инсайтов для пользователя: {current_user.email} (ID: {current_user.id})")

    start_datetime = datetime.combine(start_dt, datetime.min.time())
    end_datetime = datetime.combine(end_dt, datetime.max.time())

    # ПУНКТ 4: Добавлен фильтр status == "confirmed" для синхронизации со stats.py
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.status == "confirmed",  # <-- Анализируем только подтверждённые траты
        Transaction.transaction_date >= start_datetime,
        Transaction.transaction_date <= end_datetime
    ).all()

    logger.info(f"Найдено {len(transactions)} подтверждённых транзакций для анализа")

    if not transactions:
        return {
            "period": {"from_date": start_dt.strftime("%Y-%m-%d"), "to_date": end_dt.strftime("%Y-%m-%d")},
            "transactions_count": 0,
            "insights": "За выбранный период у вас пока нет подтверждённых транзакций. Добавьте и подтвердите расходы, чтобы получить AI-анализ!"
        }

    try:
        insights_text = await generate_expense_insights(
            transactions=transactions,
            start_date=start_dt.strftime("%Y-%m-%d"),
            end_date=end_dt.strftime("%Y-%m-%d")
        )
        
        return {
            "period": {
                "from_date": start_dt.strftime("%Y-%m-%d"),
                "to_date": end_dt.strftime("%Y-%m-%d")
            },
            "transactions_count": len(transactions),
            "insights": insights_text
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Критическая ошибка в /insights: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера при генерации инсайтов")