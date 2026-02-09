-- Migration 014: Create Notifications Table
-- Description: Notifications system for billing, watch party, and other alerts
-- Author: WaruTech
-- Date: 2026-02-08

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'billing', 'payment', 'subscription', 
        'watch_party', 'social', 'content', 'system'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Comments
COMMENT ON TABLE notifications IS 'User notifications for billing, watch party, and system alerts';
COMMENT ON COLUMN notifications.type IS 'billing, payment, subscription, watch_party, social, content, system';
COMMENT ON COLUMN notifications.data IS 'Additional JSON data (e.g., payment amount, party code, etc.)';
