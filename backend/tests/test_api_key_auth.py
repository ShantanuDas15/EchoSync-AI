import pytest
import uuid
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base, User
from app.api.v1.deps import VerifyApiKey, get_db
from app.schemas.api_key import ApiKeyCreate, ScopeEnum
from app.services.api_key_service import ApiKeyAuthService
from app.core.config import settings

# Setup dummy app
test_app = FastAPI()

@test_app.get("/secure-read")
def secure_read(validation=Depends(VerifyApiKey(required_scopes=["synthesis:read"]))):
    return {"status": "ok", "user_id": str(validation.user_id)}

@test_app.get("/secure-write")
def secure_write(validation=Depends(VerifyApiKey(required_scopes=["synthesis:write"]))):
    return {"status": "ok", "user_id": str(validation.user_id)}

from sqlalchemy.pool import StaticPool

@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        yield db_session
    
    # We must ensure REQUIRE_API_KEY is true for tests
    original_require_api_key = settings.REQUIRE_API_KEY
    settings.REQUIRE_API_KEY = True
    
    # Clear rate limits for clean test run
    if hasattr(VerifyApiKey, "_rate_limits"):
        VerifyApiKey._rate_limits.clear()

    test_app.dependency_overrides[get_db] = override_get_db
    with TestClient(test_app) as c:
        yield c
    test_app.dependency_overrides.clear()
    settings.REQUIRE_API_KEY = original_require_api_key

def test_api_key_rejection(client):
    # No header
    resp = client.get("/secure-read")
    assert resp.status_code == 401
    
    # Invalid header
    resp = client.get("/secure-read", headers={"X-API-Key": "invalid_key"})
    assert resp.status_code == 401
    assert "Invalid API key" in resp.json()["detail"]

def test_api_key_scope_denial(client, db_session):
    # Create user and key with READ scope only
    user = User(sub="auth0|1", email="test@test.com")
    db_session.add(user)
    db_session.commit()
    
    service = ApiKeyAuthService(db_session)
    key_resp = service.generate_api_key(ApiKeyCreate(
        user_id=user.id,
        key_name="Test Key",
        scopes=[ScopeEnum.SYNTHESIS_READ],
        rate_limit_per_minute=60
    ))
    
    # Can access READ
    resp = client.get("/secure-read", headers={"X-API-Key": key_resp.raw_key})
    assert resp.status_code == 200
    
    # Denied WRITE
    resp = client.get("/secure-write", headers={"X-API-Key": key_resp.raw_key})
    assert resp.status_code == 403
    assert "lacks required scope" in resp.json()["detail"]

def test_api_key_rate_limit(client, db_session):
    user = User(sub="auth0|2", email="test2@test.com")
    db_session.add(user)
    db_session.commit()
    
    service = ApiKeyAuthService(db_session)
    key_resp = service.generate_api_key(ApiKeyCreate(
        user_id=user.id,
        key_name="Low Limit Key",
        scopes=[ScopeEnum.SYNTHESIS_READ],
        rate_limit_per_minute=2
    ))
    
    # Call 1 (OK)
    resp = client.get("/secure-read", headers={"X-API-Key": key_resp.raw_key})
    assert resp.status_code == 200
    
    # Call 2 (OK)
    resp = client.get("/secure-read", headers={"X-API-Key": key_resp.raw_key})
    assert resp.status_code == 200
    
    # Call 3 (429 Rate Limit)
    resp = client.get("/secure-read", headers={"X-API-Key": key_resp.raw_key})
    assert resp.status_code == 429
    assert "Rate limit exceeded" in resp.json()["detail"]
