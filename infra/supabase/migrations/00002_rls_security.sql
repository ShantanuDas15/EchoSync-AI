-- Migration: 00002_rls_security.sql
-- Description: Implement Row-Level Security (RLS) on speaker_profiles table

-- 1. Enable RLS on the table
ALTER TABLE speaker_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Add user_id column to map to Clerk/NextAuth JWT subject
ALTER TABLE speaker_profiles ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- 3. Create Policy: Users can only select their own profiles
CREATE POLICY "Users can view their own speaker profiles"
ON speaker_profiles
FOR SELECT
USING (auth.uid()::text = user_id OR user_id IS NULL); -- IS NULL for public demo profiles

-- 4. Create Policy: Users can only insert their own profiles
CREATE POLICY "Users can insert their own speaker profiles"
ON speaker_profiles
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- 5. Create Policy: Users can only update their own profiles
CREATE POLICY "Users can update their own speaker profiles"
ON speaker_profiles
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- 6. Create Policy: Users can only delete their own profiles
CREATE POLICY "Users can delete their own speaker profiles"
ON speaker_profiles
FOR DELETE
USING (auth.uid()::text = user_id);
