import logging
from typing import Generator
from app.core.config import settings

logger = logging.getLogger(__name__)

# Lazy initialization of SQLAlchemy engine & sessionmaker if DATABASE_URL is configured
try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker, Session
    from sqlalchemy.pool import QueuePool

    DATABASE_URL = getattr(settings, "DATABASE_URL", None)
    READ_REPLICA_URL = getattr(settings, "READ_REPLICA_URL", DATABASE_URL)
    
    if DATABASE_URL:
        connect_args = {}
        if DATABASE_URL.startswith("postgresql") or DATABASE_URL.startswith("postgres"):
            connect_args = {"connect_timeout": 10, "options": "-c statement_timeout=15000"}
            
            # Primary Writer Node configured for PgBouncer / Connection Poolers
            engine = create_engine(
                DATABASE_URL,
                poolclass=QueuePool,
                pool_pre_ping=True,
                pool_size=20,
                max_overflow=40,
                pool_recycle=1800,
                pool_timeout=30,
                connect_args=connect_args
            )
            
            # Read Replica Node (falls back to Primary if not explicitly set)
            read_engine = create_engine(
                READ_REPLICA_URL,
                poolclass=QueuePool,
                pool_pre_ping=True,
                pool_size=30,  # Reads scale higher
                max_overflow=60,
                pool_recycle=1800,
                pool_timeout=30,
                connect_args=connect_args
            )
        else:
            engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
            read_engine = engine
            
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        ReadSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=read_engine)
    else:
        engine = None
        read_engine = None
        SessionLocal = None
        ReadSessionLocal = None
except ImportError:
    engine = None
    read_engine = None
    SessionLocal = None
    ReadSessionLocal = None
    logger.warning("SQLAlchemy not installed or DATABASE_URL not configured. Database session manager disabled.")


def get_db() -> Generator:
    """
    FastAPI dependency yielding a primary (write) database session with auto-rollback/close handling.
    """
    if SessionLocal is None:
        yield None
        return

    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database session exception (Writer): {e}")
        raise
    finally:
        db.close()

def get_read_session() -> Generator:
    """
    FastAPI dependency yielding a read-only database session pointing to the replica.
    Use this for heavy vector searches (e.g. match_voices) to offload the primary writer node.
    """
    if ReadSessionLocal is None:
        yield None
        return

    db = ReadSessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database session exception (Reader): {e}")
        raise
    finally:
        db.close()
