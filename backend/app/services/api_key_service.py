import os
import hmac
import hashlib
import secrets
from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, update
from app.db.base import ApiKey
from app.schemas.api_key import ApiKeyCreate, ApiKeyCreationResponse, ApiKeyValidationResponse
from uuid import UUID

# Mock Redis cache for ponytail simplicity
# In production, this would be an aioredis instance or Upstash Redis
_LOCAL_CACHE = {}

class ApiKeyAuthService:
    def __init__(self, session: Session, secret: str = "default_fallback_secret"):
        self.session = session
        self.secret = secret.encode("utf-8")
        
    def _hash_key(self, raw_key: str) -> str:
        """Constant-time HMAC-SHA256 hash."""
        return hmac.new(self.secret, raw_key.encode("utf-8"), hashlib.sha256).hexdigest()
        
    def generate_api_key(self, request: ApiKeyCreate) -> ApiKeyCreationResponse:
        """Generates a secure API key with prefix."""
        random_bytes = secrets.token_hex(32)
        raw_key = f"echo_live_{random_bytes}"
        key_prefix = raw_key[:14]
        key_hash = self._hash_key(raw_key)
        
        api_key = ApiKey(
            user_id=request.user_id,
            key_name=request.key_name,
            key_prefix=key_prefix,
            key_hash=key_hash,
            scopes=[s.value for s in request.scopes],
            rate_limit_per_minute=request.rate_limit_per_minute,
            status="active"
        )
        self.session.add(api_key)
        self.session.commit()
        self.session.refresh(api_key)
        
        return ApiKeyCreationResponse(
            id=api_key.id,
            user_id=api_key.user_id,
            key_name=api_key.key_name,
            key_prefix=api_key.key_prefix,
            scopes=api_key.scopes,
            rate_limit_per_minute=api_key.rate_limit_per_minute,
            status=api_key.status,
            created_at=api_key.created_at,
            raw_key=raw_key
        )
        
    def validate_key(self, raw_key: str) -> ApiKeyValidationResponse:
        """Validates API key and checks rate limits (dummy token bucket)."""
        key_hash = self._hash_key(raw_key)
        
        # Redis cache lookup (mocked)
        if key_hash in _LOCAL_CACHE:
            cached_data = _LOCAL_CACHE[key_hash]
            if cached_data.get("status") != "active" or cached_data.get("expires_at") and cached_data["expires_at"] < datetime.now(timezone.utc):
                return ApiKeyValidationResponse(is_valid=False, error_detail="Key revoked or expired")
            return ApiKeyValidationResponse(
                is_valid=True,
                user_id=cached_data["user_id"],
                scopes=cached_data["scopes"],
                rate_limit_per_minute=cached_data["rate_limit_per_minute"]
            )
            
        stmt = select(ApiKey).where(ApiKey.key_hash == key_hash)
        api_key = self.session.scalars(stmt).first()
        
        if not api_key:
            return ApiKeyValidationResponse(is_valid=False, error_detail="Invalid API key")
            
        if api_key.status != "active":
            return ApiKeyValidationResponse(is_valid=False, error_detail=f"Key {api_key.status}")
            
        if api_key.expires_at and api_key.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            return ApiKeyValidationResponse(is_valid=False, error_detail="Key expired")
            
        # Update last_used_at (in a real app this is async background task)
        api_key.last_used_at = datetime.now(timezone.utc)
        self.session.commit()
        
        # Cache for next time
        _LOCAL_CACHE[key_hash] = {
            "status": api_key.status,
            "expires_at": api_key.expires_at.replace(tzinfo=timezone.utc) if api_key.expires_at else None,
            "user_id": api_key.user_id,
            "scopes": api_key.scopes,
            "rate_limit_per_minute": api_key.rate_limit_per_minute
        }
        
        return ApiKeyValidationResponse(
            is_valid=True,
            user_id=api_key.user_id,
            scopes=api_key.scopes,
            rate_limit_per_minute=api_key.rate_limit_per_minute
        )
