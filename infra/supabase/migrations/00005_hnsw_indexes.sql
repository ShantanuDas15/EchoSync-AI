-- Migration to apply HNSW indexing to speaker_profiles.embedding

-- Create the HNSW index on the speaker_profiles table
-- Using L2 distance operator (<->) which is optimal for normalized embeddings
-- m=16, ef_construction=64 are common defaults offering a good balance of speed and recall
CREATE INDEX IF NOT EXISTS ix_speaker_profiles_embedding_hnsw 
ON speaker_profiles 
USING hnsw (embedding vector_l2_ops) 
WITH (m = 16, ef_construction = 64);
