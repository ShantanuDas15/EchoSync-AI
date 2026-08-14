import pytest
import os
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from app.db.base import Base, User, SynthesisJob

DB_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")

@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(DB_URL)
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(engine)

def test_user_api_quota_constraint(db_session):
    """Test that a negative api quota violates the CHECK constraint."""
    user = User(
        id=uuid.uuid4(),
        sub="auth|123",
        email="test@example.com",
        api_quota_monthly=-100  # Should trigger IntegrityError
    )
    db_session.add(user)
    with pytest.raises(IntegrityError) as excinfo:
        db_session.commit()
    
    assert "chk_users_api_quota" in str(excinfo.value) or "CHECK" in str(excinfo.value)
    db_session.rollback()

def test_synthesis_job_speed_constraint(db_session):
    """Test that out-of-bounds speed_modifier violates the CHECK constraint."""
    user = User(
        id=uuid.uuid4(),
        sub="auth|124",
        email="test2@example.com",
    )
    db_session.add(user)
    db_session.commit()
    
    job = SynthesisJob(
        id=uuid.uuid4(),
        task_id="task-123",
        user_id=user.id,
        prompt_text="Hello",
        speed_modifier=3.0  # Max is 2.00, should trigger IntegrityError
    )
    db_session.add(job)
    with pytest.raises(IntegrityError) as excinfo:
        db_session.commit()
        
    assert "chk_synthesis_speed" in str(excinfo.value) or "CHECK" in str(excinfo.value)
    db_session.rollback()
