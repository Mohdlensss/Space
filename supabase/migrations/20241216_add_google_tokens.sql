-- Add Google OAuth token storage to profiles table
-- This allows Space to access Google Calendar, Gmail, and Drive on behalf of users

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ;

-- Add a comment for documentation
COMMENT ON COLUMN profiles.google_access_token IS 'Google OAuth access token for API calls';
COMMENT ON COLUMN profiles.google_refresh_token IS 'Google OAuth refresh token for getting new access tokens';
COMMENT ON COLUMN profiles.google_token_expires_at IS 'When the access token expires';

-- Enable RLS policy for tokens (only user can see their own tokens)
-- The existing RLS policies should already cover this since they're row-level

