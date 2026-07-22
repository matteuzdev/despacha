from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


def _alias_generator(key: str) -> str:
    """Convert snake_case to camelCase."""
    parts = key.rstrip("_").split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=_alias_generator,
        populate_by_name=True,
        from_attributes=True,
    )


# ── User ──────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: str
    password_hash: str = Field(..., alias="passwordHash")
    role: str = "client"
    tenant_id: int | None = Field(None, alias="tenantId")
    is_first_login: bool = Field(True, alias="isFirstLogin")


class UserResponse(BaseSchema):
    id: int
    name: str
    email: str
    password_hash: str = Field(..., alias="passwordHash")
    role: str
    tenant_id: int | None = Field(None, alias="tenantId")
    is_first_login: bool = Field(..., alias="isFirstLogin")


class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class RegisterResponse(BaseModel):
    user: UserResponse
    tenant: TenantResponse


# ── Tenant ────────────────────────────────────────────────

class TenantCreate(BaseModel):
    name: str
    slug: str
    plan: str = "FREE"
    status: str = "Ativo"
    owner_email: str = ""
    business_name: str = ""
    address: str = ""
    color_hex: str = "#ff5722"
    secondary_color_hex: str | None = Field(None, alias="secondaryColorHex")
    logo_url: str | None = Field(None, alias="logoUrl")
    cover_url: str | None = Field(None, alias="coverUrl")


class TenantUpdate(BaseSchema):
    name: str | None = None
    slug: str | None = None
    plan: str | None = None
    status: str | None = None
    owner_email: str | None = Field(None, alias="ownerEmail")
    business_name: str | None = Field(None, alias="businessName")
    address: str | None = None
    color_hex: str | None = Field(None, alias="colorHex")
    secondary_color_hex: str | None = Field(None, alias="secondaryColorHex")
    logo_url: str | None = Field(None, alias="logoUrl")
    cover_url: str | None = Field(None, alias="coverUrl")


class TenantResponse(BaseSchema):
    id: int
    name: str
    slug: str | None = None
    plan: str
    status: str
    owner_email: str = Field(..., alias="ownerEmail")
    business_name: str = Field(..., alias="businessName")
    address: str
    color_hex: str = Field(..., alias="colorHex")
    secondary_color_hex: str | None = Field(None, alias="secondaryColorHex")
    logo_url: str | None = Field(None, alias="logoUrl")
    cover_url: str | None = Field(None, alias="coverUrl")
    created_at: int = Field(..., alias="createdAt")


# ── Product ───────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    description: str = ""
    price: float = 0.0
    category: str = "Gás"
    image_url: str = ""
    is_available: bool = True
    is_favorite: bool = False
    is_order_bump: bool = False
    tenant_id: int = Field(..., alias="tenantId")


class ProductUpdate(BaseSchema):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    category: str | None = None
    image_url: str | None = Field(None, alias="imageUrl")
    is_available: bool | None = Field(None, alias="isAvailable")
    is_favorite: bool | None = Field(None, alias="isFavorite")
    is_order_bump: bool | None = Field(None, alias="isOrderBump")


class ProductResponse(BaseSchema):
    id: int
    name: str
    description: str
    price: float
    category: str
    image_url: str = Field(..., alias="imageUrl")
    is_available: bool = Field(..., alias="isAvailable")
    is_favorite: bool = Field(..., alias="isFavorite")
    is_order_bump: bool = Field(..., alias="isOrderBump")
    tenant_id: int = Field(..., alias="tenantId")


# ── Neighborhood ──────────────────────────────────────────

class NeighborhoodCreate(BaseModel):
    name: str
    delivery_fee: float = 0.0
    status: str = "available"
    tenant_id: int = Field(..., alias="tenantId")


class NeighborhoodUpdate(BaseSchema):
    name: str | None = None
    delivery_fee: float | None = Field(None, alias="deliveryFee")
    status: str | None = None


class NeighborhoodResponse(BaseSchema):
    id: int
    name: str
    delivery_fee: float = Field(..., alias="deliveryFee")
    status: str
    tenant_id: int = Field(..., alias="tenantId")


# ── Order ─────────────────────────────────────────────────

class OrderItemSchema(BaseSchema):
    product_id: int = Field(..., alias="productId")
    product_name: str = Field(..., alias="productName")
    quantity: int
    unit_price: float = Field(..., alias="unitPrice")
    total_price: float = Field(..., alias="totalPrice")


class OrderCreateRequest(BaseModel):
    cart_items: list[OrderItemSchema] = Field(..., alias="cartItems")
    payload: CheckoutPayload
    tenant_id: int = Field(1, alias="tenantId")


class CheckoutPayload(BaseModel):
    customer_name: str = Field("", alias="customerName")
    customer_phone: str = Field("", alias="customerPhone")
    address_street: str = Field("", alias="addressStreet")
    address_number: str = Field("", alias="addressNumber")
    address_neighborhood: dict[str, Any] = Field(default_factory=dict, alias="addressNeighborhood")
    address_complement: str = Field("", alias="addressComplement")
    address_reference: str = Field("", alias="addressReference")
    payment_method: str = Field("Pix", alias="paymentMethod")
    change_for: float = Field(0.0, alias="changeFor")


class OrderStatusUpdate(BaseModel):
    status: str


class OrderResponse(BaseSchema):
    id: int
    order_number: str = Field(..., alias="orderNumber")
    customer_name: str = Field(..., alias="customerName")
    customer_phone: str = Field(..., alias="customerPhone")
    address_street: str = Field(..., alias="addressStreet")
    address_number: str = Field(..., alias="addressNumber")
    address_neighborhood: str = Field(..., alias="addressNeighborhood")
    address_complement: str = Field(..., alias="addressComplement")
    address_reference: str = Field(..., alias="addressReference")
    payment_method: str = Field(..., alias="paymentMethod")
    change_for: float = Field(..., alias="changeFor")
    subtotal: float
    delivery_fee: float = Field(..., alias="deliveryFee")
    total: float
    status: str
    items: list[OrderItemSchema]
    tenant_id: int = Field(..., alias="tenantId")
    created_at: int = Field(..., alias="createdAt")


# ── Subscription ──────────────────────────────────────────

class SubscriptionResponse(BaseSchema):
    id: int
    tenant_id: int = Field(..., alias="tenantId")
    plan: str
    status: str
    cakto_purchase_id: str | None = Field(None, alias="caktoPurchaseId")
    created_at: int = Field(..., alias="createdAt")
    updated_at: int = Field(..., alias="updatedAt")


# ── Webhook ──────────────────────────────────────────────

class WebhookCakto(BaseModel):
    event: str | None = None
    type: str | None = None
    purchase: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None
    id: str | None = None
    tenant_id: str | int | None = None
    plan: str | None = None
    data: dict[str, Any] | None = None


# ── State (full dump) ────────────────────────────────────

class BackendState(BaseSchema):
    users: list[UserResponse]
    tenants: list[TenantResponse]
    products: list[ProductResponse]
    neighborhoods: list[NeighborhoodResponse]
    orders: list[OrderResponse]
    subscriptions: list[SubscriptionResponse]
