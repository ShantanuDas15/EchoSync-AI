from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.api.v1.endpoints import health

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
    )

    # Set up CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API v1 router (/api/v1)
    app.include_router(api_router, prefix=settings.API_V1_STR)
    
    # Mount root level health check endpoint (/healthz)
    app.include_router(health.router, prefix="", tags=["health"])

    # Mount WebSocket stream router
    from app.api.v1.endpoints import stream
    app.include_router(stream.router, prefix="", tags=["streaming"])

    return app

app = create_app()
