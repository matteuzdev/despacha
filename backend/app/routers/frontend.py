from __future__ import annotations

import pathlib

from fastapi import APIRouter
from fastapi.responses import FileResponse, HTMLResponse
from starlette.requests import Request

FRONTEND_DIST = pathlib.Path(__file__).resolve().parent.parent.parent.parent / "webapp" / "dist"

router = APIRouter()


def _find_static(path: str) -> pathlib.Path | None:
    """Busca arquivo estático no diretório dist do frontend."""
    safe = path.lstrip("/")
    candidate = FRONTEND_DIST / safe
    if candidate.exists() and candidate.is_file():
        return candidate
    return None


@router.api_route("/{path:path}", methods=["GET"], response_model=None)
async def serve_frontend(request: Request, path: str) -> FileResponse | HTMLResponse:
    """Serve arquivos estáticos do frontend buildado.

    Se o arquivo existir em dist/, serve ele.
    Caso contrário, serve index.html (SPA fallback).
    """
    # Se a rota começa com /api, deixa passar para os outros routers
    if path.startswith("api/"):
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=404, content={"error": "Not found"})

    static_file = _find_static(path or "index.html")
    if static_file:
        return FileResponse(str(static_file))

    index_html = FRONTEND_DIST / "index.html"
    if index_html.exists():
        content = index_html.read_text(encoding="utf-8")
        return HTMLResponse(content)

    return HTMLResponse(
        "<h1>Frontend não buildado</h1><p>Execute <code>npm run build</code> em webapp/</p>",
        status_code=200,
    )
