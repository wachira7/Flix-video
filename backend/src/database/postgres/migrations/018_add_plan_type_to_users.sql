-- Migration 018: Add plan_type column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'free';
UPDATE users SET plan_type = 'free' WHERE plan_type IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);