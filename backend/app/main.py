from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import Base, async_session_factory, engine
from app.routers import (
    auth,
    frontend,
    neighborhoods,
    orders,
    products,
    state,
    subscriptions,
    tenants,
    webhooks,
)
from app.seed import seed_database

logger = logging.getLogger("despacha")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Inicializa o banco e popula seed data na inicialização."""
    logger.info("Inicializando banco de dados...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory.begin() as db:
        await seed_database(db)

    logger.info("Banco pronto!")
    yield
    await engine.dispose()


app = FastAPI(
    title="Despacha API",
    description="Backend do Despacha - Gestão de entregas de gás e água",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Global Exception Handler ──────────────────────────


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)},
    )


# ── CORS ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────
app.include_router(state.router)  # /api/health, /api/state
app.include_router(auth.router)  # /api/auth/login, /api/users
app.include_router(tenants.router)  # /api/tenants
app.include_router(products.router)  # /api/products
app.include_router(neighborhoods.router)  # /api/neighborhoods
app.include_router(orders.router)  # /api/orders
app.include_router(subscriptions.router)  # /api/subscription
app.include_router(webhooks.router)  # /api/webhooks/cakto

# Frontend estático (DEVE ser o último — catch-all)
app.include_router(frontend.router)
