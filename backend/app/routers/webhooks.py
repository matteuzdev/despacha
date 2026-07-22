from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Subscription, Tenant
from app.schemas import WebhookCakto

logger = logging.getLogger("cakto-webhook")
router = APIRouter()


@router.post("/api/webhooks/cakto")
async def cakto_webhook(
    body: WebhookCakto,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    event = body.event or body.type or ""

    # ── Verificação de assinatura ────────────────────────
    webhook_secret = settings.cakto_webhook_secret
    if webhook_secret:
        signature = (
            request.headers.get("x-webhook-signature")
            or request.headers.get("x-cakto-signature")
            or ""
        )
        if not signature:
            logger.warning("webhook chamado sem assinatura")
            return JSONResponse(status_code=401, content={"error": "Missing webhook signature"})
        if signature != webhook_secret:
            logger.warning("assinatura invalida")
            return JSONResponse(status_code=401, content={"error": "Invalid webhook signature"})

    # ── Extrair metadados ────────────────────────────────
    raw_metadata = {}
    if body.purchase and body.purchase.get("metadata"):
        raw_metadata = body.purchase["metadata"]
    elif body.metadata:
        raw_metadata = body.metadata
    elif body.data and body.data.get("metadata"):
        raw_metadata = body.data["metadata"]

    purchase_id = (body.purchase and body.purchase.get("id")) or body.id or None
    tenant_id = (
        int(raw_metadata.get("tenantId", 0))
        or int(raw_metadata.get("tenant_id", 0))
        or int(body.tenant_id or 0)
        or None
    )
    plan = raw_metadata.get("plan") or body.plan or "PRO"

    logger.info("event=%s purchaseId=%s tenantId=%s plan=%s", event, purchase_id, tenant_id, plan)

    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)

    if event in ("purchase_approved", "subscription_created"):
        if not tenant_id:
            logger.warning("purchase_approved sem tenantId")
            return {"received": True, "warning": "missing tenantId"}

        # Atualiza ou cria subscription
        result = await db.execute(
            select(Subscription).where(Subscription.tenant_id == tenant_id)
        )
        subscription = result.scalar_one_or_none()

        if subscription:
            subscription.status = "active"
            subscription.plan = plan
            subscription.cakto_purchase_id = purchase_id
            subscription.updated_at = now_ms
        else:
            db.add(
                Subscription(
                    tenant_id=tenant_id,
                    plan=plan,
                    status="active",
                    cakto_purchase_id=purchase_id,
                    created_at=now_ms,
                    updated_at=now_ms,
                )
            )

        # Atualiza o tenant
        tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
        tenant = tenant_result.scalar_one_or_none()
        if tenant:
            tenant.plan = plan
            tenant.status = "Ativo"

        logger.info("subscription activated for tenant %s plan %s", tenant_id, plan)
        return {"received": True, "activated": True}

    if event in ("purchase_refused", "refund"):
        logger.info("purchase refused/refund for tenant %s", tenant_id)
        return {"received": True}

    if event in ("subscription_canceled", "chargeback"):
        if tenant_id:
            result = await db.execute(
                select(Subscription).where(Subscription.tenant_id == tenant_id)
            )
            subscription = result.scalar_one_or_none()
            if subscription:
                subscription.status = "canceled"
                subscription.updated_at = now_ms

            tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
            tenant = tenant_result.scalar_one_or_none()
            if tenant:
                tenant.status = "Cancelado"

            logger.info("subscription canceled for tenant %s", tenant_id)
        return {"received": True}

    # Evento não mapeado
    logger.info("evento nao mapeado: %s", event)
    return {"received": True}
