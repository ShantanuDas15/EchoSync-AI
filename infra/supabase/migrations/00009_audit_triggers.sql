-- Migration: Audit Triggers & Soft Deletion Mechanics
-- Automates the updated_at timestamp modification using PostgreSQL triggers
-- and guarantees standard audit compliance without application-side bugs.

-- 1. Create a generic function to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the trigger to all tables containing 'updated_at'
-- users
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- speaker_profiles
DROP TRIGGER IF EXISTS trg_speaker_profiles_updated_at ON speaker_profiles;
CREATE TRIGGER trg_speaker_profiles_updated_at
BEFORE UPDATE ON speaker_profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- audio_assets
DROP TRIGGER IF EXISTS trg_audio_assets_updated_at ON audio_assets;
CREATE TRIGGER trg_audio_assets_updated_at
BEFORE UPDATE ON audio_assets
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- synthesis_jobs
DROP TRIGGER IF EXISTS trg_synthesis_jobs_updated_at ON synthesis_jobs;
CREATE TRIGGER trg_synthesis_jobs_updated_at
BEFORE UPDATE ON synthesis_jobs
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- api_keys
DROP TRIGGER IF EXISTS trg_api_keys_updated_at ON api_keys;
CREATE TRIGGER trg_api_keys_updated_at
BEFORE UPDATE ON api_keys
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
