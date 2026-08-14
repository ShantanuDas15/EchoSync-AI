-- Migration: Stored Procedures & Backward Compatibility Views
-- Implements the match_voices RPC for optimized vector similarity search
-- and the voices view for legacy SDK backward compatibility.

-- 1. Optimized Vector Similarity RPC Function
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
        sp.gender,
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

-- 2. Backward Compatibility Layer: View `voices`
CREATE OR REPLACE VIEW voices AS
SELECT 
    id,
    speaker_name AS name,
    description,
    gender,
    language_code,
    embedding,
    user_id,
    reference_audio_url,
    (visibility = 'public' OR visibility = 'system_preset') AS is_public,
    metadata,
    created_at,
    updated_at
FROM speaker_profiles
WHERE is_active = true AND deleted_at IS NULL;
