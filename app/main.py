from fastapi import FastAPI
from app.api.v1.transactions import router as transactions_router

app = FastAPI(
    title="Геленджик 2007 API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

app.include_router(transactions_router, prefix="/api/v1")


@app.get("/health")
def health():
    """Проверка, что API жив."""
    return {"status": "ok", "message": "Геленджик 2007 — на связи!"}
