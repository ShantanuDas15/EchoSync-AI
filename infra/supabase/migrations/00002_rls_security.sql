-- Migration: 00002_rls_security.sql
-- Description: Enable and configure strict Row-Level Security (RLS) policies for multi-tenant isolation.

-- 1. Enable RLS on operational tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthesis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_metrics ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies for 'users'
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (auth.uid()::text = sub OR sub IS NULL);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid()::text = sub)
WITH CHECK (auth.uid()::text = sub);

-- 3. RLS Policies for 'speaker_profiles'
CREATE POLICY "Users can view public or own speaker profiles"
ON speaker_profiles FOR SELECT
USING (
    visibility IN ('public', 'system_preset')
    OR (auth.uid()::text = (SELECT sub FROM users WHERE id = speaker_profiles.user_id))
    OR user_id IS NULL
);

CREATE POLICY "Users can insert their own speaker profiles"
ON speaker_profiles FOR INSERT
WITH CHECK (
    auth.uid()::text = (SELECT sub FROM users WHERE id = speaker_profiles.user_id)
    OR user_id IS NULL
);

CREATE POLICY "Users can update their own speaker profiles"
ON speaker_profiles FOR UPDATE
USING (auth.uid()::text = (SELECT sub FROM users WHERE id = speaker_profiles.user_id))
WITH CHECK (auth.uid()::text = (SELECT sub FROM users WHERE id = speaker_profiles.user_id));

CREATE POLICY "Users can delete their own speaker profiles"
ON speaker_profiles FOR DELETE
USING (auth.uid()::text = (SELECT sub FROM users WHERE id = speaker_profiles.user_id));

-- 4. RLS Policies for 'audio_assets'
CREATE POLICY "Users can view their own or public audio assets"
ON audio_assets FOR SELECT
USING (
    auth.uid()::text = (SELECT sub FROM users WHERE id = audio_assets.user_id)
    OR user_id IS NULL
);

CREATE POLICY "Users can insert their own audio assets"
ON audio_assets FOR INSERT
WITH CHECK (
    auth.uid()::text = (SELECT sub FROM users WHERE id = audio_assets.user_id)
    OR user_id IS NULL
);

-- 5. RLS Policies for 'synthesis_jobs'
CREATE POLICY "Users can view their own synthesis jobs"
ON synthesis_jobs FOR SELECT
USING (
    auth.uid()::text = (SELECT sub FROM users WHERE id = synthesis_jobs.user_id)
    OR user_id IS NULL
);

CREATE POLICY "Users can insert their own synthesis jobs"
ON synthesis_jobs FOR INSERT
WITH CHECK (
    auth.uid()::text = (SELECT sub FROM users WHERE id = synthesis_jobs.user_id)
    OR user_id IS NULL
);

-- 6. RLS Policies for 'api_keys'
CREATE POLICY "Users can manage their own API keys"
ON api_keys FOR ALL
USING (auth.uid()::text = (SELECT sub FROM users WHERE id = api_keys.user_id));

-- 7. RLS Policies for 'usage_logs'
CREATE POLICY "Users can view their own usage logs"
ON usage_logs FOR SELECT
USING (auth.uid()::text = (SELECT sub FROM users WHERE id = usage_logs.user_id));
