import pytest
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import ProgrammingError
from app.db.base import Base, SpeakerProfile, User
import uuid

# Only run actual RLS tests if testing against Postgres
# SQLite does not support RLS or SET LOCAL.
DB_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")
is_postgres = DB_URL.startswith("postgresql")

@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(DB_URL)
    if is_postgres:
        Base.metadata.create_all(engine)
    else:
        # For sqlite, just create tables for parsing checks
        Base.metadata.create_all(engine)
        
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    yield db
    db.close()
    
    if is_postgres:
        Base.metadata.drop_all(engine)

def test_rls_sql_file_exists_and_valid():
    """Verify that the RLS migration file exists and contains the correct policies."""
    sql_file_path = os.path.join(os.path.dirname(__file__), "../../infra/supabase/migrations/00006_rls_policies.sql")
    assert os.path.exists(sql_file_path)
    
    with open(sql_file_path, "r") as f:
        sql = f.read()
        
    # Ensure RLS is enabled on all tables
    assert "ALTER TABLE users ENABLE ROW LEVEL SECURITY;" in sql
    assert "ALTER TABLE speaker_profiles ENABLE ROW LEVEL SECURITY;" in sql
    
    # Ensure zero-trust policies are defined
    assert "CREATE POLICY" in sql
    assert "users_select_own" in sql
    assert "auth_uid()" in sql

@pytest.mark.skipif(not is_postgres, reason="SQLite does not support Row-Level Security")
def test_rls_isolation_blocks_cross_tenant_reads(db_session):
    """
    Simulates a scoped DB session with SET LOCAL.
    Asserts that user_a physically cannot SELECT or UPDATE records belonging to user_b.
    """
    user_a_id = uuid.uuid4()
    user_b_id = uuid.uuid4()
    
    # Bypass RLS to insert test data (using superuser or temporarily disabling RLS)
    # In this test, we assume the connection has privileges to insert initially
    db_session.execute(text("SET LOCAL request.jwt.claim.sub = ''"))
    
    user_a = User(id=user_a_id, sub="auth0|a", email="a@example.com")
    user_b = User(id=user_b_id, sub="auth0|b", email="b@example.com")
    db_session.add_all([user_a, user_b])
    db_session.commit()
    
    profile_b = SpeakerProfile(
        id=uuid.uuid4(),
        user_id=user_b_id,
        speaker_name="Speaker B",
        visibility="private",
        embedding="[0.0]"
    )
    db_session.add(profile_b)
    db_session.commit()
    
    # Now simulate a request authenticated as user_a
    db_session.execute(text("SET LOCAL request.jwt.claim.sub = :uid"), {"uid": str(user_a_id)})
    
    # User A tries to read User B's private profile
    result = db_session.query(SpeakerProfile).filter(SpeakerProfile.id == profile_b.id).first()
    
    # RLS should silently filter out the record
    assert result is None
    
    # User A tries to update User B's private profile
    try:
        db_session.execute(
            text("UPDATE speaker_profiles SET speaker_name = 'Hacked' WHERE id = :pid"),
            {"pid": profile_b.id}
        )
        db_session.commit()
    except ProgrammingError:
        pass # Some DBs might throw error, Postgres RLS usually just silently updates 0 rows
        
    # Verify it was not updated (bypassing RLS again to check)
    db_session.execute(text("SET LOCAL request.jwt.claim.sub = ''"))
    check_profile = db_session.query(SpeakerProfile).filter(SpeakerProfile.id == profile_b.id).first()
    assert check_profile.speaker_name == "Speaker B"
