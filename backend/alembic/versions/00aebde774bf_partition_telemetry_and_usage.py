"""partition_telemetry_and_usage

Revision ID: 00aebde774bf
Revises: 56e291fffba1
Create Date: 2026-08-15 00:20:01.903066

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '00aebde774bf'
down_revision: Union[str, Sequence[str], None] = '56e291fffba1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # We only apply Postgres-specific partitioning if using Postgres
    context = op.get_context()
    if context.bind.dialect.name == "postgresql":
        # Rename existing tables
        op.execute("ALTER TABLE usage_logs RENAME TO usage_logs_old")
        op.execute("ALTER TABLE telemetry_metrics RENAME TO telemetry_metrics_old")

        # Create Partitioned Tables
        op.execute("""
            CREATE TABLE usage_logs (
                id UUID NOT NULL,
                user_id UUID NOT NULL,
                api_key_id UUID,
                synthesis_job_id UUID,
                characters_count INTEGER NOT NULL DEFAULT 0,
                audio_duration_seconds NUMERIC(8, 3) NOT NULL DEFAULT 0.0,
                compute_ms INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL,
                PRIMARY KEY (id, created_at)
            ) PARTITION BY RANGE (created_at);
        """)

        op.execute("""
            CREATE TABLE telemetry_metrics (
                id UUID NOT NULL,
                job_id VARCHAR(128),
                metric_name VARCHAR(128) NOT NULL,
                metric_value NUMERIC NOT NULL,
                labels JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL,
                PRIMARY KEY (id, created_at)
            ) PARTITION BY RANGE (created_at);
        """)
        
        # Create default partitions to hold existing/fallback data
        op.execute("CREATE TABLE usage_logs_default PARTITION OF usage_logs DEFAULT;")
        op.execute("CREATE TABLE telemetry_metrics_default PARTITION OF telemetry_metrics DEFAULT;")

        # Migrate data
        op.execute("INSERT INTO usage_logs SELECT * FROM usage_logs_old")
        op.execute("INSERT INTO telemetry_metrics SELECT * FROM telemetry_metrics_old")

        # Drop old tables
        op.execute("DROP TABLE usage_logs_old")
        op.execute("DROP TABLE telemetry_metrics_old")


def downgrade() -> None:
    context = op.get_context()
    if context.bind.dialect.name == "postgresql":
        # Rename current back to old names temporarily
        op.execute("ALTER TABLE usage_logs RENAME TO usage_logs_partitioned")
        op.execute("ALTER TABLE telemetry_metrics RENAME TO telemetry_metrics_partitioned")

        # Re-create original unpartitioned tables
        op.execute("""
            CREATE TABLE usage_logs (
                id UUID PRIMARY KEY,
                user_id UUID NOT NULL,
                api_key_id UUID,
                synthesis_job_id UUID,
                characters_count INTEGER NOT NULL DEFAULT 0,
                audio_duration_seconds NUMERIC(8, 3) NOT NULL DEFAULT 0.0,
                compute_ms INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL
            )
        """)

        op.execute("""
            CREATE TABLE telemetry_metrics (
                id UUID PRIMARY KEY,
                job_id VARCHAR(128),
                metric_name VARCHAR(128) NOT NULL,
                metric_value NUMERIC NOT NULL,
                labels JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL
            )
        """)

        # Restore data
        op.execute("INSERT INTO usage_logs SELECT * FROM usage_logs_partitioned")
        op.execute("INSERT INTO telemetry_metrics SELECT * FROM telemetry_metrics_partitioned")

        # Drop partitioned setup
        op.execute("DROP TABLE usage_logs_partitioned CASCADE")
        op.execute("DROP TABLE telemetry_metrics_partitioned CASCADE")
