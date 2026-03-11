import os
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

from flow.api.auth import require_api_key
from flow.api.routes.equity import router as equity_router

STATIC_DIR = Path(os.environ.get("FLOW_STATIC_DIR", "/app/static"))


def create_app() -> FastAPI:
    app = FastAPI(
        title="Flow",
        description="Stock market data analysis platform",
        version="0.1.0",
    )
    app.include_router(equity_router, prefix="/api", dependencies=[Depends(require_api_key)])

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    if STATIC_DIR.is_dir():
        app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            file_path = STATIC_DIR / full_path
            if file_path.is_file():
                return FileResponse(file_path)
            return FileResponse(STATIC_DIR / "index.html")

    return app


app = create_app()
