-- Migration 002: Create Content Tables (Movies & TV Shows)
-- Description: TMDB movie and TV show data tables
-- Author: WaruTech
-- Date: 2025-11-24

-- ============================================
-- MOVIES TABLE
-- ============================================
CREATE TABLE movies (
    id BIGINT PRIMARY KEY, -- TMDB movie ID
    tmdb_id BIGINT UNIQUE NOT NULL,
    imdb_id VARCHAR(20),
    title VARCHAR(500) NOT NULL,
    original_title VARCHAR(500),
    tagline TEXT,
    overview TEXT,
    poster_path VARCHAR(500),
    backdrop_path VARCHAR(500),
    release_date DATE,
    runtime INTEGER, -- in minutes
    status VARCHAR(50), -- Released, Post Production, etc
    original_language VARCHAR(10),
    budget BIGINT,
    revenue BIGINT,
    popularity DECIMAL(10, 3),
    vote_average DECIMAL(3, 1),
    vote_count INTEGER,
    adult BOOLEAN DEFAULT FALSE,
    video BOOLEAN DEFAULT FALSE,
    homepage TEXT,
    tmdb_data JSONB, -- Store full TMDB response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_movies_tmdb_id ON movies(tmdb_id);
CREATE INDEX idx_movies_title ON movies USING gin(to_tsvector('english', title));
CREATE INDEX idx_movies_release_date ON movies(release_date DESC);
CREATE INDEX idx_movies_popularity ON movies(popularity DESC);
CREATE INDEX idx_movies_vote_average ON movies(vote_average DESC);
CREATE INDEX idx_movies_original_language ON movies(original_language);
CREATE INDEX idx_movies_status ON movies(status);

-- ============================================
-- TV SHOWS TABLE
-- ============================================
CREATE TABLE tv_shows (
    id BIGINT PRIMARY KEY, -- TMDB TV ID
    tmdb_id BIGINT UNIQUE NOT NULL,
    imdb_id VARCHAR(20),
    name VARCHAR(500) NOT NULL,
    original_name VARCHAR(500),
    tagline TEXT,
    overview TEXT,
    poster_path VARCHAR(500),
    backdrop_path VARCHAR(500),
    first_air_date DATE,
    last_air_date DATE,
    status VARCHAR(50), -- Returning Series, Ended, Canceled, etc
    type VARCHAR(50), -- Scripted, Reality, Documentary, etc
    original_language VARCHAR(10),
    number_of_seasons INTEGER,
    number_of_episodes INTEGER,
    episode_run_time INTEGER[], -- Array of episode lengths
    in_production BOOLEAN DEFAULT FALSE,
    popularity DECIMAL(10, 3),
    vote_average DECIMAL(3, 1),
    vote_count INTEGER,
    adult BOOLEAN DEFAULT FALSE,
    homepage TEXT,
    tmdb_data JSONB, -- Store full TMDB response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tv_shows_tmdb_id ON tv_shows(tmdb_id);
CREATE INDEX idx_tv_shows_name ON tv_shows USING gin(to_tsvector('english', name));
CREATE INDEX idx_tv_shows_first_air_date ON tv_shows(first_air_date DESC);
CREATE INDEX idx_tv_shows_popularity ON tv_shows(popularity DESC);
CREATE INDEX idx_tv_shows_vote_average ON tv_shows(vote_average DESC);
CREATE INDEX idx_tv_shows_original_language ON tv_shows(original_language);
CREATE INDEX idx_tv_shows_status ON tv_shows(status);
CREATE INDEX idx_tv_shows_in_production ON tv_shows(in_production);

-- ============================================
-- MOVIE CAST & CREW (Simplified)
-- ============================================
CREATE TABLE movie_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    person_id BIGINT NOT NULL, -- TMDB person ID
    name VARCHAR(255) NOT NULL,
    character_name VARCHAR(255), -- For cast
    job VARCHAR(100), -- For crew (Director, Writer, etc)
    department VARCHAR(100), -- For crew
    credit_type VARCHAR(50) NOT NULL CHECK (credit_type IN ('cast', 'crew')),
    order_index INTEGER, -- Cast order
    profile_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_movie_credits_movie_id ON movie_credits(movie_id);
CREATE INDEX idx_movie_credits_person_id ON movie_credits(person_id);
CREATE INDEX idx_movie_credits_name ON movie_credits(name);
CREATE INDEX idx_movie_credits_credit_type ON movie_credits(credit_type);

-- ============================================
-- TV SHOW CAST & CREW (Simplified)
-- ============================================
CREATE TABLE tv_show_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tv_show_id BIGINT NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
    person_id BIGINT NOT NULL, -- TMDB person ID
    name VARCHAR(255) NOT NULL,
    character_name VARCHAR(255), -- For cast
    job VARCHAR(100), -- For crew
    department VARCHAR(100), -- For crew
    credit_type VARCHAR(50) NOT NULL CHECK (credit_type IN ('cast', 'crew')),
    order_index INTEGER,
    profile_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tv_show_credits_tv_show_id ON tv_show_credits(tv_show_id);
CREATE INDEX idx_tv_show_credits_person_id ON tv_show_credits(person_id);
CREATE INDEX idx_tv_show_credits_name ON tv_show_credits(name);
CREATE INDEX idx_tv_show_credits_credit_type ON tv_show_credits(credit_type);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_movies_updated_at
    BEFORE UPDATE ON movies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tv_shows_updated_at
    BEFORE UPDATE ON tv_shows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FULL TEXT SEARCH
-- ============================================
-- Add generated column for full text search on movies
ALTER TABLE movies ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(original_title, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(overview, '')), 'C')
    ) STORED;

CREATE INDEX idx_movies_search_vector ON movies USING gin(search_vector);

-- Add generated column for full text search on TV shows
ALTER TABLE tv_shows ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(original_name, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(overview, '')), 'C')
    ) STORED;

CREATE INDEX idx_tv_shows_search_vector ON tv_shows USING gin(search_vector);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE movies IS 'Movie metadata from TMDB';
COMMENT ON TABLE tv_shows IS 'TV show metadata from TMDB';
COMMENT ON TABLE movie_credits IS 'Movie cast and crew information';
COMMENT ON TABLE tv_show_credits IS 'TV show cast and crew information';

COMMENT ON COLUMN movies.tmdb_id IS 'The Movie Database (TMDB) unique identifier';
COMMENT ON COLUMN movies.tmdb_data IS 'Full TMDB API response stored as JSONB';
COMMENT ON COLUMN tv_shows.tmdb_id IS 'The Movie Database (TMDB) unique identifier';
COMMENT ON COLUMN tv_shows.episode_run_time IS 'Array of typical episode runtimes in minutes';