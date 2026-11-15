from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse


# Лимитер с хранилищем в памяти (считает запросы по IP)
limiter = Limiter(key_func=get_remote_address)


# Обработчик превышения лимита — возвращает 429
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Слишком много запросов. Попробуйте позже.",
            "retry_after": "60 секунд"
        },
        headers={"Retry-After": "60"}
    )