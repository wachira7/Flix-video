-- Migration 017: Fix ratings to support 0-10 scale
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_rating_check;
ALTER TABLE ratings ALTER COLUMN rating TYPE DECIMAL(3, 1);
ALTER TABLE ratings ADD CONSTRAINT ratings_rating_check 
    CHECK (rating >= 0 AND rating <= 10);
