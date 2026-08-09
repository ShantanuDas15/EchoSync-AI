from fastapi import APIRouter, Depends, HTTPException, status
from app.api.v1.deps import verify_api_key
from app.core.config import settings

router = APIRouter()

@router.get("/auth/verify", summary="Verify API Key and Auth Status")
async def verify_auth(api_key: str | None = Depends(verify_api_key)):
    """
    Verifies client authentication status and returns current security enforcement settings.
    """
    return {
        "status": "authenticated",
        "require_api_key": settings.REQUIRE_API_KEY,
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
    }
