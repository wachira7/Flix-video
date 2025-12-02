-- Migration 004: Create Streaming Platform Tables
-- Description: Streaming platforms and content availability by country
-- Author: WaruTech
-- Date: 2025-11-24

-- ============================================
-- STREAMING PLATFORMS TABLE
-- ============================================
CREATE TABLE streaming_platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_streaming_platforms_slug ON streaming_platforms(slug);
CREATE INDEX idx_streaming_platforms_is_active ON streaming_platforms(is_active);
CREATE INDEX idx_streaming_platforms_display_order ON streaming_platforms(display_order);

-- ============================================
-- MOVIE STREAMING AVAILABILITY
-- ============================================
CREATE TABLE movie_streaming_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES streaming_platforms(id) ON DELETE CASCADE,
    country_code VARCHAR(2) NOT NULL, -- ISO 3166-1 alpha-2
    availability_type VARCHAR(50) NOT NULL CHECK (availability_type IN ('stream', 'rent', 'buy', 'free')),
    price DECIMAL(10, 2),
    currency VARCHAR(3), -- ISO 4217 currency code
    quality VARCHAR(20), -- HD, 4K, SD
    url TEXT,
    available_from DATE,
    available_until DATE,
    is_available BOOLEAN DEFAULT TRUE,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(movie_id, platform_id, country_code, availability_type)
);

-- Create indexes
CREATE INDEX idx_movie_streaming_movie_id ON movie_streaming_availability(movie_id);
CREATE INDEX idx_movie_streaming_platform_id ON movie_streaming_availability(platform_id);
CREATE INDEX idx_movie_streaming_country ON movie_streaming_availability(country_code);
CREATE INDEX idx_movie_streaming_type ON movie_streaming_availability(availability_type);
CREATE INDEX idx_movie_streaming_available ON movie_streaming_availability(is_available);
CREATE INDEX idx_movie_streaming_composite ON movie_streaming_availability(movie_id, country_code, is_available);

-- ============================================
-- TV SHOW STREAMING AVAILABILITY
-- ============================================
CREATE TABLE tv_show_streaming_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tv_show_id BIGINT NOT NULL REFERENCES tv_shows(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES streaming_platforms(id) ON DELETE CASCADE,
    country_code VARCHAR(2) NOT NULL,
    availability_type VARCHAR(50) NOT NULL CHECK (availability_type IN ('stream', 'rent', 'buy', 'free')),
    price DECIMAL(10, 2),
    currency VARCHAR(3),
    quality VARCHAR(20),
    url TEXT,
    available_from DATE,
    available_until DATE,
    is_available BOOLEAN DEFAULT TRUE,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tv_show_id, platform_id, country_code, availability_type)
);

-- Create indexes
CREATE INDEX idx_tv_streaming_tv_show_id ON tv_show_streaming_availability(tv_show_id);
CREATE INDEX idx_tv_streaming_platform_id ON tv_show_streaming_availability(platform_id);
CREATE INDEX idx_tv_streaming_country ON tv_show_streaming_availability(country_code);
CREATE INDEX idx_tv_streaming_type ON tv_show_streaming_availability(availability_type);
CREATE INDEX idx_tv_streaming_available ON tv_show_streaming_availability(is_available);
CREATE INDEX idx_tv_streaming_composite ON tv_show_streaming_availability(tv_show_id, country_code, is_available);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_streaming_platforms_updated_at
    BEFORE UPDATE ON streaming_platforms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movie_streaming_updated_at
    BEFORE UPDATE ON movie_streaming_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tv_streaming_updated_at
    BEFORE UPDATE ON tv_show_streaming_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED STREAMING PLATFORMS
-- ============================================
INSERT INTO streaming_platforms (name, slug, description, display_order) VALUES
('Netflix', 'netflix', 'Streaming service with original content and movies', 1),
('Amazon Prime Video', 'amazon-prime', 'Amazon''s streaming service', 2),
('Disney+', 'disney-plus', 'Disney, Marvel, Star Wars, and more', 3),
('Hulu', 'hulu', 'US streaming service with TV shows and movies', 4),
('HBO Max', 'hbo-max', 'HBO content and Warner Bros. productions', 5),
('Apple TV+', 'apple-tv-plus', 'Apple''s original content streaming service', 6),
('Paramount+', 'paramount-plus', 'CBS, Paramount, and more', 7),
('Peacock', 'peacock', 'NBCUniversal streaming service', 8),
('Showtime', 'showtime', 'Premium cable and streaming network', 9),
('Starz', 'starz', 'Premium entertainment streaming', 10),
('YouTube', 'youtube', 'Video sharing and streaming platform', 11),
('Crunchyroll', 'crunchyroll', 'Anime streaming service', 12),
('Funimation', 'funimation', 'Anime streaming and dubbing', 13),
('ESPN+', 'espn-plus', 'Sports streaming service', 14),
('Discovery+', 'discovery-plus', 'Reality TV and documentaries', 15)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE streaming_platforms IS 'Streaming service providers';
COMMENT ON TABLE movie_streaming_availability IS 'Where movies are available to stream by country';
COMMENT ON TABLE tv_show_streaming_availability IS 'Where TV shows are available to stream by country';

COMMENT ON COLUMN movie_streaming_availability.country_code IS 'ISO 3166-1 alpha-2 country code (e.g., US, GB, KE)';
COMMENT ON COLUMN movie_streaming_availability.availability_type IS 'How content is available: stream (subscription), rent, buy, or free';
COMMENT ON COLUMN movie_streaming_availability.currency IS 'ISO 4217 currency code (e.g., USD, GBP, KES)';
COMMENT ON COLUMN movie_streaming_availability.last_checked_at IS 'Last time availability was verified';