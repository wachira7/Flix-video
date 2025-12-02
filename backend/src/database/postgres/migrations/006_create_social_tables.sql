-- Migration 006: Create Social Features Tables
-- Description: User follows, watch parties, and custom lists
-- Author: WaruTech
-- Date: 2025-11-24

-- ============================================
-- FOLLOWS TABLE (User-to-User)
-- ============================================
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id) -- User cannot follow themselves
);

-- Create indexes
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_follows_created_at ON follows(created_at DESC);

-- ============================================
-- WATCH PARTIES TABLE
-- ============================================
CREATE TABLE watch_parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('movie', 'tv_show', 'episode')),
    content_id BIGINT NOT NULL,
    season_number INTEGER, -- For episodes
    episode_number INTEGER, -- For episodes
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
    is_public BOOLEAN DEFAULT TRUE,
    max_participants INTEGER,
    participants_count INTEGER DEFAULT 0,
    chat_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_watch_parties_host_id ON watch_parties(host_id);
CREATE INDEX idx_watch_parties_content_type ON watch_parties(content_type);
CREATE INDEX idx_watch_parties_content_id ON watch_parties(content_id);
CREATE INDEX idx_watch_parties_status ON watch_parties(status);
CREATE INDEX idx_watch_parties_scheduled_at ON watch_parties(scheduled_at DESC);
CREATE INDEX idx_watch_parties_is_public ON watch_parties(is_public);
CREATE INDEX idx_watch_parties_public_upcoming ON watch_parties(is_public, scheduled_at) WHERE status = 'scheduled';

-- ============================================
-- WATCH PARTY PARTICIPANTS TABLE
-- ============================================
CREATE TABLE watch_party_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    watch_party_id UUID NOT NULL REFERENCES watch_parties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'joined', 'left')),
    joined_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(watch_party_id, user_id)
);

-- Create indexes
CREATE INDEX idx_watch_party_participants_party_id ON watch_party_participants(watch_party_id);
CREATE INDEX idx_watch_party_participants_user_id ON watch_party_participants(user_id);
CREATE INDEX idx_watch_party_participants_status ON watch_party_participants(status);

-- ============================================
-- LISTS TABLE (Custom User Lists)
-- ============================================
CREATE TABLE lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    is_ranked BOOLEAN DEFAULT FALSE, -- Whether items are ordered
    cover_image_url TEXT,
    items_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_lists_is_public ON lists(is_public);
CREATE INDEX idx_lists_created_at ON lists(created_at DESC);
CREATE INDEX idx_lists_likes_count ON lists(likes_count DESC);
CREATE INDEX idx_lists_user_public ON lists(user_id, is_public);

-- Full text search on lists
ALTER TABLE lists ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED;

CREATE INDEX idx_lists_search_vector ON lists USING gin(search_vector);

-- ============================================
-- LIST ITEMS TABLE
-- ============================================
CREATE TABLE list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('movie', 'tv_show')),
    content_id BIGINT NOT NULL,
    rank_order INTEGER, -- For ranked lists
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(list_id, content_type, content_id)
);

-- Create indexes
CREATE INDEX idx_list_items_list_id ON list_items(list_id);
CREATE INDEX idx_list_items_content_type ON list_items(content_type);
CREATE INDEX idx_list_items_content_id ON list_items(content_id);
CREATE INDEX idx_list_items_rank_order ON list_items(list_id, rank_order);
CREATE INDEX idx_list_items_added_at ON list_items(added_at DESC);

-- ============================================
-- LIST LIKES TABLE
-- ============================================
CREATE TABLE list_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(list_id, user_id)
);

-- Create indexes
CREATE INDEX idx_list_likes_list_id ON list_likes(list_id);
CREATE INDEX idx_list_likes_user_id ON list_likes(user_id);

-- ============================================
-- TRIGGER: Update watch party participants count
-- ============================================
CREATE OR REPLACE FUNCTION update_watch_party_participants_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status IN ('accepted', 'joined') THEN
        UPDATE watch_parties SET participants_count = participants_count + 1 WHERE id = NEW.watch_party_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status NOT IN ('accepted', 'joined') AND NEW.status IN ('accepted', 'joined') THEN
            UPDATE watch_parties SET participants_count = participants_count + 1 WHERE id = NEW.watch_party_id;
        ELSIF OLD.status IN ('accepted', 'joined') AND NEW.status NOT IN ('accepted', 'joined') THEN
            UPDATE watch_parties SET participants_count = GREATEST(participants_count - 1, 0) WHERE id = NEW.watch_party_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status IN ('accepted', 'joined') THEN
        UPDATE watch_parties SET participants_count = GREATEST(participants_count - 1, 0) WHERE id = OLD.watch_party_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_watch_party_participants_count
    AFTER INSERT OR UPDATE OR DELETE ON watch_party_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_watch_party_participants_count();

-- ============================================
-- TRIGGER: Update list items count
-- ============================================
CREATE OR REPLACE FUNCTION update_list_items_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE lists SET items_count = items_count + 1 WHERE id = NEW.list_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE lists SET items_count = GREATEST(items_count - 1, 0) WHERE id = OLD.list_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_list_items_count
    AFTER INSERT OR DELETE ON list_items
    FOR EACH ROW
    EXECUTE FUNCTION update_list_items_count();

-- ============================================
-- TRIGGER: Update list likes count
-- ============================================
CREATE OR REPLACE FUNCTION update_list_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE lists SET likes_count = likes_count + 1 WHERE id = NEW.list_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE lists SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.list_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_list_likes_count
    AFTER INSERT OR DELETE ON list_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_list_likes_count();

-- ============================================
-- TRIGGERS: Update timestamps
-- ============================================
CREATE TRIGGER update_watch_parties_updated_at
    BEFORE UPDATE ON watch_parties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watch_party_participants_updated_at
    BEFORE UPDATE ON watch_party_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at
    BEFORE UPDATE ON lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE follows IS 'User follow relationships (social graph)';
COMMENT ON TABLE watch_parties IS 'Virtual watch party sessions for synchronized viewing';
COMMENT ON TABLE watch_party_participants IS 'Users participating in watch parties';
COMMENT ON TABLE lists IS 'User-created custom lists (like Letterboxd)';
COMMENT ON TABLE list_items IS 'Content items in user lists';
COMMENT ON TABLE list_likes IS 'Likes on user lists';

COMMENT ON COLUMN watch_parties.status IS 'Party status: scheduled, live, ended, or cancelled';
COMMENT ON COLUMN watch_parties.max_participants IS 'Maximum number of participants (NULL = unlimited)';
COMMENT ON COLUMN watch_parties.chat_enabled IS 'Whether chat is enabled during the party';
COMMENT ON COLUMN lists.is_ranked IS 'Whether list items have a specific order/ranking';
COMMENT ON COLUMN list_items.rank_order IS 'Position in ranked lists (1-based)';