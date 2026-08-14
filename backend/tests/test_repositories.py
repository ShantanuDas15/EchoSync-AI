import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base, User, AudioAsset, SpeakerProfile
from app.db.unit_of_work import UnitOfWork

# Use an isolated SQLite database for testing the repository pattern
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_unit_of_work_commit(db_session):
    """Test that UnitOfWork commits correctly on successful execution."""
    with UnitOfWork(db_session) as uow:
        user = uow.users.create(sub="auth0|123456", email="test@example.com")
        assert user.id is not None
        
        audio = uow.audio_assets.create(
            user_id=user.id,
            r2_object_key="test/key.wav",
            file_name="test.wav",
            content_hash="abcdef",
            file_size_bytes=1024,
            duration_seconds=1.5
        )
        assert audio.id is not None
    
    # Assert they exist in DB
    saved_user = db_session.get(User, user.id)
    assert saved_user is not None
    assert saved_user.sub == "auth0|123456"

def test_unit_of_work_rollback_on_exception(db_session):
    """
    Test that an exception inside the UoW block automatically rolls back
    all intermediate inserts.
    """
    class SimulatedError(Exception):
        pass

    try:
        with UnitOfWork(db_session) as uow:
            user = uow.users.create(sub="auth0|rollback", email="rollback@example.com")
            
            # This insert succeeds in memory/flush
            audio = uow.audio_assets.create(
                user_id=user.id,
                r2_object_key="test/rollback.wav",
                file_name="rollback.wav",
                content_hash="fedcba",
                file_size_bytes=2048,
                duration_seconds=2.5
            )
            
            # Simulate a failure (e.g. invalid state transition, API error, etc.)
            raise SimulatedError("Something went wrong before commit")
    except SimulatedError:
        pass
        
    # Assert nothing was saved
    users = uow.users.list()
    assert len(users) == 0
    
    audios = uow.audio_assets.list()
    assert len(audios) == 0
