from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Neighborhood, Order, Product, Subscription, Tenant, User
from app.schemas import (
    BackendState,
    NeighborhoodResponse,
    OrderResponse,
    ProductResponse,
    SubscriptionResponse,
    TenantResponse,
    UserResponse,
)

router = APIRouter()


@router.get("/api/state", response_model=BackendState)
async def get_state(db: AsyncSession = Depends(get_db)) -> BackendState:
    """Retorna o dump completo do banco para hidratar o frontend."""

    users_result = await db.execute(select(User))
    users = users_result.scalars().all()

    tenants_result = await db.execute(select(Tenant))
    tenants = tenants_result.scalars().all()

    products_result = await db.execute(select(Product))
    products = products_result.scalars().all()

    neighborhoods_result = await db.execute(select(Neighborhood))
    neighborhoods = neighborhoods_result.scalars().all()

    orders_result = await db.execute(
        select(Order).options(selectinload(Order.items))
    )
    orders = orders_result.unique().scalars().all()

    subscriptions_result = await db.execute(select(Subscription))
    subscriptions = subscriptions_result.scalars().all()

    return BackendState(
        users=[UserResponse.model_validate(u) for u in users],
        tenants=[TenantResponse.model_validate(t) for t in tenants],
        products=[ProductResponse.model_validate(p) for p in products],
        neighborhoods=[NeighborhoodResponse.model_validate(n) for n in neighborhoods],
        orders=[OrderResponse.model_validate(o) for o in orders],
        subscriptions=[SubscriptionResponse.model_validate(s) for s in subscriptions],
    )


@router.get("/api/health")
async def health() -> dict[str, bool]:
    return {"ok": True}
