from typing import AsyncGenerator
from fastapi import Header, HTTPException, status
from app.core.config import settings, Settings

def get_settings() -> Settings:
    """Dependency provider for global application settings."""
    return settings

async def verify_api_key(x_api_key: str | None = Header(None, alias=settings.API_KEY_NAME)) -> str | None:
    """
    Dependency provider for verifying client API keys.
    Skipped if REQUIRE_API_KEY is False in configuration.
    """
    if not settings.REQUIRE_API_KEY:
        return x_api_key

    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key header missing. Provide 'X-API-Key' in HTTP request headers.",
        )

    if x_api_key != settings.SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or unauthorized API key.",
        )

    return x_api_key
