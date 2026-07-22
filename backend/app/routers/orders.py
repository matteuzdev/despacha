from __future__ import annotations

import math
import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Neighborhood as NeighborhoodModel
from app.models import Order, OrderItem
from app.schemas import (
    OrderCreateRequest,
    OrderItemSchema,
    OrderResponse,
    OrderStatusUpdate,
)

router = APIRouter()


def _money(value: float) -> float:
    return math.floor(value * 100) / 100


@router.post("/api/orders", response_model=OrderResponse, status_code=201)
async def create_order(
    body: OrderCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    cart_items = body.cart_items
    payload = body.payload
    tenant_id = body.tenant_id

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    subtotal = _money(sum(item.total_price for item in cart_items))

    neighborhood_name = payload.address_neighborhood.get("name", "")
    delivery_fee = float(payload.address_neighborhood.get("deliveryFee", 0))
    neighborhood_status = payload.address_neighborhood.get("status", "available")
    order_status = "Aguardando análise" if neighborhood_status == "consult" else "Novo"

    order = Order(
        order_number=f"REQ-{random.randint(1000, 9999)}",
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        address_street=payload.address_street,
        address_number=payload.address_number,
        address_neighborhood=neighborhood_name,
        address_complement=payload.address_complement,
        address_reference=payload.address_reference,
        payment_method=payload.payment_method,
        change_for=_money(payload.change_for),
        subtotal=subtotal,
        delivery_fee=_money(delivery_fee),
        total=_money(subtotal + delivery_fee),
        status=order_status,
        tenant_id=tenant_id,
    )
    db.add(order)
    await db.flush()

    for item in cart_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=item.product_name,
            quantity=item.quantity,
            unit_price=_money(item.unit_price),
            total_price=_money(item.total_price),
        )
        db.add(order_item)

    await db.flush()
    await db.refresh(order)
    return OrderResponse.model_validate(order)


@router.patch("/api/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
) -> OrderResponse:
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = body.status
    await db.flush()
    await db.refresh(order)
    return OrderResponse.model_validate(order)
