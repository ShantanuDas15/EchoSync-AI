from pydantic import BaseModel, ConfigDict, Field
from enum import Enum
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class ScopeEnum(str, Enum):
    SYNTHESIS_WRITE = "synthesis:write"
    SYNTHESIS_READ = "synthesis:read"
    VOICES_WRITE = "voices:write"
    VOICES_READ = "voices:read"
    ADMIN_DELETE = "admin:delete"

class ApiKeyCreate(BaseModel):
    user_id: UUID
    key_name: str = Field(..., max_length=128)
    scopes: List[ScopeEnum] = Field(default_factory=list)
    rate_limit_per_minute: int = 60

class ApiKeyResponse(BaseModel):
    id: UUID
    user_id: UUID
    key_name: str
    key_prefix: str
    scopes: List[str]
    rate_limit_per_minute: int
    status: str
    created_at: datetime
    
    # We never return the raw key except once upon creation (which requires a custom schema)
    model_config = ConfigDict(from_attributes=True)

class ApiKeyCreationResponse(ApiKeyResponse):
    raw_key: str

class ApiKeyValidationResponse(BaseModel):
    is_valid: bool
    user_id: Optional[UUID] = None
    scopes: List[str] = Field(default_factory=list)
    rate_limit_per_minute: int = 60
    error_detail: Optional[str] = None
