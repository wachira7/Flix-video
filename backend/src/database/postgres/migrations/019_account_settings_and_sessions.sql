-- Migration 019: Account settings, sessions and account deletion
-- Safe to re-run: the migration runner replays every file.

-- Per-user settings (notifications, preferences, privacy), validated in
-- src/config/user-settings.js
ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Tokens issued before this time are rejected ("sign out everywhere",
-- including tokens issued before sessions existed)
ALTER TABLE users ADD COLUMN IF NOT EXISTS sessions_valid_after TIMESTAMP WITH TIME ZONE;

-- When an account was deleted (status = 'deleted', personal data removed)
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- The devices table (migration 008) now stores one row per sign-in session;
-- tokens carry its id as "sid"
CREATE INDEX IF NOT EXISTS idx_devices_user_active ON devices(user_id, is_active);
