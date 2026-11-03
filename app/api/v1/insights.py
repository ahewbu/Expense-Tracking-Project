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
    description="Анализирует транзакции текущего авторизованного пользователя за указанный период."
)
async def get_ai_insights(
    start_date: Optional[str] = Query(None, description="Начало периода в формате YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Конец периода в формате YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Определяем период (по умолчанию последние 30 дней)
    today = datetime.now().date()
    
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Неверный формат end_date. Используйте YYYY-MM-DD")
    else:
        end_dt = today
    
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Неверный формат start_date. Используйте YYYY-MM-DD")
    else:
        start_dt = today - timedelta(days=30)
    
    if start_dt > end_dt:
        raise HTTPException(status_code=400, detail="start_date не может быть позже end_date")
    
    # 2. Логируем, для кого генерируем инсайты
    logger.info(f"📊 Генерация инсайтов для пользователя: {current_user.email} (ID: {current_user.id})")
    
    # 3. Делаем запрос к БД строго для транзакций ТЕКУЩЕГО пользователя
    start_datetime = datetime.combine(start_dt, datetime.min.time())
    end_datetime = datetime.combine(end_dt, datetime.max.time())
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_date >= start_datetime,
        Transaction.transaction_date <= end_datetime
    ).all()
    
    logger.info(f"Найдено {len(transactions)} транзакций для анализа")
    
    # Если транзакций нет, возвращаем дружелюбное сообщение без вызова LLM
    if not transactions:
        return {
            "period": {"start": start_dt.strftime("%Y-%m-%d"), "end": end_dt.strftime("%Y-%m-%d")},
            "transactions_count": 0,
            "short_insight": "За выбранный период у вас пока нет транзакций. Добавьте расходы, чтобы получить AI-анализ!",
            "full_analysis": "За выбранный период у вас пока нет транзакций. Добавьте расходы, чтобы получить AI-анализ!"
        }
    
    # 4. Вызываем LLM для генерации текста
    try:
        insights_data = await generate_expense_insights(
            transactions=transactions,
            start_date=start_dt.strftime("%Y-%m-%d"),
            end_date=end_dt.strftime("%Y-%m-%d")
        )
        return {
            "period": {
                "start": start_dt.strftime("%Y-%m-%d"),
                "end": end_dt.strftime("%Y-%m-%d")
            },
            "transactions_count": len(transactions),
            "short_insight": insights_data["short_insight"],
            "full_analysis": insights_data["full_analysis"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Критическая ошибка в /insights: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера при генерации инсайтов")