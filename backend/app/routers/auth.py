from __future__ import annotations

import re
import unicodedata

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, Tenant
from app.schemas import LoginRequest, UserCreate, UserResponse, RegisterRequest, RegisterResponse

router = APIRouter()

def generate_slug(name: str) -> str:
    name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('utf-8')
    name = re.sub(r'[^\w\s-]', '', name.lower())
    return re.sub(r'[-\s]+', '-', name).strip('-') or "loja"

@router.post("/api/auth/register", response_model=RegisterResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)) -> RegisterResponse:
    # Create tenant
    tenant = Tenant(
        name=body.name,
        slug=generate_slug(body.name),
        plan="FREE",
        owner_email=body.email,
        business_name=body.name,
    )
    db.add(tenant)
    await db.flush()
    await db.refresh(tenant)

    # Create user
    user = User(
        name=body.name,
        email=body.email,
        password_hash=body.password,
        role="admin",
        tenant_id=tenant.id,
        is_first_login=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return RegisterResponse(user=user, tenant=tenant)



@router.post("/api/auth/login", response_model=dict[str, UserResponse])
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict[str, UserResponse]:
    result = await db.execute(
        select(User).where(User.email == body.email, User.password_hash == body.password)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"user": UserResponse.model_validate(user)}


@router.post("/api/users", response_model=UserResponse, status_code=201)
async def create_user(body: UserCreate, db: AsyncSession = Depends(get_db)) -> UserResponse:
    user = User(
        name=body.name,
        email=body.email,
        password_hash=body.password_hash,
        role=body.role,
        tenant_id=body.tenant_id,
        is_first_login=body.is_first_login,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return UserResponse.model_validate(user)
