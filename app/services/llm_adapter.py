# app/services/llm_adapter.py
import os
import json
import uuid
import logging
import httpx
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Загружаем переменные из .env
load_dotenv()

# Импортируем схему, которую создала Полина
from app.schemas.transaction import TransactionParseResponse, CategoryName

# Настройка логирования
logger = logging.getLogger(__name__)

# Константы GigaChat API
GIGACHAT_AUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
GIGACHAT_CHAT_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
AUTH_KEY = os.getenv("GIGACHAT_AUTH_KEY")
SCOPE = os.getenv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS")


async def get_gigachat_token() -> str:
    """Получает токен доступа для GigaChat API."""
    if not AUTH_KEY:
        raise ValueError("GIGACHAT_AUTH_KEY не найден в .env файле")

    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "RqUID": str(uuid.uuid4()),
        "Authorization": f"Basic {AUTH_KEY}"
    }
    
    # verify=False нужен, т.к. у Сбера самоподписанные сертификаты на этом эндпоинте
    async with httpx.AsyncClient(verify=False) as client:
        response = await client.post(GIGACHAT_AUTH_URL, headers=headers, data={"scope": SCOPE})
        response.raise_for_status()
        return response.json()["access_token"]


async def parse_expense_text(text: str) -> TransactionParseResponse:
    """
    Отправляет текст в GigaChat и возвращает распарсенную транзакцию.
    """
    # 1. Загружаем промпт из файла
    prompt_path = Path(__file__).parent.parent / "prompts" / "expense_parser_v1.txt"
    with open(prompt_path, "r", encoding="utf-8") as f:
        system_prompt = f.read()

    # 2. Динамически подставляем текущую дату вместо заглушки
    today = datetime.now().strftime("%Y-%m-%d")
    # Заменяем старую дату из файла на актуальную (или добавляем, если её нет)
    if "Текущая дата:" in system_prompt:
        system_prompt = system_prompt.split("Текущая дата:")[0] + f"Текущая дата: {today}"
    else:
        system_prompt += f"\nТекущая дата: {today}"

    # 3. Получаем токен
    token = await get_gigachat_token()
    print("!!! УСПЕХ: ТОКЕН ПОЛУЧЕН, ОТПРАВЛЯЕМ ЗАПРОС В GIGACHAT !!!") # <--- ДОБАВИТЬ ЭТУ СТРОКУ

    # 4. Формируем запрос к GigaChat
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    payload = {
        "model": "GigaChat",  # Быстрая и дешевая модель для парсинга
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ],
        "temperature": 0.1,  # Низкая температура для строгого следования JSON
        "max_tokens": 300
    }

    # 5. Делаем запрос
    async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
        response = await client.post(GIGACHAT_CHAT_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()

    # 6. Извлекаем сырой текст ответа
    raw_content = result["choices"][0]["message"]["content"]
    logger.info(f"Raw LLM response: {raw_content}")

    # 7. Очистка от markdown-оберток (защита от непослушной модели)
    cleaned_content = raw_content.strip()
    if cleaned_content.startswith("```json"):
        cleaned_content = cleaned_content[7:]
    if cleaned_content.startswith("```"):
        cleaned_content = cleaned_content[3:]
    if cleaned_content.endswith("```"):
        cleaned_content = cleaned_content[:-3]
    cleaned_content = cleaned_content.strip()

    # 8. Парсинг JSON и валидация через Pydantic (схема Полины)
    try:
        data = json.loads(cleaned_content)
        
        # ВАЖНО: В схеме Полины в Enum могли затесаться пробелы (например, "Еда "). 
        # На всякий случай очищаем строку категории от пробелов перед валидацией.
        if "category" in data and isinstance(data["category"], str):
            data["category"] = data["category"].strip()
            
        return TransactionParseResponse(**data)
    
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from LLM: {cleaned_content}")
        raise ValueError(f"LLM вернул невалидный JSON: {e}")
    except Exception as e:
        logger.error(f"Validation error: {e}")
        raise ValueError(f"Ошибка валидации ответа LLM: {e}")