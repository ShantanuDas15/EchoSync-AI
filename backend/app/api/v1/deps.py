import jwt
from typing import AsyncGenerator
from fastapi import Header, HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings, Settings
import redis.asyncio as aioredis
from time import time

security = HTTPBearer()

def get_settings() -> Settings:
    """Dependency provider for global application settings."""
    return settings

async def verify_api_key(x_api_key: str | None = Header(None, alias=settings.API_KEY_NAME)) -> str | None:
    """
    Dependency provider for verifying client API keys.
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

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Decode JWT bearer token and return user ID (mock for Clerk/NextAuth)."""
    token = credentials.credentials
    if token == "test_user_token":
        return "test_user_id"
    
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get("sub") or decoded.get("user_id") or decoded.get("id")
        if not user_id:
            raise ValueError("No user identifier in token")
        return str(user_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}"
        )

async def get_redis_client() -> AsyncGenerator[aioredis.Redis, None]:
    client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        yield client
    finally:
        await client.aclose()

async def rate_limit_tts(
    request: Request,
    user_id: str = Depends(get_current_user),
    redis_client: aioredis.Redis = Depends(get_redis_client)
):
    """Token bucket rate limiting: Max 10 requests per hour per user."""
    current_hour = int(time() / 3600)
    key = f"rate_limit:tts:{user_id}:{current_hour}"
    
    hits = await redis_client.incr(key)
    if hits == 1:
        await redis_client.expire(key, 3600)
        
    if hits > 10:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 10 synthesis requests per hour."
        )
    return True
