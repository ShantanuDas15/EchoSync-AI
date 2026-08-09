from fastapi import APIRouter
from datetime import datetime, timezone
from app.core.config import settings

router = APIRouter()

@router.get("/healthz", summary="Service Health Check")
async def health_check():
    """
    Returns service health status, timestamp, and version metadata.
    Used for readiness and liveness probes.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": settings.VERSION,
        "service": settings.PROJECT_NAME,
    }
