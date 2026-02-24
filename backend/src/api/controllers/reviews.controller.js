const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');
const { reviewsTotal } = require('../../config/metrics');

// Helper to convert 'tv' to 'tv_show' for database
const normalizeContentType = (type) => {
  return type === 'tv' ? 'tv_show' : type;
};

// @desc    Create a review
// @route   POST /api/reviews/:contentType/:contentId
// @access  Private
const createReview = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { title, content, contains_spoilers = false, is_public = true } = req.body;
    const userId = req.user.id;

    if (!['movie', 'tv'].includes(contentType)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Content type must be either "movie" or "tv"'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Review content is required'
      });
    }

    const dbContentType = normalizeContentType(contentType);

    // Check if user already reviewed this content
    const existing = await global.pgPool.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
      [userId, dbContentType, contentId]
    );

    if (existing.rows.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'You have already reviewed this content. Use PUT to update.'
      });
    }

    // Create review
    const result = await global.pgPool.query(
      `INSERT INTO reviews (user_id, content_type, content_id, title, content, contains_spoilers, is_public, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [userId, dbContentType, contentId, title || null, content, contains_spoilers, is_public]
    );

      // Update metrics
    reviewsTotal.inc();

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Review created successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get reviews for specific content
// @route   GET /api/reviews/:contentType/:contentId
// @access  Public
const getContentReviews = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { page = 1, limit = 20, sort = 'recent' } = req.query;
    const offset = (page - 1) * limit;

    if (!['movie', 'tv'].includes(contentType)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Content type must be either "movie" or "tv"'
      });
    }

    const dbContentType = normalizeContentType(contentType);

    // Determine sort order
    let orderBy = 'r.created_at DESC'; // default: recent
    if (sort === 'likes') orderBy = 'r.likes_count DESC, r.created_at DESC';
    else if (sort === 'oldest') orderBy = 'r.created_at ASC';

    // Get reviews with user info
    const query = `
      SELECT 
        r.*,
        u.email,
        COALESCE(up.username, u.email) AS username,
        up.full_name,
        up.avatar_url
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE r.content_type = $1 AND r.content_id = $2 AND r.is_public = true
      ORDER BY ${orderBy}
      LIMIT $3 OFFSET $4
    `;

    const result = await global.pgPool.query(query, [dbContentType, contentId, limit, offset]);

    // Get total count
    const countResult = await global.pgPool.query(
      'SELECT COUNT(*) FROM reviews WHERE content_type = $1 AND content_id = $2 AND is_public = true',
      [dbContentType, contentId]
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit),
      reviews: result.rows
    });
  } catch (error) {
    console.error('Get content reviews error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, contentType } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*,
      u.email,
      COALESCE(up.username, u.email) AS username,
      up.full_name,
      up.avatar_url
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE r.user_id = $1 AND r.is_public = true
    `;
    let params = [userId];

    if (contentType) {
      const dbContentType = normalizeContentType(contentType);
      query += ' AND r.content_type = $2';
      params.push(dbContentType);
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await global.pgPool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM reviews WHERE user_id = $1 AND is_public = true';
    let countParams = [userId];
    if (contentType) {
      const dbContentType = normalizeContentType(contentType);
      countQuery += ' AND content_type = $2';
      countParams.push(dbContentType);
    }
    const countResult = await global.pgPool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit),
      reviews: result.rows
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get my reviews (current user)
// @route   GET /api/reviews/me
// @access  Private
const getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, contentType } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM reviews WHERE user_id = $1';
    let params = [userId];

    if (contentType) {
      const dbContentType = normalizeContentType(contentType);
      query += ' AND content_type = $2';
      params.push(dbContentType);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await global.pgPool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM reviews WHERE user_id = $1';
    let countParams = [userId];
    if (contentType) {
      const dbContentType = normalizeContentType(contentType);
      countQuery += ' AND content_type = $2';
      countParams.push(dbContentType);
    }
    const countResult = await global.pgPool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit),
      reviews: result.rows
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
// @access  Private
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { title, content, contains_spoilers, is_public } = req.body;
    const userId = req.user.id;

    // Check ownership
    const existing = await global.pgPool.query(
      'SELECT * FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (existing.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Review not found'
      });
    }

    if (existing.rows[0].user_id !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'You can only update your own reviews'
      });
    }

    // Update review
    const result = await global.pgPool.query(
      `UPDATE reviews 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           contains_spoilers = COALESCE($3, contains_spoilers),
           is_public = COALESCE($4, is_public),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, content, contains_spoilers, is_public, reviewId]
    );

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Check ownership
    const existing = await global.pgPool.query(
      'SELECT user_id FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (existing.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Review not found'
      });
    }

    if (existing.rows[0].user_id !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'You can only delete your own reviews'
      });
    }

    // Delete review (cascade will delete likes)
    await global.pgPool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Like/Unlike a review
// @route   POST /api/reviews/:reviewId/like
// @access  Private
const toggleReviewLike = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Check if review exists
    const reviewExists = await global.pgPool.query(
      'SELECT id FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (reviewExists.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Check if already liked
    const existing = await global.pgPool.query(
      'SELECT id FROM review_likes WHERE review_id = $1 AND user_id = $2',
      [reviewId, userId]
    );

    if (existing.rows.length > 0) {
      // Unlike
      await global.pgPool.query(
        'DELETE FROM review_likes WHERE review_id = $1 AND user_id = $2',
        [reviewId, userId]
      );

      res.json({
        success: true,
        message: 'Review unliked',
        liked: false
      });
    } else {
      // Like
      await global.pgPool.query(
        'INSERT INTO review_likes (review_id, user_id, created_at) VALUES ($1, $2, NOW())',
        [reviewId, userId]
      );

      res.json({
        success: true,
        message: 'Review liked',
        liked: true
      });
    }
  } catch (error) {
    console.error('Toggle review like error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};


// @desc    Get comments for a review
// @route   GET /api/reviews/:reviewId/comments
// @access  Public
const getReviewComments = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Get comments with user info and nested replies
    const query = `
      WITH RECURSIVE comment_tree AS (
        -- Top-level comments (no parent)
        SELECT 
          c.*,
          u.email,
          COALESCE(up.username, u.email) as username,
          up.avatar_url,
          0 as depth,
          ARRAY[c.created_at::text, c.id::text] as path
        FROM review_comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE c.review_id = $1 AND c.parent_comment_id IS NULL
        
        UNION ALL
        
        -- Nested replies (recursive)
        SELECT 
          c.*,
          u.email,
          COALESCE(up.username, u.email) as username,
          up.avatar_url,
          ct.depth + 1,
          ct.path || ARRAY[c.created_at::text, c.id::text]
        FROM review_comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        JOIN comment_tree ct ON c.parent_comment_id = ct.id
        WHERE ct.depth < 10
      )
      SELECT * FROM comment_tree
      ORDER BY path
      LIMIT $2 OFFSET $3
    `;

    const result = await global.pgPool.query(query, [reviewId, limit, offset]);

    // Get total count
    const countResult = await global.pgPool.query(
      'SELECT COUNT(*) FROM review_comments WHERE review_id = $1',
      [reviewId]
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit),
      comments: result.rows
    });
  } catch (error) {
    console.error('Get review comments error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Create comment on review
// @route   POST /api/reviews/:reviewId/comments
// @access  Private
const createReviewComment = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content, parent_comment_id = null } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Comment content is required'
      });
    }

    if (content.length > 1000) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Comment must be 1000 characters or less'
      });
    }

    // Check if review exists
    const reviewExists = await global.pgPool.query(
      'SELECT id FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (reviewExists.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Review not found'
      });
    }

    // If replying, verify parent exists
    if (parent_comment_id) {
      const parentExists = await global.pgPool.query(
        'SELECT review_id FROM review_comments WHERE id = $1',
        [parent_comment_id]
      );

      if (parentExists.rows.length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Parent comment not found'
        });
      }

      if (parentExists.rows[0].review_id !== reviewId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Parent comment does not belong to this review'
        });
      }
    }

    // Create comment
    const result = await global.pgPool.query(
      `INSERT INTO review_comments (review_id, user_id, parent_comment_id, content, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [reviewId, userId, parent_comment_id, content.trim()]
    );

    // Get comment with user info
    const commentWithUser = await global.pgPool.query(
      `SELECT 
        c.*,
        u.email,
        COALESCE(up.username, u.email) as username,
        up.avatar_url
      FROM review_comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE c.id = $1`,
      [result.rows[0].id]
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Comment created successfully',
      comment: commentWithUser.rows[0]
    });
  } catch (error) {
    console.error('Create review comment error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Update comment
// @route   PUT /api/reviews/comments/:commentId
// @access  Private
const updateReviewComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Comment content is required'
      });
    }

    // Check ownership
    const existing = await global.pgPool.query(
      'SELECT user_id FROM review_comments WHERE id = $1',
      [commentId]
    );

    if (existing.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Comment not found'
      });
    }

    if (existing.rows[0].user_id !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'You can only update your own comments'
      });
    }

    // Update comment
    const result = await global.pgPool.query(
      `UPDATE review_comments 
       SET content = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [content.trim(), commentId]
    );

    res.json({
      success: true,
      message: 'Comment updated successfully',
      comment: result.rows[0]
    });
  } catch (error) {
    console.error('Update review comment error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/reviews/comments/:commentId
// @access  Private
const deleteReviewComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Check ownership
    const existing = await global.pgPool.query(
      'SELECT user_id FROM review_comments WHERE id = $1',
      [commentId]
    );

    if (existing.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Comment not found'
      });
    }

    if (existing.rows[0].user_id !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: 'You can only delete your own comments'
      });
    }

    // Delete comment (cascade will delete replies)
    await global.pgPool.query('DELETE FROM review_comments WHERE id = $1', [commentId]);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete review comment error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
  createReview,
  getContentReviews,
  getUserReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  toggleReviewLike,
  getReviewComments,
  createReviewComment,
  updateReviewComment,
  deleteReviewComment
};
