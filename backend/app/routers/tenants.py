from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Tenant, Product, Neighborhood
from app.schemas import TenantCreate, TenantResponse, TenantUpdate, ProductResponse, NeighborhoodResponse

router = APIRouter()

@router.get("/api/tenants/slug/{slug}")
async def get_tenant_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tenant).where(Tenant.slug == slug))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    
    products_res = await db.execute(select(Product).where(Product.tenant_id == tenant.id))
    neighborhoods_res = await db.execute(select(Neighborhood).where(Neighborhood.tenant_id == tenant.id))
    
    return {
        "tenant": TenantResponse.model_validate(tenant),
        "products": [ProductResponse.model_validate(p) for p in products_res.scalars().all()],
        "neighborhoods": [NeighborhoodResponse.model_validate(n) for n in neighborhoods_res.scalars().all()]
    }


@router.post("/api/tenants", response_model=TenantResponse, status_code=201)
async def create_tenant(body: TenantCreate, db: AsyncSession = Depends(get_db)) -> TenantResponse:
    tenant = Tenant(**body.model_dump())
    if not tenant.slug:
        import re, unicodedata
        name = unicodedata.normalize('NFKD', tenant.name).encode('ascii', 'ignore').decode('utf-8')
        name = re.sub(r'[^\w\s-]', '', name.lower())
        tenant.slug = re.sub(r'[-\s]+', '-', name).strip('-') or "loja"
    db.add(tenant)
    await db.flush()
    await db.refresh(tenant)
    return TenantResponse.model_validate(tenant)


@router.put("/api/tenants/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: int,
    body: TenantUpdate,
    db: AsyncSession = Depends(get_db),
) -> TenantResponse:
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    update_data = body.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(tenant, key, value)

    await db.flush()
    await db.refresh(tenant)
    return TenantResponse.model_validate(tenant)


@router.delete("/api/tenants/{tenant_id}")
async def delete_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    await db.delete(tenant)
    return {"ok": True}
