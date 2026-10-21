-- Migration 021: one-click demo accounts, and the watch party status default.
-- Demo accounts are real users marked is_demo, deleted after demo_expires_at.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_users_demo_expires ON users(demo_expires_at) WHERE is_demo;

-- watch_parties.status defaulted to 'scheduled', which its own CHECK
-- constraint rejects (waiting, playing, paused, ended), so inserts that
-- relied on the default failed.
ALTER TABLE watch_parties ALTER COLUMN status SET DEFAULT 'waiting';
