from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="client")
    tenant_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("tenants.id"), nullable=True)
    is_first_login: Mapped[bool] = mapped_column(Boolean, default=True)


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=True)
    plan: Mapped[str] = mapped_column(String(50), default="FREE")
    status: Mapped[str] = mapped_column(String(50), default="Ativo")
    owner_email: Mapped[str] = mapped_column(String(255), default="")
    business_name: Mapped[str] = mapped_column(String(255), default="")
    address: Mapped[str] = mapped_column(String(255), default="")
    color_hex: Mapped[str] = mapped_column(String(7), default="#ff5722")
    secondary_color_hex: Mapped[str | None] = mapped_column(String(7), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[int] = mapped_column(
        Integer,
        default=lambda: int(_utcnow().timestamp() * 1000),
    )

    products: Mapped[list[Product]] = relationship("Product", back_populates="tenant", cascade="all, delete-orphan")
    neighborhoods: Mapped[list[Neighborhood]] = relationship(
        "Neighborhood", back_populates="tenant", cascade="all, delete-orphan"
    )
    orders: Mapped[list[Order]] = relationship("Order", back_populates="tenant", cascade="all, delete-orphan")
    subscriptions: Mapped[list[Subscription]] = relationship(
        "Subscription", back_populates="tenant", cascade="all, delete-orphan"
    )


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    price: Mapped[float] = mapped_column(Float, default=0.0)
    category: Mapped[str] = mapped_column(String(100), default="Gás")
    image_url: Mapped[str] = mapped_column(String(512), default="")
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    is_order_bump: Mapped[bool] = mapped_column(Boolean, default=False)
    tenant_id: Mapped[int] = mapped_column(Integer, ForeignKey("tenants.id"), nullable=False)

    tenant: Mapped[Tenant] = relationship("Tenant", back_populates="products")


class Neighborhood(Base):
    __tablename__ = "neighborhoods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    delivery_fee: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(50), default="available")
    tenant_id: Mapped[int] = mapped_column(Integer, ForeignKey("tenants.id"), nullable=False)

    tenant: Mapped[Tenant] = relationship("Tenant", back_populates="neighborhoods")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)

    order: Mapped[Order] = relationship("Order", back_populates="items")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_number: Mapped[str] = mapped_column(String(50), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(50), default="")
    address_street: Mapped[str] = mapped_column(String(255), default="")
    address_number: Mapped[str] = mapped_column(String(50), default="")
    address_neighborhood: Mapped[str] = mapped_column(String(255), default="")
    address_complement: Mapped[str] = mapped_column(String(255), default="")
    address_reference: Mapped[str] = mapped_column(String(255), default="")
    payment_method: Mapped[str] = mapped_column(String(50), default="Pix")
    change_for: Mapped[float] = mapped_column(Float, default=0.0)
    subtotal: Mapped[float] = mapped_column(Float, default=0.0)
    delivery_fee: Mapped[float] = mapped_column(Float, default=0.0)
    total: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(50), default="Novo")
    tenant_id: Mapped[int] = mapped_column(Integer, ForeignKey("tenants.id"), nullable=False)
    created_at: Mapped[int] = mapped_column(
        Integer,
        default=lambda: int(_utcnow().timestamp() * 1000),
    )

    tenant: Mapped[Tenant] = relationship("Tenant", back_populates="orders")
    items: Mapped[list[OrderItem]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[int] = mapped_column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan: Mapped[str] = mapped_column(String(50), default="PRO")
    status: Mapped[str] = mapped_column(String(50), default="active")
    cakto_purchase_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[int] = mapped_column(
        Integer,
        default=lambda: int(_utcnow().timestamp() * 1000),
    )
    updated_at: Mapped[int] = mapped_column(
        Integer,
        default=lambda: int(_utcnow().timestamp() * 1000),
        onupdate=lambda: int(_utcnow().timestamp() * 1000),
    )

    tenant: Mapped[Tenant] = relationship("Tenant", back_populates="subscriptions")
