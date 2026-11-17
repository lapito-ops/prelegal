"""FastAPI app: JSON API under /api plus the statically exported frontend."""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.db import init_db

REPO_ROOT = Path(__file__).resolve().parents[2]
DB_PATH = Path(os.environ.get("DB_PATH", REPO_ROOT / "backend" / "prelegal.db"))
STATIC_DIR = Path(os.environ.get("STATIC_DIR", REPO_ROOT / "frontend" / "out"))


def create_app(db_path: Path = DB_PATH, static_dir: Path = STATIC_DIR) -> FastAPI:
    """Build the app; the static mount is registered last so it never shadows /api."""

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        init_db(db_path)
        yield

    app = FastAPI(title="Prelegal", lifespan=lifespan)

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    if static_dir.is_dir():
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
    return app


app = create_app()
