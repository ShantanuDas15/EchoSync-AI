import json
import logging
from typing import Optional, Tuple
from fastapi.responses import JSONResponse
from app.schemas.idempotency import IdempotencyResponse

logger = logging.getLogger(__name__)

# Mock Redis caching for ponytail-compliant local idempotency tracking.
# Structure: {
#   "key_hash": {
#      "status": "in_progress" | "completed",
#      "response": None | IdempotencyResponse
#   }
# }
_MOCK_REDIS_STORE = {}

class IdempotencyConflictException(Exception):
    pass

class IdempotencyService:
    def __init__(self):
        pass

    def acquire_lock(self, idempotency_key: str) -> Optional[JSONResponse]:
        """
        Attempts to acquire an idempotency lock for the given key.
        Returns the cached JSONResponse if it already completed successfully.
        Raises IdempotencyConflictException if the key is currently being processed.
        Returns None if this is a new, unseen request (meaning it's safe to process).
        """
        state = _MOCK_REDIS_STORE.get(idempotency_key)
        
        if state:
            if state["status"] == "in_progress":
                logger.warning(f"Concurrent execution detected for idempotency key: {idempotency_key}")
                raise IdempotencyConflictException("A request with this idempotency key is already in progress.")
            elif state["status"] == "completed":
                resp_data = state["response"]
                return JSONResponse(
                    status_code=resp_data.status_code,
                    content=resp_data.body,
                    headers=resp_data.headers
                )
        
        # New key, acquire the lock
        _MOCK_REDIS_STORE[idempotency_key] = {
            "status": "in_progress",
            "response": None
        }
        return None

    def save_response(self, idempotency_key: str, status_code: int, headers: dict, body: dict):
        """
        Saves the successful response payload against the idempotency key for future replay.
        """
        resp = IdempotencyResponse(
            status_code=status_code,
            headers=headers,
            body=body
        )
        _MOCK_REDIS_STORE[idempotency_key] = {
            "status": "completed",
            "response": resp
        }
        
    def release_lock_on_failure(self, idempotency_key: str):
        """
        Clears the idempotency key so the client can safely retry on an internal error.
        """
        if idempotency_key in _MOCK_REDIS_STORE:
            del _MOCK_REDIS_STORE[idempotency_key]
