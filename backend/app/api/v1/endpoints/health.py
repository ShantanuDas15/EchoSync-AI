from fastapi import APIRouter
from datetime import datetime
from app.core.config import settings

router = APIRouter()

@router.get("/healthz")
async def health_check():
    """
    HTTP GET /healthz endpoint returning status healthy, server timestamp, and version.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": settings.VERSION
    }
