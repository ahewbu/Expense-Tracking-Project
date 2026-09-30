from fastapi import FastAPI

app = FastAPI(title="Геленджик 2007 API", version="0.1.0")


@app.get("/health")
def health():
    """Проверка, что API жив."""
    return {"status": "ok", "message": "Геленджик 2007 — на связи!"}