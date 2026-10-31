from pydantic import BaseModel, EmailStr, Field
from uuid import UUID  # <-- ДОБАВЛЕН ИМПОРТ UUID


class UserRegister(BaseModel):
    """Схема для регистрации нового пользователя."""
    email: EmailStr = Field(..., description="Email пользователя")
    password: str = Field(..., min_length=6, max_length=100, description="Пароль (мин. 6 символов)")
    full_name: str = Field(..., max_length=150, description="Полное имя")


class UserLogin(BaseModel):
    """Схема для входа пользователя."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Ответ с JWT токеном."""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Информация о пользователе (без пароля!)."""
    id: UUID  # <-- ИЗМЕНЕНО: UUID вместо str, чтобы совпадало с моделью БД
    email: str
    full_name: str
    
    class Config:
        from_attributes = True