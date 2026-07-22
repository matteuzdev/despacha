from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Subscription, Tenant, User
from app.schemas import SubscriptionResponse, TenantResponse

router = APIRouter()


@router.get("/api/subscription/{user_id}")
async def get_subscription(
    user_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        return {"subscription": None, "tenant": None}

    sub_result = await db.execute(
        select(Subscription).where(Subscription.tenant_id == user.tenant_id)
    )
    subscription = sub_result.scalar_one_or_none()

    tenant_result = await db.execute(
        select(Tenant).where(Tenant.id == user.tenant_id)
    )
    tenant = tenant_result.scalar_one_or_none()

    return {
        "subscription": SubscriptionResponse.model_validate(subscription) if subscription else None,
        "tenant": TenantResponse.model_validate(tenant) if tenant else None,
    }
