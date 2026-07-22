from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Database ──────────────────────────────────────────
    database_url: str = "sqlite+aiosqlite:///./despacha.db"
    # Exemplo produção: "postgresql+asyncpg://user:pass@host:5432/despacha"

    # ── Cakto ─────────────────────────────────────────────
    cakto_client_id: str = ""
    cakto_client_secret: str = ""
    cakto_webhook_secret: str = ""
    cakto_api_base_url: str = "https://api.cakto.com.br"

    # ── App ───────────────────────────────────────────────
    app_public_url: str = "http://localhost:5173"
    debug: bool = True


settings = Settings()
