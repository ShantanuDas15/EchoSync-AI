-- Migration: Comprehensive Row-Level Security (RLS)
-- Enables RLS on all primary operational tables and defines strict access policies
-- based on the Supabase current user identity (auth.uid() / request.jwt.claim.sub).

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthesis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to simulate auth.uid() if running outside Supabase native auth
CREATE OR REPLACE FUNCTION auth_uid() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$ LANGUAGE SQL STABLE;

-- 2. Policies for `users`
-- Users can only read and update their own profiles.
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (id = auth_uid());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth_uid());

-- 3. Policies for `speaker_profiles`
-- Users can read their own profiles, plus any profile marked as public or system_preset.
CREATE POLICY "speaker_profiles_select_own_or_public" ON speaker_profiles
  FOR SELECT USING (
    user_id = auth_uid() OR visibility IN ('public', 'system_preset')
  );

CREATE POLICY "speaker_profiles_insert_own" ON speaker_profiles
  FOR INSERT WITH CHECK (user_id = auth_uid());

CREATE POLICY "speaker_profiles_update_own" ON speaker_profiles
  FOR UPDATE USING (user_id = auth_uid());

CREATE POLICY "speaker_profiles_delete_own" ON speaker_profiles
  FOR DELETE USING (user_id = auth_uid());

-- 4. Policies for `audio_assets`
CREATE POLICY "audio_assets_select_own" ON audio_assets
  FOR SELECT USING (user_id = auth_uid());

CREATE POLICY "audio_assets_insert_own" ON audio_assets
  FOR INSERT WITH CHECK (user_id = auth_uid());

CREATE POLICY "audio_assets_delete_own" ON audio_assets
  FOR DELETE USING (user_id = auth_uid());

-- 5. Policies for `synthesis_jobs`
CREATE POLICY "synthesis_jobs_select_own" ON synthesis_jobs
  FOR SELECT USING (user_id = auth_uid());

CREATE POLICY "synthesis_jobs_insert_own" ON synthesis_jobs
  FOR INSERT WITH CHECK (user_id = auth_uid());

CREATE POLICY "synthesis_jobs_update_own" ON synthesis_jobs
  FOR UPDATE USING (user_id = auth_uid());

CREATE POLICY "synthesis_jobs_delete_own" ON synthesis_jobs
  FOR DELETE USING (user_id = auth_uid());

-- 6. Policies for `api_keys`
CREATE POLICY "api_keys_select_own" ON api_keys
  FOR SELECT USING (user_id = auth_uid());

CREATE POLICY "api_keys_insert_own" ON api_keys
  FOR INSERT WITH CHECK (user_id = auth_uid());

CREATE POLICY "api_keys_update_own" ON api_keys
  FOR UPDATE USING (user_id = auth_uid());

CREATE POLICY "api_keys_delete_own" ON api_keys
  FOR DELETE USING (user_id = auth_uid());

-- 7. Policies for `usage_logs`
-- Usage logs are append-only and read-only by the owner.
CREATE POLICY "usage_logs_select_own" ON usage_logs
  FOR SELECT USING (user_id = auth_uid());

CREATE POLICY "usage_logs_insert_own" ON usage_logs
  FOR INSERT WITH CHECK (user_id = auth_uid());
