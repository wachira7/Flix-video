-- Migration 014: Create Notifications Table
-- Description: Notifications system for billing, watch party, and other alerts
-- Author: WaruTech
-- Date: 2026-02-08


-- Migration 014: Updated on 2026-02-22

-- Add missing columns to existing notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;

-- Update type column to support all notification categories
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN (
        'billing', 'payment', 'subscription',
        'watch_party', 'social', 'content', 'system'
    ));

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Comments
COMMENT ON TABLE notifications IS 'User notifications for billing, watch party, and system alerts';
COMMENT ON COLUMN notifications.type IS 'billing, payment, subscription, watch_party, social, content, system';
COMMENT ON COLUMN notifications.data IS 'Additional JSON data (e.g., payment amount, party code, etc.)';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read';
