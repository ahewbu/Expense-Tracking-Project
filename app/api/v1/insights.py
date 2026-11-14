from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import re

from app.db import get_db
from app.models.models import Transaction, User
from app.services.llm_adapter import generate_expense_insights_json
from app.core.security import get_current_user
from app.schemas.insights import (
    InsightsResponse, PeriodInfo, Summary, FinancialHealth,
    CategoryStat, Recommendation, SavingsPotential
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/insights", tags=["AI Insights"])

# Категории обязательных трат
MANDATORY_CATEGORIES = {"Жилье", "Транспорт", "Связь", "Здоровье"}

# Ключевые слова для анализа "Еды"
FOOD_MANDATORY_KEYWORDS = {"продукт", "магазин", "супермаркет", "хлеб", "молоко", "овощ", "фрукт", "мясо", "рыба", "круп", "макарон"}
FOOD_OPTIONAL_KEYWORDS = {"ресторан", "кафе", "доставк", "пицц", "суш", "ролл", "бургер", "кофе", "чай", "десерт", "морожен"}


def classify_transaction(transaction: Transaction) -> str:
    """Определяет тип транзакции: mandatory или optional."""
    category_name = transaction.category.name if transaction.category else "Прочее"
    description = (transaction.description or "").lower()
    
    # Если категория явно обязательная
    if category_name in MANDATORY_CATEGORIES:
        return "mandatory"
    
    # Если категория "Еда" — анализируем описание
    if category_name == "Еда":
        if any(keyword in description for keyword in FOOD_OPTIONAL_KEYWORDS):
            return "optional"
        if any(keyword in description for keyword in FOOD_MANDATORY_KEYWORDS):
            return "mandatory"
        # По умолчанию считаем обязательной (продукты)
        return "mandatory"
    
    # Остальные категории — опциональные
    return "optional"


def calculate_financial_health(mandatory_ratio: float) -> Dict[str, str]:
    """
    Оценивает финансовое здоровье на основе доли обязательных трат.
    mandatory_ratio передаётся как число от 0.0 до 1.0 (например, 0.5 = 50%)
    """
    
    # ОТЛИЧНОЕ: Обязательных меньше 50%. 
    # Это значит, что у пользователя теоретически есть 30% на желания и 20% на накопления.
    if mandatory_ratio < 0.5:
        return {
            "score": "excellent",
            "label": "Отличное",
            "explanation": "Ваши базовые расходы составляют менее половины бюджета. Это идеальная ситуация, которая оставляет достаточно места для накоплений и инвестиций."
        }
    
    # ХОРОШЕЕ: Обязательных 50-60%. 
    # Это здоровый баланс, но зона для накоплений уже немного сужается.
    elif mandatory_ratio < 0.6:
        return {
            "score": "good",
            "label": "Хорошее",
            "explanation": "Обязательные траты в пределах 50-60%. Это здоровый баланс, но старайтесь регулярно откладывать хотя бы 10-15% дохода."
        }
    
    # НОРМАЛЬНОЕ: Обязательных 60-75%.
    # Бюджет натянут. На желания и накопления остаётся мало места.
    elif mandatory_ratio < 0.75:
        return {
            "score": "normal",
            "label": "Нормальное",
            "explanation": "Обязательные траты занимают 60-75% бюджета. Это допустимо, но финансовая подушка безопасности формируется медленно. Будьте внимательны к опциональным тратам."
        }
    
    # ТРЕБУЕТ ВНИМАНИЯ: Обязательных 75-85%.
    # Опасная зона. Любая непредвиденная трата может привести к долгу.
    elif mandatory_ratio < 0.85:
        return {
            "score": "warning",
            "label": "Требует внимания",
            "explanation": "Обязательные траты занимают 75-85% бюджета. Это опасная зона: у вас почти не остаётся денег на накопления. Любая непредвиденная ситуация может создать финансовые трудности."
        }
    
    # КРИТИЧЕСКОЕ: Обязательных больше 85%.
    # Жизнь от зарплаты до зарплаты.
    else:
        return {
            "score": "critical",
            "label": "Критическое",
            "explanation": "Обязательные траты превышают 85% бюджета. Это критическая ситуация, означающая жизнь 'от зарплаты до зарплаты'. Рекомендуется срочно пересмотреть базовые расходы или найти способы увеличить доход."
        }


@router.get(
    "/",
    response_model=InsightsResponse,
    summary="Получить AI-анализ расходов за период",
    description="Анализирует подтверждённые транзакции текущего пользователя за указанный период."
)
async def get_ai_insights(
    date_from: Optional[str] = Query(None, description="Дата начала периода (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Дата конца периода (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Определяем период
    today = datetime.now().date()
    
    if date_to:
        try:
            end_dt = datetime.strptime(date_to, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Неверный формат date_to")
    else:
        end_dt = today
        
    if date_from:
        try:
            start_dt = datetime.strptime(date_from, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Неверный формат date_from")
    else:
        start_dt = today - timedelta(days=30)

    if start_dt > end_dt:
        raise HTTPException(status_code=400, detail="date_from не может быть позже date_to")

    # 2. Получаем транзакции
    start_datetime = datetime.combine(start_dt, datetime.min.time())
    end_datetime = datetime.combine(end_dt, datetime.max.time())

    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.status == "confirmed",
        Transaction.transaction_date >= start_datetime,
        Transaction.transaction_date <= end_datetime
    ).all()

    if not transactions:
        raise HTTPException(status_code=404, detail="Нет подтверждённых транзакций за выбранный период")

    # 3. Бизнес-логика: считаем метрики
    total = 0.0
    mandatory_total = 0.0
    optional_total = 0.0
    category_totals: Dict[str, Dict] = {}
    
    for t in transactions:
        amount = float(t.amount) if t.amount else 0.0
        total += amount
        
        tx_type = classify_transaction(t)
        if tx_type == "mandatory":
            mandatory_total += amount
        else:
            optional_total += amount
        
        # Статистика по категориям
        cat_name = t.category.name if t.category else "Прочее"
        if cat_name not in category_totals:
            category_totals[cat_name] = {"total": 0.0, "type": tx_type}
        category_totals[cat_name]["total"] += amount
    
    # 4. Вычисляем ratios и health
    mandatory_ratio = (mandatory_total / total * 100) if total > 0 else 0
    optional_ratio = (optional_total / total * 100) if total > 0 else 0
    health = calculate_financial_health(mandatory_ratio / 100)
    
    # 5. Базовый savings_potential (30% от опциональных)
    savings_base = optional_total * 0.3
    
    # 6. Формируем топ категорий
    top_categories = []
    for cat_name, data in sorted(category_totals.items(), key=lambda x: x[1]["total"], reverse=True)[:5]:
        percentage = (data["total"] / total * 100) if total > 0 else 0
        top_categories.append(CategoryStat(
            name=cat_name,
            total=data["total"],
            percentage=percentage,
            type=data["type"]
        ))
    
    # 7. Формируем текст транзакций для промпта
    transactions_text = ""
    for t in transactions[:20]:  # Ограничиваем для промпта
        amount = float(t.amount) if t.amount else 0.0
        cat_name = t.category.name if t.category else "Прочее"
        date_str = t.transaction_date.strftime("%Y-%m-%d") if t.transaction_date else "Неизвестно"
        desc = t.description or "Без описания"
        tx_type = classify_transaction(t)
        transactions_text += f"- {date_str} | {cat_name} | {amount:.0f} RUB | {desc} [{tx_type}]\n"
    
    # 8. Вызываем LLM
    try:
        llm_response = await generate_expense_insights_json(
            total=total,
            mandatory_total=mandatory_total,
            mandatory_ratio=mandatory_ratio,
            optional_total=optional_total,
            optional_ratio=optional_ratio,
            health_label=health["label"],
            savings_base=savings_base,
            transactions_text=transactions_text,
            start_date=start_dt.strftime("%Y-%m-%d"),
            end_date=end_dt.strftime("%Y-%m-%d")
        )
        
        # 9. Собираем финальный ответ
        return InsightsResponse(
            period=PeriodInfo(
                from_date=start_dt.strftime("%Y-%m-%d"),
                to_date=end_dt.strftime("%Y-%m-%d")
            ),
            summary=Summary(
                total=total,
                transactions_count=len(transactions),
                average_check=total / len(transactions) if transactions else 0,
                mandatory_total=mandatory_total,
                mandatory_ratio=mandatory_ratio,
                optional_total=optional_total,
                optional_ratio=optional_ratio
            ),
            financial_health=FinancialHealth(
                score=health["score"],
                label=health["label"],
                explanation=health["explanation"]
            ),
            top_categories=top_categories,
            patterns=llm_response.get("patterns", []),
            recommendations=[Recommendation(**rec) for rec in llm_response.get("recommendations", [])],
            savings_potential=SavingsPotential(
                total=savings_base,
                percentage=(savings_base / total * 100) if total > 0 else 0,
                text=llm_response.get("savings_potential_text", f"При оптимизации опциональных трат вы можете сэкономить около {savings_base:.0f} RUB")
            )
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Критическая ошибка в /insights: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")