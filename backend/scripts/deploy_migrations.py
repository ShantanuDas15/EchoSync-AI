import sys
import os
import sqlalchemy
from alembic.config import Config
from alembic import command
import glob

def run_migrations(db_url=None, lock_id=None):
    if not db_url:
        db_url = os.environ.get("DATABASE_URL", "sqlite:///:memory:")
    if not lock_id:
        lock_id = int(os.environ.get("MIGRATION_LOCK_ID", "987654321"))

    engine = sqlalchemy.create_engine(db_url)
    is_postgres = engine.dialect.name == "postgresql"

    with engine.connect() as conn:
        if is_postgres:
            print(f"Acquiring pg_advisory_lock({lock_id})...")
            conn.execute(sqlalchemy.text(f"SELECT pg_advisory_lock({lock_id})"))
        
        try:
            print("Running Alembic migrations...")
            # Allow passing a custom path to alembic.ini for testing
            ini_path = os.environ.get("ALEMBIC_INI_PATH", "alembic.ini")
            alembic_cfg = Config(ini_path)
            
            # Validate downgrade/upgrade path if CI_VALIDATE_MIGRATIONS is set
            if os.environ.get("CI_VALIDATE_MIGRATIONS") == "true":
                print("Validating downgrade/upgrade paths...")
                command.downgrade(alembic_cfg, "-1")
                command.upgrade(alembic_cfg, "head")
                
            print("Applying Alembic migrations to head...")
            command.upgrade(alembic_cfg, "head")
            
            print("Checking for Supabase artifacts (000*.sql)...")
            sql_files = sorted(glob.glob("supabase/migrations/000*.sql"))
            for sql_file in sql_files:
                print(f"Applying {sql_file}...")
                with open(sql_file, 'r') as f:
                    sql_content = f.read()
                    if sql_content.strip():
                        conn.execute(sqlalchemy.text(sql_content))
                        conn.commit()
                        
            print("All migrations applied successfully.")
            return True
        finally:
            if is_postgres:
                print(f"Releasing pg_advisory_lock({lock_id})...")
                conn.execute(sqlalchemy.text(f"SELECT pg_advisory_unlock({lock_id})"))
                conn.commit()

if __name__ == "__main__":
    run_migrations()
