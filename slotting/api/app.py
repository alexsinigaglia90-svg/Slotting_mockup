"""FastAPI application factory."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slotting.api.routes import router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Action Warehouse Slotting API",
        description="AI-driven warehouse slotting optimization engine",
        version="1.0.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)
    return app
