-- Migration 013: Create Review Comments Table
-- Description: Add comments functionality to reviews with nested replies
-- Author: WaruTech
-- Date: 2025-01-13

-- ============================================
-- REVIEW COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS review_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES review_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_review_comments_review_id ON review_comments(review_id);
CREATE INDEX idx_review_comments_user_id ON review_comments(user_id);
CREATE INDEX idx_review_comments_parent_id ON review_comments(parent_comment_id);
CREATE INDEX idx_review_comments_created_at ON review_comments(created_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_review_comments_updated_at
    BEFORE UPDATE ON review_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE review_comments IS 'Comments on user reviews with support for nested replies (up to 3 levels)';
COMMENT ON COLUMN review_comments.parent_comment_id IS 'Reference to parent comment for nested replies';
COMMENT ON COLUMN review_comments.content IS 'Comment text, max 1000 characters';