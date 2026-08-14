import pytest
import os
import importlib
from unittest import mock
from sqlalchemy.orm import Session
from sqlalchemy.pool import QueuePool
from app.db import session
import builtins

original_getattr = builtins.getattr

def mock_getattr(obj, name, default=None):
    if name == "DATABASE_URL":
        return "postgresql://user:pass@localhost:5432/main"
    elif name == "READ_REPLICA_URL":
        return "postgresql://user:pass@localhost:5432/replica"
    return original_getattr(obj, name, default)

@pytest.fixture(autouse=True)
def setup_settings():
    with mock.patch("app.db.session.getattr", side_effect=mock_getattr):
        importlib.reload(session)
        yield
    importlib.reload(session)

def test_db_engines_initialized():
    """Verify engines are initialized with QueuePool for postgres."""
    assert session.engine is not None
    assert session.read_engine is not None
    assert isinstance(session.engine.pool, QueuePool)
    assert isinstance(session.read_engine.pool, QueuePool)
    assert session.engine.pool.size() == 20
    assert session.read_engine.pool.size() == 30

def test_get_db_yields_session():
    """Verify get_db dependency yields a valid writer Session."""
    generator = session.get_db()
    db = next(generator)
    assert isinstance(db, Session)
    
    # Clean up generator (triggers the finally block which closes the session)
    with pytest.raises(StopIteration):
        next(generator)

def test_get_read_session_yields_session():
    """Verify get_read_session dependency yields a valid reader Session."""
    generator = session.get_read_session()
    db = next(generator)
    assert isinstance(db, Session)
    
    with pytest.raises(StopIteration):
        next(generator)

def test_get_read_session_is_distinct():
    """Verify that the sessions are unique instances."""
    gen1 = session.get_db()
    gen2 = session.get_read_session()
    
    db1 = next(gen1)
    db2 = next(gen2)
    
    # Different session instances
    assert db1 is not db2
    
    with pytest.raises(StopIteration):
        next(gen1)
    with pytest.raises(StopIteration):
        next(gen2)
