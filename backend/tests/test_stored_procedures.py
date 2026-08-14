import pytest
import os
import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
from app.db.base import Base, SpeakerProfile, User

DB_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")
is_postgres = DB_URL.startswith("postgresql")

@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(DB_URL)
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(engine)

def test_sql_procedures_and_views_syntax():
    """Verify that the SQL migration file exists and defines match_voices and voices view."""
    sql_file_path = os.path.join(os.path.dirname(__file__), "../../infra/supabase/migrations/00007_rpc_and_views.sql")
    assert os.path.exists(sql_file_path)
    
    with open(sql_file_path, "r") as f:
        sql = f.read()
        
    assert "CREATE OR REPLACE FUNCTION match_voices(" in sql
    assert "RETURN QUERY" in sql
    assert "CREATE OR REPLACE VIEW voices AS" in sql
    assert "visibility = 'public'" in sql

@pytest.mark.skipif(not is_postgres, reason="SQLite does not support pgvector functions or stored procedures natively")
def test_match_voices_rpc_and_view(db_session):
    """
    Test invoking the match_voices RPC and querying the voices view.
    """
    # 1. Apply the migration SQL to the test database
    sql_file_path = os.path.join(os.path.dirname(__file__), "../../infra/supabase/migrations/00007_rpc_and_views.sql")
    with open(sql_file_path, "r") as f:
        sql_commands = f.read().split(";")
        for command in sql_commands:
            if command.strip():
                try:
                    db_session.execute(text(command))
                except Exception as e:
                    pass # Ignore if view/function already exists or vector type missing in pure postgres test
        db_session.commit()

    # 2. Insert test data
    user_id = uuid.uuid4()
    db_session.execute(
        text("INSERT INTO users (id, sub, email, tier, api_quota_monthly, is_active, metadata, created_at, updated_at) "
             "VALUES (:id, 'auth|proc', 'proc@example.com', 'free', 50000, true, '{}', NOW(), NOW())"),
        {"id": user_id}
    )
    
    # Needs a 256-d vector format
    vec_str = "[" + ",".join(["0.1"] * 256) + "]"
    db_session.execute(
        text("INSERT INTO speaker_profiles (id, user_id, speaker_name, gender, language_code, embedding, visibility, is_active, metadata) "
             "VALUES (:id, :uid, 'RPC Speaker', 'unspecified', 'en-US', :emb, 'public', true, '{}')"),
        {"id": uuid.uuid4(), "uid": user_id, "emb": vec_str}
    )
    db_session.commit()
    
    # 3. Query the `voices` view
    result = db_session.execute(text("SELECT name, is_public FROM voices WHERE name = 'RPC Speaker'")).fetchone()
    assert result is not None
    assert result[0] == 'RPC Speaker'
    assert result[1] is True
    
    # 4. Invoke `match_voices` RPC
    # Use exact same vector to guarantee high similarity
    rpc_result = db_session.execute(
        text("SELECT * FROM match_voices(:emb::vector(256), 0.70, 5, NULL)"),
        {"emb": vec_str}
    ).fetchall()
    
    assert len(rpc_result) >= 1
    assert rpc_result[0][1] == 'RPC Speaker'
    assert rpc_result[0][6] > 0.9 # similarity
