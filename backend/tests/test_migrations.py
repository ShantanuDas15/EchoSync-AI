import os
import pytest
from alembic.config import Config
from alembic import command
import sqlalchemy as sa
from sqlalchemy.engine import create_engine

ALEMBIC_INI_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'alembic.ini')
ALEMBIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'alembic')

@pytest.fixture
def alembic_config():
    """Provides Alembic configuration object."""
    config = Config(ALEMBIC_INI_PATH)
    config.set_main_option('script_location', ALEMBIC_DIR)
    
    # Use in-memory SQLite for testing to isolate environment
    # Note: Alembic operations require a file for SQLite sometimes due to locking,
    # but let's try an isolated file
    test_db_url = "sqlite:///test_migrations_test.db"
    config.set_main_option("sqlalchemy.url", test_db_url)
    
    yield config
    
    # Cleanup
    if os.path.exists("test_migrations_test.db"):
        os.remove("test_migrations_test.db")

def test_migrations_up_and_down(alembic_config):
    """
    Test that migrations execute cleanly from base -> head -> base.
    This guarantees zero errors during upgrade and downgrade operations.
    """
    # Upgrade to head
    command.upgrade(alembic_config, "head")
    
    # Verify some tables were created by connecting to the DB
    engine = create_engine(alembic_config.get_main_option("sqlalchemy.url"))
    inspector = sa.inspect(engine)
    tables = inspector.get_table_names()
    
    assert "users" in tables
    assert "speaker_profiles" in tables
    
    # Downgrade to base
    command.downgrade(alembic_config, "base")
    
    # Verify tables were dropped
    inspector = sa.inspect(engine)
    tables_after = inspector.get_table_names()
    
    # alembic_version table remains
    assert "users" not in tables_after
    assert "speaker_profiles" not in tables_after
    
    # Expect only alembic_version (or nothing if sqlite clears it)
    assert len([t for t in tables_after if t != 'alembic_version']) == 0
