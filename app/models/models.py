import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    ForeignKey,
    String,
    Numeric,
    DateTime,
    Text,
    func,
    Column
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db import Base


# === МОДЕЛЬ: ПОЛЬЗОВАТЕЛЬ ===
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(150))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи с другими таблицами
    categories = relationship(
        "Category", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    transactions = relationship(
        "Transaction", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )


# === МОДЕЛЬ: КАТЕГОРИЯ ===
class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")


# === МОДЕЛЬ: ТРАНЗАКЦИЯ ===
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="RUB")
    category_id = Column(ForeignKey("categories.id", ondelete="SET NULL"), index=True)
    description = Column(Text)
    source = Column(String(20), nullable=False, default="text")
    transaction_date = Column(DateTime(timezone=True), nullable=False, default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), nullable=False, default="pending")

    # Связи
    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")