"""FastAPI application factory."""

from fastapi import FastAPI

from slotting.api.routes import router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Action Warehouse Slotting API",
        description="AI-driven warehouse slotting optimization engine",
        version="0.2.0",
    )
    app.include_router(router)
    return app
