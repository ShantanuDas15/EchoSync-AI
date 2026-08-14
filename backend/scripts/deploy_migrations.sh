#!/bin/bash
# deploy_migrations.sh
# CI/CD Automated Database Migration Pipeline
set -e

# Configuration
DB_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5432/postgres"}
MIGRATION_LOCK_ID=987654321  # Arbitrary lock ID for advisory lock

echo "=========================================="
echo "Starting CI/CD Database Migration Pipeline"
echo "=========================================="

# We will use Python to acquire the lock and run Alembic migrations safely
# to ensure the advisory lock is held during the entire Alembic process.
# Then we will apply any Supabase artifacts (000*.sql) if they exist.

export DATABASE_URL=$DB_URL
export MIGRATION_LOCK_ID=$MIGRATION_LOCK_ID

SCRIPT_DIR=$(dirname "$0")
python3 "$SCRIPT_DIR/deploy_migrations.py"

echo "=========================================="
echo "Pipeline Completed Successfully."
echo "=========================================="
