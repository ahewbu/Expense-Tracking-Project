import re
from html import escape


def sanitize_text(text: str) -> str:
    """
    Санитизирует текст от XSS-инъекций.
    - Экранирует HTML-символы (< > & " ')
    - Удаляет script-теги
    - Ограничивает длину до 1000 символов
    """
    if not text:
        return text
    
    # Ограничение длины
    text = text[:1000]
    
    # Экранирование HTML-символов
    text = escape(text)
    
    # Удаление script-тегов (дополнительная защита)
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    
    return text.strip()