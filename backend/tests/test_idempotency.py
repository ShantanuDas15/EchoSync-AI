import pytest
import uuid
import json
import threading
from app.services.idempotency import IdempotencyService, IdempotencyConflictException, _MOCK_REDIS_STORE
from app.db.base import Base, User, SynthesisJob
from app.db.repositories.job_repo import SynthesisJobRepository
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
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

@pytest.fixture(autouse=True)
def reset_mock_store():
    _MOCK_REDIS_STORE.clear()

def test_idempotency_service_caching():
    service = IdempotencyService()
    key = str(uuid.uuid4())
    
    # First request acquires the lock
    cached_resp = service.acquire_lock(key)
    assert cached_resp is None
    
    # A concurrent attempt should raise conflict
    with pytest.raises(IdempotencyConflictException):
        service.acquire_lock(key)
        
    # Save the successful response
    service.save_response(key, status_code=200, headers={"Content-Type": "application/json"}, body={"status": "success"})
    
    # Third attempt should return the cached response
    cached_resp_2 = service.acquire_lock(key)
    assert cached_resp_2 is not None
    assert cached_resp_2.status_code == 200
    assert json.loads(cached_resp_2.body.decode()) == {"status": "success"}

def test_atomic_state_transitions(db_session):
    user = User(sub="auth0|idempotent", email="idem@example.com")
    db_session.add(user)
    db_session.flush()
    
    job = SynthesisJob(user_id=user.id, task_id="task-123", prompt_text="test", status="queued")
    db_session.add(job)
    db_session.commit()
    
    repo = SynthesisJobRepository(db_session)
    
    # Valid transition
    updated_job = repo.transition_status(job.id, "processing")
    assert updated_job.status == "processing"
    
    # Invalid transition (backward)
    with pytest.raises(ValueError, match="Invalid transition from processing to queued"):
        repo.transition_status(job.id, "queued")
