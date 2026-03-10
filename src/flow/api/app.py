from fastapi import FastAPI

from flow.api.routes.equity import router as equity_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Flow",
        description="Stock market data analysis platform",
        version="0.1.0",
    )
    app.include_router(equity_router, prefix="/api")

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
