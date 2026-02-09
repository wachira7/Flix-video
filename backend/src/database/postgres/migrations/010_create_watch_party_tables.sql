-- Migration 010: Watch Party Tables (Smart Migration)
-- Description: Creates or updates watch party tables for real-time functionality
-- Handles both fresh installs and upgrades from migration 006
-- Author: WaruTech
-- Date: 2026-01-31

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 1: CREATE TABLES (if they don't exist)
-- ============================================

-- Watch Parties Table
CREATE TABLE IF NOT EXISTS watch_parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('movie', 'tv_show')),
    content_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    episode_number INT,
    season_number INT,
    is_public BOOLEAN DEFAULT false,
    max_participants INT DEFAULT 50,
    party_code VARCHAR(8) UNIQUE,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'paused', 'ended')),
    video_position DECIMAL(10, 2) DEFAULT 0.00,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Watch Party Participants Table
CREATE TABLE IF NOT EXISTS watch_party_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id UUID NOT NULL REFERENCES watch_parties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_host BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(party_id, user_id)
);

-- Watch Party Messages Table
CREATE TABLE IF NOT EXISTS watch_party_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id UUID NOT NULL REFERENCES watch_parties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'reaction', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: FIX EXISTING TABLES (if from migration 006)
-- ============================================

-- Fix watch_parties table if it has old schema
DO $$ 
BEGIN
    -- Check if old column exists and rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_parties' AND column_name = 'host_id'
    ) THEN
        ALTER TABLE watch_parties RENAME COLUMN host_id TO host_user_id;
        RAISE NOTICE 'Renamed host_id to host_user_id';
    END IF;

    -- Add party_code if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_parties' AND column_name = 'party_code'
    ) THEN
        ALTER TABLE watch_parties ADD COLUMN party_code VARCHAR(8) UNIQUE;
        RAISE NOTICE 'Added party_code column';
    END IF;

    -- Add video_position if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_parties' AND column_name = 'video_position'
    ) THEN
        ALTER TABLE watch_parties ADD COLUMN video_position DECIMAL(10, 2) DEFAULT 0.00;
        RAISE NOTICE 'Added video_position column';
    END IF;

    -- Drop scheduled_at if exists (not needed)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_parties' AND column_name = 'scheduled_at'
    ) THEN
        ALTER TABLE watch_parties DROP COLUMN scheduled_at;
        RAISE NOTICE 'Removed scheduled_at column';
    END IF;

    -- Drop description if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_parties' AND column_name = 'description'
    ) THEN
        ALTER TABLE watch_parties DROP COLUMN description;
        RAISE NOTICE 'Removed description column';
    END IF;

    -- Drop participants_count if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_parties' AND column_name = 'participants_count'
    ) THEN
        ALTER TABLE watch_parties DROP COLUMN participants_count;
        RAISE NOTICE 'Removed participants_count column';
    END IF;

    -- Drop chat_enabled if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_parties' AND column_name = 'chat_enabled'
    ) THEN
        ALTER TABLE watch_parties DROP COLUMN chat_enabled;
        RAISE NOTICE 'Removed chat_enabled column';
    END IF;

    -- Update status constraint
    ALTER TABLE watch_parties DROP CONSTRAINT IF EXISTS watch_parties_status_check;
    ALTER TABLE watch_parties ADD CONSTRAINT watch_parties_status_check 
        CHECK (status IN ('waiting', 'playing', 'paused', 'ended'));

    -- Update content_type constraint
    ALTER TABLE watch_parties DROP CONSTRAINT IF EXISTS watch_parties_content_type_check;
    ALTER TABLE watch_parties ADD CONSTRAINT watch_parties_content_type_check 
        CHECK (content_type IN ('movie', 'tv_show'));

    -- Map old status values to new ones
    UPDATE watch_parties SET status = CASE 
        WHEN status = 'scheduled' THEN 'waiting'
        WHEN status = 'live' THEN 'playing'
        WHEN status IN ('ended', 'cancelled') THEN 'ended'
        ELSE status
    END WHERE status IN ('scheduled', 'live', 'cancelled');

END $$;

