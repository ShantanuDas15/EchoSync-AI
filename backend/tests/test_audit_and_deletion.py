import pytest
import os
import uuid
import time
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.db.base import Base, User
from app.db.repositories.base import BaseRepository



def test_soft_deletion_filtering(db_session):
    """Test that soft-deleted rows are invisible to standard repository queries."""
    repo = BaseRepository(User, db_session)
    
    user1 = repo.create(sub="auth|sd1", email="sd1@example.com")
    user2 = repo.create(sub="auth|sd2", email="sd2@example.com")
    db_session.commit()
    
    # Soft delete user1
    user1.deleted_at = datetime.now(timezone.utc)
    db_session.commit()
    
    # Assert get_by_id ignores soft-deleted
    assert repo.get_by_id(user1.id) is None
    assert repo.get_by_id(user2.id) is not None
    
    # Assert list ignores soft-deleted
    all_users = repo.list()
    assert len(all_users) == 1
    assert all_users[0].id == user2.id

def test_postgres_updated_at_audit_trigger(db_session):
    """Verify raw DB updates bump updated_at without Python intervention."""
    repo = BaseRepository(User, db_session)
    
    user = repo.create(sub="auth|trig", email="trig@example.com")
    db_session.commit()
    
    original_updated_at = user.updated_at
    
    time.sleep(0.1) # Ensure time difference
    
    # Update directly via SQL to bypass SQLAlchemy's onupdate mechanics
    db_session.execute(
        text("UPDATE users SET full_name = 'Trigger Tester' WHERE id = :uid"),
        {"uid": user.id}
    )
    db_session.commit()
    
    # Refresh user
    db_session.refresh(user)
    
    assert user.full_name == 'Trigger Tester'
    assert user.updated_at > original_updated_at
