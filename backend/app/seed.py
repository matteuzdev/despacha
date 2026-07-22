from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Neighborhood,
    Order,
    OrderItem,
    Product,
    Subscription,
    Tenant,
    User,
)


async def seed_database(db: AsyncSession) -> None:
    """Popula o banco com dados iniciais se estiver vazio."""
    result = await db.execute(select(User).limit(1))
    if result.scalar_one_or_none():
        return  # Já populado

    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
    seed_base = int(datetime(2026, 6, 21, 15, 0, 0, tzinfo=timezone.utc).timestamp() * 1000)

    # ── Tenants ───────────────────────────────────────────
    tenant1 = Tenant(
        id=1,
        name="Depósito do João",
        slug="deposito-do-joao",
        plan="PRO",
        status="Ativo",
        owner_email="joao@exemplo.com",
        business_name="Depósito do João Gás & Água",
        address="Rua Principal, 123",
        color_hex="#ff5722",
        secondary_color_hex="#00b4ff",
        created_at=seed_base,
    )
    tenant2 = Tenant(
        id=2,
        name="Gás Rápido Centro",
        slug="gas-rapido-centro",
        plan="FREE",
        status="Ativo",
        owner_email="gas@exemplo.com",
        business_name="Gás Rápido",
        address="Av. Américas, 900",
        color_hex="#2196f3",
        secondary_color_hex="#ff8a00",
        created_at=seed_base,
    )
    db.add_all([tenant1, tenant2])
    await db.flush()

    # ── Users ────────────────────────────────────────────
    users = [
        User(id=1, name="Hianto CEO", email="hianto@despacha.com", password_hash="Mateus32**", role="superAdmin", tenant_id=None, is_first_login=False),
        User(id=2, name="João da Silva", email="lojista@despacha.com", password_hash="lojista123", role="admin", tenant_id=1, is_first_login=False),
        User(id=3, name="Entregador Zé", email="entregador@despacha.com", password_hash="entrega123", role="delivery", tenant_id=1, is_first_login=False),
    ]
    db.add_all(users)
    await db.flush()

    # ── Products ─────────────────────────────────────────
    products = [
        Product(id=1, name="Botijão P13 Cheio", description="Gás de cozinha 13kg com casco incluso.", price=110, category="Gás", tenant_id=1),
        Product(id=2, name="Botijão P13 Troca", description="Recarga para quem já tem o casco vazio.", price=85, category="Gás", is_favorite=True, tenant_id=1),
        Product(id=3, name="Galão de Água 20L", description="Água mineral retornável geladinha.", price=14, category="Água", is_order_bump=True, tenant_id=1),
        Product(id=4, name="Registro de Gás", description="Acessório de segurança para reposição rápida.", price=29.9, category="Acessórios", is_order_bump=True, tenant_id=1),
    ]
    db.add_all(products)
    await db.flush()

    # ── Neighborhoods ────────────────────────────────────
    neighborhoods = [
        Neighborhood(id=1, name="Centro", delivery_fee=0, status="available", tenant_id=1),
        Neighborhood(id=2, name="Aldeota", delivery_fee=5, status="available", tenant_id=1),
        Neighborhood(id=3, name="Messejana", delivery_fee=8, status="consult", tenant_id=1),
    ]
    db.add_all(neighborhoods)
    await db.flush()

    # ── Order ────────────────────────────────────────────
    order = Order(
        id=1,
        order_number="REQ-4821",
        customer_name="Maria",
        customer_phone="(85) 99999-0000",
        address_street="Rua das Flores",
        address_number="45",
        address_neighborhood="Centro",
        address_complement="",
        address_reference="Próximo à farmácia",
        payment_method="Pix",
        change_for=0,
        subtotal=85,
        delivery_fee=0,
        total=85,
        status="Novo",
        tenant_id=1,
        created_at=seed_base,
    )
    db.add(order)
    await db.flush()

    order_item = OrderItem(
        order_id=1,
        product_id=2,
        product_name="Botijão P13 Troca",
        quantity=1,
        unit_price=85,
        total_price=85,
    )
    db.add(order_item)
    await db.flush()

    # ── Subscription ─────────────────────────────────────
    subscription = Subscription(
        id=1,
        tenant_id=1,
        plan="PRO",
        status="active",
        cakto_purchase_id=None,
        created_at=seed_base,
        updated_at=seed_base,
    )
    db.add(subscription)
    await db.flush()
