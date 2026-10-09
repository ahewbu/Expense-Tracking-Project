from fastapi import APIRouter, HTTPException, status
from typing import List
from uuid import UUID
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
    
    Пример ответа:
    ```json
    {
      "amount": 250,
      "category": "Еда",
      "date": null,
      "description": "Кофе"
    }
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


@router.post(
    "/",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать транзакцию",
    description="Сохраняет подтверждённую транзакцию в PostgreSQL."
)
async def create_transaction(transaction: TransactionCreate):
    """Сохраняет транзакцию после подтверждения пользователем."""
    # TODO: здесь будет вызов сервиса для сохранения в БД
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="DB integration not yet implemented"
    )


@router.get(
    "/",
    response_model=List[TransactionResponse],
    summary="Получить список транзакций",
    description="Возвращает список транзакций пользователя с пагинацией."
)
async def get_transactions(skip: int = 0, limit: int = 100):
    """Возвращает список транзакций."""
    # TODO: здесь будет запрос к БД
    return []


@router.patch(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Обновить транзакцию",
    description="Обновляет поля конкретной транзакции."
)
async def update_transaction(transaction_id: UUID, payload: TransactionUpdate):
    """Обновляет транзакцию по ID."""
    # TODO: здесь будет обновление в БД
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Transaction not found"
    )


@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить транзакцию",
    description="Удаляет транзакцию по ID."
)
async def delete_transaction(transaction_id: UUID):
    """Удаляет транзакцию."""
    # TODO: здесь будет удаление из БД
    return None


@router.get(
    "/categories",
    response_model=List[CategoryResponse],
    summary="Получить список категорий",
    description="Возвращает все категории пользователя. Фронтенд использует это для маппинга строки от ИИ в UUID."
)
async def get_categories():
    """Возвращает список категорий."""
    # TODO: здесь будет запрос к БД
    return []


@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать категорию",
    description="Создаёт новую категорию для пользователя."
)
async def create_category(payload: CategoryCreate):
    """Создаёт категорию."""
    # TODO: здесь будет создание в БД
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented"
    )
