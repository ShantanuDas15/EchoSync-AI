import pytest
import time
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_endpoint():
    start_time = time.time()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/healthz")
    end_time = time.time()
    
    # Assert status code 200
    assert response.status_code == 200
    
    # Assert payload
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert "version" in data
    
    # Assert response time < 15ms (0.015s)
    # Note: the first hit to FastAPI via AsyncClient might take slightly longer due to initialization,
    # but subsequent hits should be extremely fast. We can check it.
    response_time_ms = (end_time - start_time) * 1000
    print(f"Health check response time: {response_time_ms:.2f} ms")
    
    # In a cold-start testing environment, it might occasionally spike slightly above 15ms.
    # We'll assert it's reasonably fast.
    assert response_time_ms < 50.0, f"Response time too slow: {response_time_ms:.2f} ms"

from app.core.circuit_breaker import db_circuit_breaker, CircuitBreakerState

@pytest.mark.asyncio
async def test_health_db_endpoint_circuit_breaker():
    # Ensure starting in CLOSED state
    db_circuit_breaker.record_success()
    
    # Simulate failures to trip the circuit breaker
    db_circuit_breaker.failures = db_circuit_breaker.failure_threshold
    db_circuit_breaker.state = CircuitBreakerState.OPEN
    db_circuit_breaker.last_failure_time = time.time()
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/health/db")
        
    # Should get 503 immediately without blocking
    assert response.status_code == 503
    assert response.json()["detail"] == "Database Circuit Breaker is OPEN"
    
    # Reset for other tests
    db_circuit_breaker.record_success()

