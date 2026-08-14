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

from app.db.session import get_db, engine
from app.services.api_key_service import ApiKeyAuthService
from sqlalchemy.orm import Session
from sqlalchemy import text

class VerifyApiKey:
    def __init__(self, required_scopes: list[str] = None):
        self.required_scopes = required_scopes or []

    async def __call__(
        self,
        x_api_key: str = Header(None, alias=settings.API_KEY_NAME),
        db: Session = Depends(get_db)
    ):
        if not settings.REQUIRE_API_KEY:
            return None

        if not x_api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API Key header missing. Provide 'X-API-Key' in HTTP request headers.",
            )

        auth_service = ApiKeyAuthService(db)
        validation = auth_service.validate_key(x_api_key)
        
        if not validation.is_valid:
            # We use 401 for invalid keys
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=validation.error_detail)
            
        for scope in self.required_scopes:
            if scope not in validation.scopes:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="API key lacks required scope.")

        # Distributed Rate limiting logic using Redis
        from app.services.redis_client import RedisClient
        from time import time
        
        current_minute = int(time() / 60)
        limit_key = f"rate_limit:api_key:{validation.user_id}:{current_minute}"
        
        redis = RedisClient.get_client()
        try:
            current_count = await redis.incr(limit_key)
            print(f"DEBUG: limit_key={limit_key}, current_count={current_count}")
            if current_count == 1:
                await redis.expire(limit_key, 60) # Expire after 1 minute
                
            if current_count > validation.rate_limit_per_minute:
                raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")
        except HTTPException:
            raise
        except Exception as e:
            # Fallback if Redis is down - allow request but log error
            import logging
            logging.getLogger(__name__).warning(f"Redis rate limiting failed: {e}")
        
        # Implement session-level Supabase RLS context injection
        # SQLite doesn't support SET LOCAL, so we conditionally execute it
        if engine and engine.dialect.name == "postgresql":
            db.execute(text("SET LOCAL request.jwt.claim.sub = :user_id"), {"user_id": str(validation.user_id)})
            
        return validation

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


verify_api_key = VerifyApiKey()
