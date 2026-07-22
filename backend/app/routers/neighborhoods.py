from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Neighborhood
from app.schemas import NeighborhoodCreate, NeighborhoodResponse, NeighborhoodUpdate

router = APIRouter()


@router.post("/api/neighborhoods", response_model=NeighborhoodResponse, status_code=201)
async def create_neighborhood(
    body: NeighborhoodCreate,
    db: AsyncSession = Depends(get_db),
) -> NeighborhoodResponse:
    neighborhood = Neighborhood(**body.model_dump())
    db.add(neighborhood)
    await db.flush()
    await db.refresh(neighborhood)
    return NeighborhoodResponse.model_validate(neighborhood)


@router.put("/api/neighborhoods/{neighborhood_id}", response_model=NeighborhoodResponse)
async def update_neighborhood(
    neighborhood_id: int,
    body: NeighborhoodUpdate,
    db: AsyncSession = Depends(get_db),
) -> NeighborhoodResponse:
    result = await db.execute(select(Neighborhood).where(Neighborhood.id == neighborhood_id))
    neighborhood = result.scalar_one_or_none()
    if not neighborhood:
        raise HTTPException(status_code=404, detail="Neighborhood not found")

    update_data = body.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(neighborhood, key, value)

    await db.flush()
    await db.refresh(neighborhood)
    return NeighborhoodResponse.model_validate(neighborhood)


@router.delete("/api/neighborhoods/{neighborhood_id}")
async def delete_neighborhood(
    neighborhood_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    result = await db.execute(select(Neighborhood).where(Neighborhood.id == neighborhood_id))
    neighborhood = result.scalar_one_or_none()
    if not neighborhood:
        raise HTTPException(status_code=404, detail="Neighborhood not found")
    await db.delete(neighborhood)
    return {"ok": True}
