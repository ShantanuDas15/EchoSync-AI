from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class IdempotencyKey(BaseModel):
    key: str = Field(..., max_length=128, description="Unique client-provided idempotency key")
    
class IdempotencyResponse(BaseModel):
    status_code: int
    headers: Dict[str, str]
    body: Any
