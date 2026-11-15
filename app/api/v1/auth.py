from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.models import User
from app.schemas.auth import UserRegister, TokenResponse, UserResponse
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.core.default_categories import create_default_categories
from app.core.rate_limiter import limiter 

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Регистрация нового пользователя",
    description="Создаёт нового пользователя с хешированным паролем. Лимит: 10 в минуту."
)
@limiter.limit("10/minute") 
async def register(
    request: Request, 
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """Регистрация нового пользователя. Лимит: 10 в минуту."""
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )
    
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    create_default_categories(db, new_user.id)
    
    return new_user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Вход пользователя",
    description="Возвращает JWT токен при успешной аутентификации. Лимит: 5 попыток в минуту."
)
@limiter.limit("5/minute") 
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Вход пользователя через OAuth2 форму. Лимит: 5 в минуту."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Получить текущего пользователя",
    description="Возвращает информацию о текущем пользователе (требует токен)."
)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user