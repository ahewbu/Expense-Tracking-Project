# app/services/llm_adapter.py
import os
import json
import uuid
import logging
import httpx
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Настраиваем базовый уровень логирования для вывода в консоль
logging.basicConfig(
    level=logging.INFO,  # Показывать INFO, WARNING, ERROR
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

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

# === ЗАМЕЧАНИЕ 4: Флаг для тестирования сбоев парсинга JSON ===
MOCK_LLM_BAD_JSON = os.getenv("MOCK_LLM_BAD_JSON", "false").lower() == "true"


async def get_gigachat_token() -> str:
    """Получает токен доступа для GigaChat API."""
    logger.info("Начало получения токена GigaChat")
    
    if not AUTH_KEY:
        logger.error("GIGACHAT_AUTH_KEY не найден в .env файле")
        raise ValueError("GIGACHAT_AUTH_KEY не найден в .env файле")

    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "RqUID": str(uuid.uuid4()),
        "Authorization": f"Basic {AUTH_KEY}"
    }
    
    try:
        # verify=False нужен, т.к. у Сбера самоподписанные сертификаты на этом эндпоинте
        async with httpx.AsyncClient(verify=False) as client:
            logger.debug(f"Отправка запроса на {GIGACHAT_AUTH_URL}")
            response = await client.post(GIGACHAT_AUTH_URL, headers=headers, data={"scope": SCOPE})
            response.raise_for_status()
            token = response.json()["access_token"]
            logger.info("Токен GigaChat успешно получен")
            return token
    except httpx.HTTPError as e:
        logger.error(f"HTTP ошибка при получении токена: {e}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Неожиданная ошибка при получении токена: {e}", exc_info=True)
        raise


async def parse_expense_text(text: str) -> TransactionParseResponse:
    """
    Отправляет текст в GigaChat и возвращает распарсенную транзакцию.
    """
    logger.info(f"Начало парсинга текста: '{text[:50]}...'")
    
    try:
        # 1. Загружаем промпт из файла
        logger.debug("Загрузка промпта из файла")
        prompt_path = Path(__file__).parent.parent / "prompts" / "expense_parser_v1.txt"
        with open(prompt_path, "r", encoding="utf-8") as f:
            system_prompt = f.read()
        logger.debug("Промпт успешно загружен")

        # 2. Динамически подставляем текущую дату вместо заглушки
        today = datetime.now().strftime("%Y-%m-%d")
        if "Текущая дата:" in system_prompt:
            system_prompt = system_prompt.split("Текущая дата:")[0] + f"Текущая дата: {today}"
        else:
            system_prompt += f"\nТекущая дата: {today}"
        logger.debug(f"Текущая дата в промпте: {today}")

        # 3. Получаем токен
        logger.debug("Получение токена GigaChat")
        token = await get_gigachat_token()

        # 4. Формируем запрос к GigaChat
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {token}"
        }
        
        payload = {
            "model": "GigaChat",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            "temperature": 0.1,
            "max_tokens": 300
        }
        
        logger.debug(f"Отправка запроса в GigaChat (модель: GigaChat)")

        # 5. Делаем запрос
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            response = await client.post(GIGACHAT_CHAT_URL, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()

        logger.info("Ответ от GigaChat получен успешно")

        # 6. Извлекаем сырой текст ответа
        raw_content = result["choices"][0]["message"]["content"]
        logger.debug(f"Raw LLM response: {raw_content}")

        # === ЗАМЕЧАНИЕ 4: MOCK-режим для тестирования ошибок парсинга ===
        if MOCK_LLM_BAD_JSON:
            logger.warning("MOCK_LLM_BAD_JSON активирован - симуляция невалидного JSON")
            raw_content = "{ это невалидный JSON"

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
            logger.info("JSON успешно распаршен")
            
            # ВАЖНО: В схеме Полины в Enum могли затесаться пробелы (например, "Еда "). 
            # На всякий случай очищаем строку категории от пробелов перед валидацией.
            if "category" in data and isinstance(data["category"], str):
                data["category"] = data["category"].strip()
                
            logger.info("Валидация данных через Pydantic успешна")
            return TransactionParseResponse(**data)
        
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from LLM: {cleaned_content}", exc_info=True)
            raise ValueError(f"LLM вернул невалидный JSON: {e}")
        except Exception as e:
            logger.error(f"Validation error: {e}", exc_info=True)
            raise ValueError(f"Ошибка валидации ответа LLM: {e}")
    
    except httpx.HTTPError as e:
        logger.error(f"Сбой сети при запросе к GigaChat: {e}", exc_info=True)
        logger.warning("Активирован FALLBACK-режим: возвращаем транзакцию со статусом pending (валидация пропущена)")
        
        # Используем model_construct, чтобы обойти строгий валидатор amount > 0
        return TransactionParseResponse.model_construct(
            amount=0.0,
            category=CategoryName.OTHER,
            date=None,
            description=f"[Сбой сети] {text[:50]}"
        )
    
    except Exception as e:
        # Ловим вообще всё остальное, чтобы гарантировать, что приложение не упадёт с 500
        logger.error(f"Неожиданная критическая ошибка в LLM-адаптере: {e}", exc_info=True)
        logger.warning("Активирован FALLBACK-режим из-за непредвиденной ошибки")
        
        return TransactionParseResponse.model_construct(
            amount=0.0,
            category=CategoryName.OTHER,
            date=None,
            description=f"[Сбой системы] {text[:50]}"
        )