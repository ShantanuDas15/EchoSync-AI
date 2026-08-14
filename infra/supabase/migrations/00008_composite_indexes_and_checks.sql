-- Migration: Composite Indexing & Data Integrity Constraints
-- Implements highly-selective B-Tree composite indexes for query optimization
-- and hardens data bounds using native CHECK constraints to prevent application faults.

-- 1. Composite B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_speaker_profiles_user_visibility 
ON speaker_profiles (user_id, visibility, is_active) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_synthesis_jobs_task_id 
ON synthesis_jobs (task_id);

CREATE INDEX IF NOT EXISTS idx_synthesis_jobs_user_status_created 
ON synthesis_jobs (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash 
ON api_keys (key_hash) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_audio_assets_content_hash 
ON audio_assets (content_hash);

-- 2. Data Integrity CHECK Constraints
-- Adding to users
ALTER TABLE users ADD CONSTRAINT chk_users_api_quota CHECK (api_quota_monthly >= 0);

-- Adding to audio_assets
ALTER TABLE audio_assets ADD CONSTRAINT chk_audio_file_size CHECK (file_size_bytes > 0);
ALTER TABLE audio_assets ADD CONSTRAINT chk_audio_duration CHECK (duration_seconds > 0);
ALTER TABLE audio_assets ADD CONSTRAINT chk_audio_sample_rate CHECK (sample_rate > 0);
ALTER TABLE audio_assets ADD CONSTRAINT chk_audio_channels CHECK (channels IN (1, 2));
ALTER TABLE audio_assets ADD CONSTRAINT chk_audio_bit_depth CHECK (bit_depth IN (8, 16, 24, 32));

-- Adding to synthesis_jobs
ALTER TABLE synthesis_jobs ADD CONSTRAINT chk_synthesis_speed CHECK (speed_modifier BETWEEN 0.50 AND 2.00);
ALTER TABLE synthesis_jobs ADD CONSTRAINT chk_synthesis_pitch CHECK (pitch_modifier BETWEEN 0.50 AND 2.00);
ALTER TABLE synthesis_jobs ADD CONSTRAINT chk_synthesis_energy CHECK (energy_modifier BETWEEN 0.50 AND 2.00);
ALTER TABLE synthesis_jobs ADD CONSTRAINT chk_synthesis_rtf CHECK (real_time_factor >= 0);
ALTER TABLE synthesis_jobs ADD CONSTRAINT chk_synthesis_ttfb CHECK (ttfb_ms >= 0);

-- Adding to api_keys
ALTER TABLE api_keys ADD CONSTRAINT chk_api_keys_rate_limit CHECK (rate_limit_per_minute > 0);

-- Adding to usage_logs
ALTER TABLE usage_logs ADD CONSTRAINT chk_usage_characters CHECK (characters_count >= 0);
ALTER TABLE usage_logs ADD CONSTRAINT chk_usage_duration CHECK (audio_duration_seconds >= 0);
ALTER TABLE usage_logs ADD CONSTRAINT chk_usage_compute CHECK (compute_ms >= 0);
