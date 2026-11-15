import os
import json
import uuid
import logging
import httpx
import re  # <-- ДОБАВЛЕНО для пуленепробиваемого парсинга
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from typing import List

# Настраиваем базовый уровень логирования для вывода в консоль
logging.basicConfig(
    level=logging.INFO,
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


async def parse_expense_text(text: str, user_categories: List[str]) -> TransactionParseResponse:
    """
    Отправляет текст в GigaChat и возвращает распарсенную транзакцию.
    user_categories — список названий категорий пользователя из БД.
    Поддерживает 3 сценария: exact / suggested / unknown.
    """
    logger.info(f"Начало парсинга текста: '{text[:50]}...'")
    
    try:
        # 1. Загружаем промпт из файла
        prompt_path = Path(__file__).parent.parent / "prompts" / "expense_parser_v1.txt"
        with open(prompt_path, "r", encoding="utf-8") as f:
            system_prompt = f.read()

        # 2. Подставляем данные через .replace() (безопаснее, чем .format)
        today = datetime.now().strftime("%Y-%m-%d")
        categories_list = ", ".join([f'"{cat}"' for cat in user_categories])
        
        final_prompt = system_prompt
        final_prompt = final_prompt.replace("{user_categories}", categories_list)
        final_prompt = final_prompt.replace("{current_date}", today)

        # 3. Получаем токен
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
                {"role": "system", "content": final_prompt},
                {"role": "user", "content": f"Ввод: \"{text}\"\nДоступные категории: {categories_list}\nВывод:"}
            ],
            "temperature": 0.1,
            "max_tokens": 300
        }

        # 5. Делаем запрос
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            response = await client.post(GIGACHAT_CHAT_URL, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()

        # 6. Извлекаем сырой текст ответа
        raw_content = result["choices"][0]["message"]["content"]

        # === MOCK-режим для тестирования ошибок парсинга JSON ===
        if MOCK_LLM_BAD_JSON:
            logger.warning("MOCK_LLM_BAD_JSON активирован - симуляция невалидного JSON")
            raw_content = "{ это невалидный JSON"

        # 7. Очистка от markdown-оберток
        cleaned_content = raw_content.strip()
        if cleaned_content.startswith("```json"):
            cleaned_content = cleaned_content[7:]
        if cleaned_content.startswith("```"):
            cleaned_content = cleaned_content[3:]
        if cleaned_content.endswith("```"):
            cleaned_content = cleaned_content[:-3]
        cleaned_content = cleaned_content.strip()

        # 8. Парсинг JSON и валидация через Pydantic
        try:
            data = json.loads(cleaned_content)
            
            # Очищаем строки от пробелов
            if "category" in data and isinstance(data["category"], str):
                data["category"] = data["category"].strip()
            if "suggested_new_category" in data and isinstance(data["suggested_new_category"], str):
                data["suggested_new_category"] = data["suggested_new_category"].strip()
                
            return TransactionParseResponse(**data)
        
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from LLM: {cleaned_content}", exc_info=True)
            raise ValueError(f"LLM вернул невалидный JSON: {e}")
        except Exception as e:
            logger.error(f"Validation error: {e}", exc_info=True)
            raise ValueError(f"Ошибка валидации ответа LLM: {e}")
    
    except httpx.HTTPError as e:
        logger.error(f"Сбой сети при запросе к GigaChat: {e}", exc_info=True)
        return TransactionParseResponse.model_construct(
            amount=0.0,
            category="Прочее",
            date=None,
            description=f"[Сбой сети] {text[:50]}",
            category_match="unknown",
            suggested_new_category=None
        )
    except Exception as e:
        logger.error(f"Неожиданная критическая ошибка в LLM-адаптере: {e}", exc_info=True)
        return TransactionParseResponse.model_construct(
            amount=0.0,
            category="Прочее",
            date=None,
            description=f"[Сбой системы] {text[:50]}",
            category_match="unknown",
            suggested_new_category=None
        )


async def generate_expense_insights(transactions: list, start_date: str, end_date: str) -> dict:
    """
    Генерирует инсайты на основе списка транзакций за период.
    Возвращает dict с полями short_insight и full_analysis.
    (СТАРАЯ ВЕРСИЯ — оставлена для обратной совместимости)
    """
    logger.info(f"📊 Начало генерации инсайтов за период {start_date} - {end_date}")
    
    if not transactions:
        return {
            "short_insight": "За указанный период транзакции не найдены. Начните добавлять расходы, чтобы получить анализ!",
            "full_analysis": "За указанный период транзакции не найдены. Начните добавлять расходы, чтобы получить анализ!"
        }
    
    # Форматируем транзакции в читаемый текст
    transactions_text = ""
    total_amount = 0.0
    for t in transactions:
        amount = float(t.amount) if t.amount else 0.0
        total_amount += amount
        cat_name = t.category.name if t.category else "Без категории"
        date_str = t.transaction_date.strftime("%Y-%m-%d") if t.transaction_date else "Неизвестно"
        desc = t.description or "Без описания"
        transactions_text += f"- {date_str} | {cat_name} | {amount:.2f} RUB | {desc}\n"
    
    # Загружаем промпт
    prompt_path = Path(__file__).parent.parent / "prompts" / "insights_analyzer_v1.txt"
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            system_prompt = f.read()
    except FileNotFoundError:
        logger.error("Файл промпта insights_analyzer_v1.txt не найден")
        raise ValueError("Ошибка конфигурации: промпт для инсайтов не найден")
    
    # Подставляем данные в промпт
    final_prompt = system_prompt.format(
        start_date=start_date,
        end_date=end_date,
        transactions_data=transactions_text.strip()
    )
    
    # Получаем токен и делаем запрос к GigaChat
    try:
        token = await get_gigachat_token()
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {token}"
        }
        payload = {
            "model": "GigaChat",
            "messages": [
                {"role": "system", "content": "Ты полезный финансовый аналитик. Отвечай строго в формате JSON, без markdown-обёрток."},
                {"role": "user", "content": final_prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 800
        }
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            response = await client.post(GIGACHAT_CHAT_URL, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
        
        # Извлекаем текст
        raw_content = result["choices"][0]["message"]["content"].strip()
        logger.info(f"Raw LLM response: {raw_content}")
        
        # Парсим JSON (LLM может обернуть в markdown)
        cleaned = raw_content
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        try:
            insights_data = json.loads(cleaned)
            logger.info("✅ Инсайты успешно сгенерированы и распаршены")
            return {
                "short_insight": insights_data.get("short_insight", "Инсайты недоступны"),
                "full_analysis": insights_data.get("full_analysis", "Инсайты недоступны")
            }
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from LLM: {cleaned}", exc_info=True)
            # Fallback: возвращаем весь текст как full_analysis
            return {
                "short_insight": "Анализ завершён",
                "full_analysis": raw_content
            }
    except httpx.RequestError as e:
        logger.error(f"Сбой сети при запросе инсайтов: {e}", exc_info=True)
        raise ValueError("Не удалось связаться с AI-аналитиком. Проверьте подключение к интернету.")
    except Exception as e:
        logger.error(f"Ошибка при генерации инсайтов: {e}", exc_info=True)
        raise ValueError("Произошла внутренняя ошибка при анализе данных.")


async def generate_expense_insights_json(
    total: float,
    mandatory_total: float,
    mandatory_ratio: float,
    optional_total: float,
    optional_ratio: float,
    health_label: str,
    savings_base: float,
    transactions_text: str,
    start_date: str,
    end_date: str
) -> dict:
    """
    Генерирует JSON-инсайты с использованием контекста от бизнес-логики.
    (НОВАЯ ВЕРСИЯ от Анны — используется в insights.py)
    """
    logger.info(f"📊 Начало генерации JSON-инсайтов за период {start_date} - {end_date}")
    
    # 1. Загружаем промпт
    prompt_path = Path(__file__).parent.parent / "prompts" / "insights_analyzer_v1.txt"
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            system_prompt = f.read()
    except FileNotFoundError:
        logger.error("Файл промпта insights_analyzer_v1.txt не найден")
        raise ValueError("Ошибка конфигурации: промпт для инсайтов не найден")

    # 2. Подставляем данные через .replace() (чтобы не конфликтовать с JSON в промпте)
    final_prompt = system_prompt
    final_prompt = final_prompt.replace("{start_date}", start_date)
    final_prompt = final_prompt.replace("{end_date}", end_date)
    final_prompt = final_prompt.replace("{total}", f"{total:.0f}")
    final_prompt = final_prompt.replace("{mandatory_total}", f"{mandatory_total:.0f}")
    final_prompt = final_prompt.replace("{mandatory_ratio}", f"{mandatory_ratio:.1f}")
    final_prompt = final_prompt.replace("{optional_total}", f"{optional_total:.0f}")
    final_prompt = final_prompt.replace("{optional_ratio}", f"{optional_ratio:.1f}")
    final_prompt = final_prompt.replace("{health_label}", health_label)
    final_prompt = final_prompt.replace("{savings_base}", f"{savings_base:.0f}")
    final_prompt = final_prompt.replace("{transactions_text}", transactions_text.strip())

    # 3. Получаем токен
    token = await get_gigachat_token()
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    # 4. Запрос к GigaChat
    payload = {
        "model": "GigaChat",
        "messages": [
            {"role": "system", "content": "Ты заботливый финансовый консультант. Отвечай СТРОГО валидным JSON. Никаких вступлений, никаких пояснений вне фигурных скобок {}."},
            {"role": "user", "content": final_prompt}
        ],
        "temperature": 0.3,  # Снизили для более предсказуемого JSON
        "max_tokens": 1000
    }
    
    try:
        async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
            response = await client.post(GIGACHAT_CHAT_URL, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
        
        # 5. Извлекаем сырой текст
        raw_content = result["choices"][0]["message"]["content"].strip()
        logger.info(f"Raw LLM response (first 100 chars): {raw_content[:100]}")
        
        # === ПУЛЕНЕПРОБИВАЕМЫЙ ПАРСИНГ JSON ===
        # Ищем всё, что начинается с { и заканчивается на }, игнорируя любой текст до/после
        json_match = re.search(r'\{.*\}', raw_content, re.DOTALL)
        
        if json_match:
            cleaned = json_match.group(0)
        else:
            # Fallback: если фигурных скобок нет, пробуем старую очистку
            cleaned = raw_content.replace("```json", "").replace("```", "").strip()
            logger.warning("Фигурные скобки не найдены, применена базовая очистка")
        
        try:
            insights_data = json.loads(cleaned)
            logger.info("✅ JSON-инсайты успешно сгенерированы и распаршены")
            return insights_data
            
        except json.JSONDecodeError as e:
            logger.error(f"LLM вернул невалидный JSON. Ошибка: {e}")
            logger.error(f"Проблемный контент: {cleaned[:500]}...")
            raise ValueError("AI вернул некорректный формат ответа.")
            
    except httpx.RequestError as e:
        logger.error(f"Сбой сети при запросе инсайтов: {e}", exc_info=True)
        raise ValueError("Не удалось связаться с AI-аналитиком.")
    except Exception as e:
        logger.error(f"Ошибка при генерации инсайтов: {e}", exc_info=True)
        raise ValueError("Произошла внутренняя ошибка при анализе данных.")