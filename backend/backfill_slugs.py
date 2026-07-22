import asyncio
import re
import unicodedata
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session_factory
from app.models import Tenant

def generate_slug(name: str) -> str:
    name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('utf-8')
    name = re.sub(r'[^\w\s-]', '', name.lower())
    return re.sub(r'[-\s]+', '-', name).strip('-') or "loja"

async def main():
    async with async_session_factory() as db:
        result = await db.execute(select(Tenant))
        tenants = result.scalars().all()
        for t in tenants:
            if not t.slug:
                t.slug = generate_slug(t.name)
        await db.commit()
        print("Updated slugs for all tenants.")

if __name__ == "__main__":
    asyncio.run(main())
