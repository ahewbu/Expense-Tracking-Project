import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from app.api.v1.transactions import router as transactions_router
from app.api.v1.auth import router as auth_router
from app.api.v1.stats import router as stats_router
from app.api.v1.insights import router as insights_router
from app.core.rate_limiter import limiter, rate_limit_exceeded_handler

   # Тест автодеплоя Railway

app = FastAPI(
    title="Геленджик 2007 API",
    version="0.3.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# === CORS: условная настройка в зависимости от окружения ===
ENV = os.getenv("ENV", "development")

if ENV == "production":
    # Продакшен: только конкретные домены
    ALLOWED_ORIGINS = [
        "https://expense-tracking-project-production.up.railway.app",
        # Когда задеплоишь фронт на Expo web / Vercel / Netlify — добавь его домен сюда:
        # "https://твой-фронт.vercel.app",
    ]
else:
    # Разработка: разрешаем всё (для Swagger UI и локального фронта)
    ALLOWED_ORIGINS = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Rate limiter ===
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# === Роутеры ===
app.include_router(auth_router, prefix="/api/v1")
app.include_router(transactions_router, prefix="/api/v1")
app.include_router(stats_router, prefix="/api/v1")
app.include_router(insights_router, prefix="/api/v1")


@app.get("/health")
def health():
    """Проверка, что API жив."""
    return {"status": "ok", "message": "Геленджик 2007 — на связи!"}