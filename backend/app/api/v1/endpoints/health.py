from fastapi import APIRouter
from datetime import datetime, timezone
from app.core.config import settings

router = APIRouter()

@router.get("/healthz", summary="Service Health Check")
async def health_check():
    """
    Returns service health status, timestamp, and version metadata.
    Used for readiness and liveness probes.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": settings.VERSION,
        "service": settings.PROJECT_NAME,
    }


from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db, engine
from app.core.circuit_breaker import db_circuit_breaker
import time

@router.get("/health/db", summary="Database Deep Health Check")
def health_db(db: Session = Depends(get_db)):
    if not db_circuit_breaker.can_execute():
        raise HTTPException(status_code=503, detail="Database Circuit Breaker is OPEN")

    start_time = time.time()
    try:
        db.execute(text("SELECT 1")).scalar()
        
        pgvector_ready = False
        is_pg = engine.dialect.name == "postgresql" if engine else False
        if is_pg:
            res = db.execute(text("SELECT extname FROM pg_extension WHERE extname = 'vector'")).scalar()
            pgvector_ready = bool(res)
        
        db_circuit_breaker.record_success()
    except Exception as e:
        db_circuit_breaker.record_failure()
        raise HTTPException(status_code=503, detail="Database unavailable") from e

    latency_ms = (time.time() - start_time) * 1000
    
    active_connections = 0
    if engine and hasattr(engine.pool, "checkedout"):
        active_connections = engine.pool.checkedout()

    return {
        "status": "ok",
        "latency_ms": round(latency_ms, 2),
        "active_connections": active_connections,
        "pgvector_ready": pgvector_ready if is_pg else "N/A (SQLite)",
        "circuit_breaker": db_circuit_breaker.state.value
    }

