-- Migration: 00001_create_embeddings.sql
-- Description: Core production DDL schema for EchoSync AI including vector extension, core entities, views, and integrity constraints.

-- 1. Enable pgvector Extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Custom ENUM Types for Controlled Control Flow
DO $$ BEGIN
    CREATE TYPE user_tier_enum AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender_enum AS ENUM ('male', 'female', 'non_binary', 'unspecified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE visibility_enum AS ENUM ('private', 'shared', 'public', 'system_preset');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status_enum AS ENUM ('queued', 'processing', 'streaming', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE api_key_status_enum AS ENUM ('active', 'revoked', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create 'users' Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub VARCHAR(255) UNIQUE NOT NULL, -- Clerk / NextAuth / Supabase Auth Subject ID
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    tier user_tier_enum NOT NULL DEFAULT 'free',
    api_quota_monthly INTEGER NOT NULL DEFAULT 50000 CHECK (api_quota_monthly >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 4. Create 'audio_assets' Table
CREATE TABLE IF NOT EXISTS audio_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    storage_bucket VARCHAR(128) NOT NULL DEFAULT 'echosync-audio-vault',
    r2_object_key VARCHAR(512) UNIQUE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_hash VARCHAR(64) NOT NULL, -- SHA256 hex
    mime_type VARCHAR(64) NOT NULL DEFAULT 'audio/wav',
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    duration_seconds NUMERIC(8,3) NOT NULL CHECK (duration_seconds > 0),
    sample_rate INTEGER NOT NULL DEFAULT 22050 CHECK (sample_rate > 0),
    channels SMALLINT NOT NULL DEFAULT 1 CHECK (channels IN (1, 2)),
    bit_depth SMALLINT NOT NULL DEFAULT 16 CHECK (bit_depth IN (8, 16, 24, 32)),
    is_reference_sample BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create 'speaker_profiles' Table
CREATE TABLE IF NOT EXISTS speaker_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    speaker_name VARCHAR(255) NOT NULL,
    description TEXT,
    gender gender_enum NOT NULL DEFAULT 'unspecified',
    language_code VARCHAR(10) NOT NULL DEFAULT 'en-US',
    embedding vector(256) NOT NULL, -- 256-d d-vector
    reference_audio_id UUID REFERENCES audio_assets(id) ON DELETE SET NULL,
    reference_audio_url TEXT,
    visibility visibility_enum NOT NULL DEFAULT 'private',
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 6. Create 'synthesis_jobs' Table
CREATE TABLE IF NOT EXISTS synthesis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(128) UNIQUE NOT NULL, -- Celery Task ID
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    speaker_profile_id UUID REFERENCES speaker_profiles(id) ON DELETE SET NULL,
    prompt_text TEXT NOT NULL,
    phoneme_sequence TEXT,
    speed_modifier NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (speed_modifier BETWEEN 0.50 AND 2.00),
    pitch_modifier NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (pitch_modifier BETWEEN 0.50 AND 2.00),
    energy_modifier NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (energy_modifier BETWEEN 0.50 AND 2.00),
    acoustic_model VARCHAR(64) NOT NULL DEFAULT 'fastspeech2_fp16',
    vocoder_model VARCHAR(64) NOT NULL DEFAULT 'hifigan_fp16',
    status job_status_enum NOT NULL DEFAULT 'queued',
    output_audio_id UUID REFERENCES audio_assets(id) ON DELETE SET NULL,
    real_time_factor NUMERIC(6,4) CHECK (real_time_factor >= 0),
    ttfb_ms INTEGER CHECK (ttfb_ms >= 0),
    worker_id VARCHAR(128),
    execution_engine VARCHAR(64) NOT NULL DEFAULT 'hf_cpu_onnx',
    error_detail JSONB,
    queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create 'api_keys' Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_name VARCHAR(128) NOT NULL,
    key_prefix VARCHAR(16) NOT NULL,
    key_hash VARCHAR(128) UNIQUE NOT NULL,
    scopes JSONB NOT NULL DEFAULT '["synthesis:write", "voices:read"]'::jsonb,
    rate_limit_per_minute INTEGER NOT NULL DEFAULT 60 CHECK (rate_limit_per_minute > 0),
    status api_key_status_enum NOT NULL DEFAULT 'active',
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Create 'usage_logs' Table
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    synthesis_job_id UUID REFERENCES synthesis_jobs(id) ON DELETE SET NULL,
    characters_count INTEGER NOT NULL DEFAULT 0 CHECK (characters_count >= 0),
    audio_duration_seconds NUMERIC(8,3) NOT NULL DEFAULT 0.000 CHECK (audio_duration_seconds >= 0),
    compute_ms INTEGER NOT NULL DEFAULT 0 CHECK (compute_ms >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Create 'telemetry_metrics' Table
CREATE TABLE IF NOT EXISTS telemetry_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(128),
    metric_name VARCHAR(128) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    labels JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Backward Compatibility View 'voices'
CREATE OR REPLACE VIEW voices AS
SELECT 
    id,
    speaker_name AS name,
    description,
    gender::text AS gender,
    language_code,
    embedding,
    user_id::text AS user_id,
    reference_audio_url,
    (visibility IN ('public', 'system_preset')) AS is_public,
    metadata,
    created_at,
    updated_at
FROM speaker_profiles
WHERE is_active = true AND deleted_at IS NULL;