-- Fix watch_party_participants table
DO $$ 
BEGIN
    -- Rename watch_party_id to party_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_party_participants' AND column_name = 'watch_party_id'
    ) THEN
        ALTER TABLE watch_party_participants RENAME COLUMN watch_party_id TO party_id;
        RAISE NOTICE 'Renamed watch_party_id to party_id';
    END IF;

    -- Add is_host if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_party_participants' AND column_name = 'is_host'
    ) THEN
        ALTER TABLE watch_party_participants ADD COLUMN is_host BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_host column';
    END IF;

    -- Add is_active if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_party_participants' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE watch_party_participants ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column';
    END IF;

    -- Map old status to is_active
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_party_participants' AND column_name = 'status'
    ) THEN
        UPDATE watch_party_participants SET is_active = 
            CASE WHEN status IN ('accepted', 'joined') THEN true ELSE false END;
        ALTER TABLE watch_party_participants DROP COLUMN status;
        RAISE NOTICE 'Migrated status to is_active';
    END IF;

END $$;

-- ============================================
-- STEP 3: INDEXES
-- ============================================

-- Drop old indexes
DROP INDEX IF EXISTS idx_watch_parties_host_id;
DROP INDEX IF EXISTS idx_watch_parties_scheduled_at;
DROP INDEX IF EXISTS idx_watch_parties_public_upcoming;
DROP INDEX IF EXISTS idx_watch_party_participants_party_id;
DROP INDEX IF EXISTS idx_watch_party_participants_status;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_watch_parties_host_user_id ON watch_parties(host_user_id);
CREATE INDEX IF NOT EXISTS idx_watch_parties_code ON watch_parties(party_code);
CREATE INDEX IF NOT EXISTS idx_watch_parties_status ON watch_parties(status);
CREATE INDEX IF NOT EXISTS idx_watch_parties_created ON watch_parties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watch_parties_is_public ON watch_parties(is_public);

CREATE INDEX IF NOT EXISTS idx_party_participants_party ON watch_party_participants(party_id);
CREATE INDEX IF NOT EXISTS idx_party_participants_user ON watch_party_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_party_participants_active ON watch_party_participants(is_active);

CREATE INDEX IF NOT EXISTS idx_party_messages_party ON watch_party_messages(party_id);
CREATE INDEX IF NOT EXISTS idx_party_messages_created ON watch_party_messages(created_at DESC);

-- ============================================
-- STEP 4: FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_watch_parties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_watch_parties_updated_at ON watch_parties;
CREATE TRIGGER trigger_update_watch_parties_updated_at
    BEFORE UPDATE ON watch_parties
    FOR EACH ROW
    EXECUTE FUNCTION update_watch_parties_updated_at();

-- Function to generate unique party code
CREATE OR REPLACE FUNCTION generate_party_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INT;
    max_attempts INT := 10;
    attempt INT := 0;
BEGIN
    LOOP
        result := '';
        FOR i IN 1..8 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        
        IF NOT EXISTS (SELECT 1 FROM watch_parties WHERE party_code = result) THEN
            RETURN result;
        END IF;
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique party code';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate party codes for existing parties without one
DO $$
DECLARE
    party_record RECORD;
BEGIN
    FOR party_record IN SELECT id FROM watch_parties WHERE party_code IS NULL LOOP
        UPDATE watch_parties 
        SET party_code = generate_party_code() 
        WHERE id = party_record.id;
    END LOOP;
END $$;

-- Make party_code NOT NULL after populating
ALTER TABLE watch_parties ALTER COLUMN party_code SET NOT NULL;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS trigger_update_watch_party_participants_count ON watch_party_participants;
DROP FUNCTION IF EXISTS update_watch_party_participants_count() CASCADE;

-- ============================================
-- STEP 5: COMMENTS
-- ============================================

COMMENT ON TABLE watch_parties IS 'Real-time watch party sessions for synchronized viewing';
COMMENT ON TABLE watch_party_participants IS 'Users participating in watch parties';
COMMENT ON TABLE watch_party_messages IS 'Chat messages and reactions during watch parties';

COMMENT ON COLUMN watch_parties.party_code IS 'Unique 8-character code for joining party';
COMMENT ON COLUMN watch_parties.video_position IS 'Current video position in seconds for synchronization';
COMMENT ON COLUMN watch_parties.status IS 'Party status: waiting, playing, paused, or ended';
COMMENT ON COLUMN watch_party_participants.is_host IS 'Whether user is the party host';
COMMENT ON COLUMN watch_party_participants.is_active IS 'Whether user is currently in the party';