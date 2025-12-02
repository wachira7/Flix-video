-- Migration 003: Create Genre Tables
-- Description: Genre taxonomy and content-genre relationships
-- Author: WaruTech
-- Date: 2025-11-24

-- ============================================
-- GENRES TABLE
-- ============================================
CREATE TABLE genres (
    id INTEGER PRIMARY KEY, -- TMDB genre ID
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_genres_name ON genres(name);
CREATE INDEX idx_genres_slug ON genres(slug);

-- ============================================
-- MOVIE GENRES (Many-to-Many)
-- ============================================
CREATE TABLE movie_genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(movie_id, genre_id)
);

-- Create indexes
CREATE INDEX idx_movie_genres_movie_id ON movie_genres(movie_id);
CREATE INDEX idx_movie_genres_genre_id ON movie_genres(genre_id);

-- ============================================
-- TV SHOW GENRES (Many-to-Many)
-- ============================================
CREATE TABLE tv_show_genres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tv_show_id BIGINT NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
    genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tv_show_id, genre_id)
);

-- Create indexes
CREATE INDEX idx_tv_show_genres_tv_show_id ON tv_show_genres(tv_show_id);
CREATE INDEX idx_tv_show_genres_genre_id ON tv_show_genres(genre_id);

-- ============================================
-- TRIGGER
-- ============================================
CREATE TRIGGER update_genres_updated_at
    BEFORE UPDATE ON genres
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED GENRES (TMDB Standard Genres)
-- ============================================
INSERT INTO genres (id, name, slug, description) VALUES
-- Movie Genres
(28, 'Action', 'action', 'High-energy films with physical stunts and chases'),
(12, 'Adventure', 'adventure', 'Exciting journeys and quests'),
(16, 'Animation', 'animation', 'Animated films for all ages'),
(35, 'Comedy', 'comedy', 'Humorous and entertaining films'),
(80, 'Crime', 'crime', 'Stories about criminals and law enforcement'),
(99, 'Documentary', 'documentary', 'Non-fiction films about real events'),
(18, 'Drama', 'drama', 'Serious narrative films'),
(10751, 'Family', 'family', 'Films suitable for all ages'),
(14, 'Fantasy', 'fantasy', 'Magical and supernatural stories'),
(36, 'History', 'history', 'Historical events and periods'),
(27, 'Horror', 'horror', 'Scary and suspenseful films'),
(10402, 'Music', 'music', 'Musical performances and stories'),
(9648, 'Mystery', 'mystery', 'Puzzling and suspenseful narratives'),
(10749, 'Romance', 'romance', 'Love stories and relationships'),
(878, 'Science Fiction', 'science-fiction', 'Futuristic and speculative fiction'),
(10770, 'TV Movie', 'tv-movie', 'Made-for-television films'),
(53, 'Thriller', 'thriller', 'Tense and suspenseful films'),
(10752, 'War', 'war', 'Military conflict and warfare'),
(37, 'Western', 'western', 'American frontier stories'),

-- TV Genres
(10759, 'Action & Adventure', 'action-adventure-tv', 'Action-packed TV series'),
(10762, 'Kids', 'kids', 'Children''s programming'),
(10763, 'News', 'news', 'News and current affairs'),
(10764, 'Reality', 'reality', 'Reality TV shows'),
(10765, 'Sci-Fi & Fantasy', 'sci-fi-fantasy-tv', 'Science fiction and fantasy TV'),
(10766, 'Soap', 'soap', 'Soap operas'),
(10767, 'Talk', 'talk', 'Talk shows'),
(10768, 'War & Politics', 'war-politics', 'Political dramas and war stories')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE genres IS 'Content genre categories from TMDB';
COMMENT ON TABLE movie_genres IS 'Many-to-many relationship between movies and genres';
COMMENT ON TABLE tv_show_genres IS 'Many-to-many relationship between TV shows and genres';

COMMENT ON COLUMN genres.id IS 'TMDB genre ID';
COMMENT ON COLUMN genres.slug IS 'URL-friendly genre identifier';