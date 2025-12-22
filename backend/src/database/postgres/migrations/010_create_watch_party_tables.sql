-- Watch Parties Migration
-- Creates tables for real-time watch party functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Watch Parties Table
CREATE TABLE IF NOT EXISTS watch_parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('movie', 'tv_show')),
    content_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    episode_number INT, -- For TV shows
    season_number INT,  -- For TV shows
    is_public BOOLEAN DEFAULT false,
    max_participants INT DEFAULT 50,
    party_code VARCHAR(8) UNIQUE NOT NULL, -- 8-character join code
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'paused', 'ended')),
    current_timestamp DECIMAL(10, 2) DEFAULT 0.00, -- Current video position in seconds
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

-- Watch Party Messages (Chat)
CREATE TABLE IF NOT EXISTS watch_party_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id UUID NOT NULL REFERENCES watch_parties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'reaction', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_watch_parties_host ON watch_parties(host_user_id);
CREATE INDEX idx_watch_parties_code ON watch_parties(party_code);
CREATE INDEX idx_watch_parties_status ON watch_parties(status);
CREATE INDEX idx_watch_parties_created ON watch_parties(created_at DESC);

CREATE INDEX idx_party_participants_party ON watch_party_participants(party_id);
CREATE INDEX idx_party_participants_user ON watch_party_participants(user_id);
CREATE INDEX idx_party_participants_active ON watch_party_participants(is_active);

CREATE INDEX idx_party_messages_party ON watch_party_messages(party_id);
CREATE INDEX idx_party_messages_created ON watch_party_messages(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_watch_parties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_watch_parties_updated_at
    BEFORE UPDATE ON watch_parties
    FOR EACH ROW
    EXECUTE FUNCTION update_watch_parties_updated_at();

-- Function to generate unique party code
CREATE OR REPLACE FUNCTION generate_party_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Avoid confusing chars like 0,O,1,I
    result TEXT := '';
    i INT;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE watch_parties IS 'Stores watch party sessions for synchronized viewing';
COMMENT ON TABLE watch_party_participants IS 'Tracks users participating in watch parties';
COMMENT ON TABLE watch_party_messages IS 'Stores chat messages and reactions during watch parties';
COMMENT ON COLUMN watch_parties.party_code IS 'Unique 8-character code for joining party';
COMMENT ON COLUMN watch_parties.current_timestamp IS 'Current video position in seconds for synchronization';
