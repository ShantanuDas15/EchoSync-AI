import pytest
import fakeredis.aioredis
from unittest import mock
import asyncio
from fastapi import HTTPException
from app.services.redis_client import RedisClient, cache_vector_search, _l1_vector_cache
from app.api.v1.deps import VerifyApiKey
from app.services.api_key_service import ApiKeyAuthService
import json

import pytest_asyncio

@pytest_asyncio.fixture
async def mock_redis():
    # Setup fakeredis
    fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    with mock.patch.object(RedisClient, "get_client", return_value=fake_redis):
        yield fake_redis
    await fake_redis.aclose()

@pytest.mark.asyncio
async def test_rate_limiting_with_redis(mock_redis):
    # Setup mock validation response
    mock_validation = mock.Mock()
    mock_validation.is_valid = True
    mock_validation.user_id = "test-user-123"
    mock_validation.rate_limit_per_minute = 2
    mock_validation.scopes = ["synthesis:write"]

    with mock.patch("app.api.v1.deps.settings.REQUIRE_API_KEY", True):
        with mock.patch.object(ApiKeyAuthService, "validate_key", return_value=mock_validation):
            verifier = VerifyApiKey(required_scopes=["synthesis:write"])
            db_mock = mock.Mock()
            
            # 1st request - should pass
            await verifier(x_api_key="valid-key", db=db_mock)
            
            # 2nd request - should pass (limit is 2)
            await verifier(x_api_key="valid-key", db=db_mock)
            
            # 3rd request - should fail with 429
            with pytest.raises(HTTPException) as exc_info:
                await verifier(x_api_key="valid-key", db=db_mock)
                
            assert exc_info.value.status_code == 429
            assert "Rate limit exceeded" in exc_info.value.detail

@pytest.mark.asyncio
async def test_vector_search_caching(mock_redis):
    _l1_vector_cache.clear()
    
    # Create a dummy class to attach the decorator to
    class DummyClient:
        call_count = 0
        
        @cache_vector_search(ttl_seconds=60)
        def search(self, vector, limit=5):
            self.call_count += 1
            return [{"id": "voice-1", "similarity": 0.99}]
            
    client = DummyClient()
    test_vector = [0.1, 0.2, 0.3]
    
    # First call - cache miss, should hit the function
    result1 = await client.search(vector=test_vector, limit=5)
    assert client.call_count == 1
    assert result1[0]["id"] == "voice-1"
    
    # Second call - L1 cache hit, function shouldn't be called again
    result2 = await client.search(vector=test_vector, limit=5)
    assert client.call_count == 1
    assert result2 == result1
    
    # Clear L1 cache to force L2 (Redis) lookup
    _l1_vector_cache.clear()
    
    # Third call - L1 miss, but Redis L2 hit
    result3 = await client.search(vector=test_vector, limit=5)
    assert client.call_count == 1
    assert result3 == result1
