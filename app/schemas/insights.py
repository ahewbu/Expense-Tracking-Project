from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date


class CategoryStat(BaseModel):
    """Статистика по одной категории."""
    name: str = Field(..., description="Название категории")
    total: float = Field(..., description="Сумма трат")
    percentage: float = Field(..., description="Процент от общих трат")
    type: str = Field(..., description="Тип: mandatory или optional")


class FinancialHealth(BaseModel):
    """Оценка финансового здоровья."""
    score: str = Field(..., description="Уровень: excellent, good, normal, warning, critical")
    label: str = Field(..., description="Человекочитаемый заголовок")
    explanation: str = Field(..., description="Мягкое объяснение ситуации")


class Recommendation(BaseModel):
    """Конкретная рекомендация по экономии."""
    category: str = Field(..., description="Категория")
    current: float = Field(..., description="Текущая сумма трат")
    suggested: Optional[float] = Field(None, description="Рекомендуемая сумма")
    savings: Optional[float] = Field(None, description="Потенциальная экономия")
    text: str = Field(..., description="Мягкая, понятная рекомендация")


class SavingsPotential(BaseModel):
    """Потенциал экономии."""
    total: float = Field(..., description="Общая сумма возможной экономии")
    percentage: float = Field(..., description="Процент от общих трат")
    text: str = Field(..., description="Человекочитаемое объяснение")


class PeriodInfo(BaseModel):
    """Период анализа."""
    from_date: str = Field(..., description="Дата начала")
    to_date: str = Field(..., description="Дата конца")


class Summary(BaseModel):
    """Сводка по тратам."""
    total: float = Field(..., description="Общая сумма")
    transactions_count: int = Field(..., description="Количество транзакций")
    average_check: float = Field(..., description="Средний чек")
    mandatory_total: float = Field(..., description="Сумма обязательных трат")
    mandatory_ratio: float = Field(..., description="Доля обязательных (0-1)")
    optional_total: float = Field(..., description="Сумма опциональных трат")
    optional_ratio: float = Field(..., description="Доля опциональных (0-1)")


class InsightsResponse(BaseModel):
    """Полный ответ с AI-инсайтами."""
    period: PeriodInfo
    summary: Summary
    financial_health: FinancialHealth
    top_categories: List[CategoryStat]
    patterns: List[str] = Field(..., description="Выявленные паттерны")
    recommendations: List[Recommendation]
    savings_potential: SavingsPotential