-- Migration: 00003_pgvector_hnsw_indexes.sql
-- Description: Create HNSW vector indices, composite relational indexes, automated timestamp triggers, and stored RPC function match_voices.

-- 1. Create Trigger Function for Automatic Timestamp Updates
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to entities with updated_at columns
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trigger_speaker_profiles_updated_at ON speaker_profiles;
CREATE TRIGGER trigger_speaker_profiles_updated_at BEFORE UPDATE ON speaker_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trigger_audio_assets_updated_at ON audio_assets;
CREATE TRIGGER trigger_audio_assets_updated_at BEFORE UPDATE ON audio_assets FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trigger_synthesis_jobs_updated_at ON synthesis_jobs;
CREATE TRIGGER trigger_synthesis_jobs_updated_at BEFORE UPDATE ON synthesis_jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trigger_api_keys_updated_at ON api_keys;
CREATE TRIGGER trigger_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- 2. HNSW Vector Indexing on speaker_profiles(embedding)
CREATE INDEX IF NOT EXISTS idx_speaker_profiles_embedding_hnsw 
ON speaker_profiles 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 3. Composite & Relational B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_speaker_profiles_user_visibility 
ON speaker_profiles (user_id, visibility, is_active) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_synthesis_jobs_task_id 
ON synthesis_jobs (task_id);

CREATE INDEX IF NOT EXISTS idx_synthesis_jobs_user_status_created 
ON synthesis_jobs (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audio_assets_content_hash 
ON audio_assets (content_hash);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash 
ON api_keys (key_hash) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created 
ON usage_logs (user_id, created_at DESC);

-- 4. Stored RPC Function 'match_voices' for 256-d Cosine Similarity Search
CREATE OR REPLACE FUNCTION match_voices(
    query_embedding vector(256),
    match_threshold float DEFAULT 0.70,
    match_count int DEFAULT 5,
    filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    speaker_name varchar,
    description text,
    gender varchar,
    language_code varchar,
    reference_audio_url text,
    similarity float,
    created_at timestamptz
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.speaker_name,
        sp.description,
        sp.gender::varchar,
        sp.language_code,
        sp.reference_audio_url,
        (1 - (sp.embedding <=> query_embedding))::float AS similarity,
        sp.created_at
    FROM speaker_profiles sp
    WHERE sp.is_active = true
      AND sp.deleted_at IS NULL
      AND (
          sp.visibility IN ('public', 'system_preset')
          OR (filter_user_id IS NOT NULL AND sp.user_id = filter_user_id)
      )
      AND (1 - (sp.embedding <=> query_embedding)) >= match_threshold
    ORDER BY sp.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;
