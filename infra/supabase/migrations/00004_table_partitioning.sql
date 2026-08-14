-- Migration to transform usage_logs and telemetry_metrics to range partitioned tables

-- 1. Transform usage_logs
-- Rename the existing table
ALTER TABLE usage_logs RENAME TO usage_logs_old;

-- Create the partitioned table
CREATE TABLE usage_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    api_key_id UUID,
    synthesis_job_id UUID,
    characters_count INTEGER NOT NULL DEFAULT 0,
    audio_duration_seconds NUMERIC(8,3) NOT NULL DEFAULT 0.000,
    compute_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usage_logs_pkey PRIMARY KEY (id, created_at),
    CONSTRAINT usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT usage_logs_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE SET NULL,
    CONSTRAINT usage_logs_synthesis_job_id_fkey FOREIGN KEY (synthesis_job_id) REFERENCES synthesis_jobs(id) ON DELETE SET NULL
) PARTITION BY RANGE (created_at);

-- Create initial partitions for current and next month
CREATE TABLE usage_logs_2026_08 PARTITION OF usage_logs FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE usage_logs_2026_09 PARTITION OF usage_logs FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
-- Create catch-all partition
CREATE TABLE usage_logs_default PARTITION OF usage_logs DEFAULT;

-- Insert existing data back
INSERT INTO usage_logs SELECT * FROM usage_logs_old;

-- Drop the old table
DROP TABLE usage_logs_old;


-- 2. Transform telemetry_metrics
-- Rename the existing table
ALTER TABLE telemetry_metrics RENAME TO telemetry_metrics_old;

-- Create the partitioned table
CREATE TABLE telemetry_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    job_id VARCHAR(128),
    metric_name VARCHAR(128) NOT NULL,
    metric_value FLOAT NOT NULL,
    labels JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT telemetry_metrics_pkey PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create initial partitions
CREATE TABLE telemetry_metrics_2026_08 PARTITION OF telemetry_metrics FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE telemetry_metrics_2026_09 PARTITION OF telemetry_metrics FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
-- Create catch-all partition
CREATE TABLE telemetry_metrics_default PARTITION OF telemetry_metrics DEFAULT;

-- Insert existing data back
INSERT INTO telemetry_metrics SELECT * FROM telemetry_metrics_old;

-- Drop the old table
DROP TABLE telemetry_metrics_old;
