-- Migration 005: Create User Interaction Tables
-- Description: Watchlist, favorites, watched content, ratings, and reviews
-- Author: WaruTech
-- Date: 2025-11-24

-- ============================================
-- WATCHLIST TABLE (Movies & TV Shows)
-- ============================================
CREATE TABLE watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('movie', 'tv_show')),
    content_id BIGINT NOT NULL,
    notes TEXT,
    priority INTEGER DEFAULT 0, -- User can prioritize items
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, content_type, content_id)
);

-- Create indexes
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_watchlist_content_type ON watchlist(content_type);
CREATE INDEX idx_watchlist_content_id ON watchlist(content_id);
CREATE INDEX idx_watchlist_user_content ON watchlist(user_id, content_type, content_id);
CREATE INDEX idx_watchlist_added_at ON watchlist(added_at DESC);

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('movie', 'tv_show')),
    content_id BIGINT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, content_type, content_id)
);

-- Create indexes
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_content_type ON favorites(content_type);
CREATE INDEX idx_favorites_content_id ON favorites(content_id);
CREATE INDEX idx_favorites_user_content ON favorites(user_id, content_type, content_id);
CREATE INDEX idx_favorites_added_at ON favorites(added_at DESC);

-- ============================================
-- WATCHED CONTENT TABLE
-- ============================================
CREATE TABLE watched_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('movie', 'tv_show', 'episode')),
    content_id BIGINT NOT NULL,
    season_number INTEGER, -- For episodes
    episode_number INTEGER, -- For episodes
    watch_count INTEGER DEFAULT 1,
    last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress_seconds INTEGER DEFAULT 0, -- Playback position
    duration_seconds INTEGER, -- Total duration
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_watched_user_id ON watched_content(user_id);
CREATE INDEX idx_watched_content_type ON watched_content(content_type);
CREATE INDEX idx_watched_content_id ON watched_content(content_id);
CREATE INDEX idx_watched_last_watched ON watched_content(last_watched_at DESC);
CREATE INDEX idx_watched_user_content ON watched_content(user_id, content_type, content_id);
CREATE INDEX idx_watched_user_recent ON watched_content(user_id, last_watched_at DESC);

-- ============================================
-- RATINGS TABLE
-- ============================================
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('movie', 'tv_show')),
    content_id BIGINT NOT NULL,
    rating DECIMAL(2, 1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, content_type, content_id)
);

-- Create indexes
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_content_type ON ratings(content_type);
CREATE INDEX idx_ratings_content_id ON ratings(content_id);
CREATE INDEX idx_ratings_rating ON ratings(rating DESC);
CREATE INDEX idx_ratings_user_content ON ratings(user_id, content_type, content_id);
CREATE INDEX idx_ratings_created_at ON ratings(created_at DESC);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('movie', 'tv_show')),
    content_id BIGINT NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    contains_spoilers BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, content_type, content_id)
);

-- Create indexes
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_content_type ON reviews(content_type);
CREATE INDEX idx_reviews_content_id ON reviews(content_id);
CREATE INDEX idx_reviews_is_public ON reviews(is_public);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_likes_count ON reviews(likes_count DESC);
CREATE INDEX idx_reviews_content_public ON reviews(content_type, content_id, is_public);

-- Full text search on reviews
ALTER TABLE reviews ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'B')
    ) STORED;

CREATE INDEX idx_reviews_search_vector ON reviews USING gin(search_vector);

-- ============================================
-- REVIEW LIKES TABLE
-- ============================================
CREATE TABLE review_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- Create indexes
CREATE INDEX idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX idx_review_likes_user_id ON review_likes(user_id);

-- ============================================
-- TRIGGER: Update review likes count
-- ============================================
CREATE OR REPLACE FUNCTION update_review_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews SET likes_count = likes_count + 1 WHERE id = NEW.review_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reviews SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.review_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_likes_count_insert
    AFTER INSERT ON review_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_likes_count();

CREATE TRIGGER trigger_update_review_likes_count_delete
    AFTER DELETE ON review_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_likes_count();

-- ============================================
-- TRIGGERS: Update timestamps
-- ============================================
CREATE TRIGGER update_watched_content_updated_at
    BEFORE UPDATE ON watched_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at
    BEFORE UPDATE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE watchlist IS 'User watchlist for movies and TV shows';
COMMENT ON TABLE favorites IS 'User favorite movies and TV shows';
COMMENT ON TABLE watched_content IS 'User watch history with progress tracking';
COMMENT ON TABLE ratings IS 'User ratings for movies and TV shows (0.5 to 5.0 stars)';
COMMENT ON TABLE reviews IS 'User reviews for movies and TV shows';
COMMENT ON TABLE review_likes IS 'Likes on user reviews';

COMMENT ON COLUMN watchlist.content_type IS 'Type of content: movie or tv_show';
COMMENT ON COLUMN watchlist.priority IS 'User-defined priority for watchlist items';
COMMENT ON COLUMN watched_content.progress_seconds IS 'Current playback position in seconds';
COMMENT ON COLUMN watched_content.completed IS 'Whether user finished watching';
COMMENT ON COLUMN ratings.rating IS 'Rating from 0.5 to 5.0 stars (half-star increments)';
COMMENT ON COLUMN reviews.contains_spoilers IS 'Flag to warn users about spoilers';
COMMENT ON COLUMN reviews.likes_count IS 'Cached count of likes for performance';