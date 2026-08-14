import logging
from typing import Generator
from app.core.config import settings

logger = logging.getLogger(__name__)

# Lazy initialization of SQLAlchemy engine & sessionmaker if DATABASE_URL is configured
try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker, Session

    DATABASE_URL = getattr(settings, "DATABASE_URL", None)
    if DATABASE_URL:
        connect_args = {}
        if DATABASE_URL.startswith("postgresql") or DATABASE_URL.startswith("postgres"):
            connect_args = {"connect_timeout": 10, "options": "-c statement_timeout=15000"}
            engine = create_engine(
                DATABASE_URL,
                pool_pre_ping=True,
                pool_size=20,
                max_overflow=40,
                pool_recycle=1800,
                pool_timeout=30,
                connect_args=connect_args
            )
        else:
            engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    else:
        engine = None
        SessionLocal = None
except ImportError:
    engine = None
    SessionLocal = None
    logger.warning("SQLAlchemy not installed or DATABASE_URL not configured. Database session manager disabled.")


def get_db() -> Generator:
    """
    FastAPI dependency yielding a database session with auto-rollback/close handling.
    """
    if SessionLocal is None:
        yield None
        return

    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database session exception: {e}")
        raise
    finally:
        db.close()
