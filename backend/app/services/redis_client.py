import logging
from typing import Optional
from redis.asyncio import Redis, from_url
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisClient:
    _instance: Optional[Redis] = None

    @classmethod
    def get_client(cls) -> Redis:
        """Get or initialize the global asyncio Redis client."""
        if cls._instance is None:
            cls._instance = from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_timeout=5.0,
                health_check_interval=30
            )
            # Safe log masking credentials
            safe_url = settings.REDIS_URL.split('@')[-1] if '@' in settings.REDIS_URL else settings.REDIS_URL
            logger.info(f"Initialized Redis client connected to {safe_url}")
        return cls._instance

    @classmethod
    async def close(cls):
        """Close the Redis connection pool."""
        if cls._instance is not None:
            await cls._instance.aclose()
            cls._instance = None

import json
import hashlib
from functools import wraps
from typing import Callable
from cachetools import TTLCache

# L1 memory cache (100 items, 5 minute TTL)
_l1_vector_cache = TTLCache(maxsize=100, ttl=300)

def cache_vector_search(ttl_seconds: int = 3600):
    """
    Two-tier caching decorator for match_voices RPC.
    - L1: In-memory TTLCache (5 minutes)
    - L2: Redis (1 hour)
    """
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            vector = kwargs.get('vector')
            if vector is None and len(args) > 1:
                vector = args[1]
                
            if not vector:
                return func(*args, **kwargs)
                
            limit = kwargs.get('limit', 5)
            match_threshold = kwargs.get('match_threshold', 0.70)
            
            # Deterministic hash of the vector (rounded to 4 decimals to handle slight float variances)
            vector_str = json.dumps([round(v, 4) for v in vector])
            key_hash = hashlib.sha256(vector_str.encode()).hexdigest()
            cache_key = f"vector_search:rpc:{key_hash}:{limit}:{match_threshold}"
            
            # 1. Check L1
            if cache_key in _l1_vector_cache:
                return _l1_vector_cache[cache_key]
                
            # 2. Check L2 (Redis)
            redis = RedisClient.get_client()
            try:
                cached = await redis.get(cache_key)
                if cached:
                    result = json.loads(cached)
                    _l1_vector_cache[cache_key] = result
                    return result
            except Exception as e:
                logger.warning(f"Redis L2 cache read failed: {e}")
                
            # 3. Execute original function (run sync func in executor to avoid blocking if needed, but for simplicity here we just call it)
            # We assume func is synchronous for now as it's wrapping supabase_client.py
            import asyncio
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, lambda: func(*args, **kwargs))
            
            # Cache the result
            _l1_vector_cache[cache_key] = result
            try:
                await redis.set(cache_key, json.dumps(result), ex=ttl_seconds)
            except Exception as e:
                logger.warning(f"Redis L2 cache write failed: {e}")
                
            return result
        return async_wrapper
    return decorator
