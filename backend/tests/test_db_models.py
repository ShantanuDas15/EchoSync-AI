import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB, UUID
from app.db.base import Base, User, SpeakerProfile, AudioAsset, SynthesisJob, ApiKey, UsageLog

@compiles(JSONB, 'sqlite')
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"

@compiles(UUID, 'sqlite')
def compile_uuid_sqlite(type_, compiler, **kw):
    return "TEXT"

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

@pytest.fixture(scope="function")
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(engine)

def test_orm_table_creation(db_session):
    # Verify all tables can be created
    user = User(sub="test|123", email="test@example.com")
    db_session.add(user)
    db_session.commit()
    assert user.id is not None
    assert user.created_at is not None

def test_foreign_key_cascade_delete(db_session):
    # Create User
    user = User(sub="test|cascade", email="cascade@example.com")
    db_session.add(user)
    db_session.commit()
    
    # Create child objects
    profile = SpeakerProfile(user_id=user.id, speaker_name="test_speaker", embedding="[]")
    api_key = ApiKey(user_id=user.id, key_name="test_key", key_prefix="test", key_hash="testhash")
    db_session.add_all([profile, api_key])
    db_session.commit()
    
    # Verify they exist
    assert db_session.query(SpeakerProfile).count() == 1
    assert db_session.query(ApiKey).count() == 1
    
    # Delete User -> should cascade delete profile and api_key
    db_session.delete(user)
    db_session.commit()
    
    assert db_session.query(SpeakerProfile).count() == 0
    assert db_session.query(ApiKey).count() == 0

def test_on_delete_set_null(db_session):
    # Create User and Profile
    user = User(sub="test|setnull", email="setnull@example.com")
    db_session.add(user)
    db_session.commit()
    
    profile = SpeakerProfile(user_id=user.id, speaker_name="test_speaker", embedding="[]")
    db_session.add(profile)
    db_session.commit()
    
    job = SynthesisJob(user_id=user.id, speaker_profile_id=profile.id, task_id="task-1", prompt_text="hello")
    db_session.add(job)
    db_session.commit()
    
    # Delete Profile -> should set speaker_profile_id in SynthesisJob to NULL
    # Note: SQLite doesn't automatically trigger ON DELETE SET NULL for relationships defined at table level
    # unless PRAGMA foreign_keys=ON is active, which we did.
    db_session.delete(profile)
    db_session.commit()
    
    job_after = db_session.query(SynthesisJob).filter_by(task_id="task-1").first()
    assert job_after is not None
    assert job_after.speaker_profile_id is None
