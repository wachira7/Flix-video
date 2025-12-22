// backend/src/api/controllers/ratings.controller.js
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');

// Helper to convert 'tv' to 'tv_show' for database
const normalizeContentType = (type) => {
  return type === 'tv' ? 'tv_show' : type;
};

// @desc    Rate content
// @route   POST /api/ratings/:contentType/:contentId
// @access  Private
const rateContent = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;

    if (!['movie', 'tv'].includes(contentType)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Content type must be either "movie" or "tv"'
      });
    }

    if (!rating || rating < 1.0 || rating > 10.0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Rating must be between 1.0 and 10.0 (10-point system)'
      });
    }

    const dbContentType = normalizeContentType(contentType);

    // Check if already rated
    const existing = await global.pgPool.query(
      'SELECT id FROM ratings WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
      [userId, dbContentType, contentId]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing rating
      result = await global.pgPool.query(
        `UPDATE ratings 
         SET rating = $1, updated_at = NOW()
         WHERE user_id = $2 AND content_type = $3 AND content_id = $4
         RETURNING *`,
        [rating, userId, dbContentType, contentId]
      );
    } else {
      // Create new rating
      result = await global.pgPool.query(
        `INSERT INTO ratings (user_id, content_type, content_id, rating, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, NOW(), NOW()) 
         RETURNING *`,
        [userId, dbContentType, contentId, rating]
      );
    }

    res.status(existing.rows.length > 0 ? HTTP_STATUS.OK : HTTP_STATUS.CREATED).json({
      success: true,
      message: existing.rows.length > 0 ? 'Rating updated' : 'Content rated',
      rating: result.rows[0]
    });
  } catch (error) {
    console.error('Rate content error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Delete rating
// @route   DELETE /api/ratings/:contentType/:contentId
// @access  Private
const deleteRating = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const userId = req.user.id;
    const dbContentType = normalizeContentType(contentType);

    const result = await global.pgPool.query(
      'DELETE FROM ratings WHERE user_id = $1 AND content_type = $2 AND content_id = $3 RETURNING *',
      [userId, dbContentType, contentId]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Rating not found'
      });
    }

    res.json({
      success: true,
      message: 'Rating deleted'
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get user's ratings
// @route   GET /api/ratings
// @access  Private
const getRatings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentType, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM ratings WHERE user_id = $1';
    let params = [userId];

    if (contentType) {
      const dbContentType = normalizeContentType(contentType);
      query += ' AND content_type = $2';
      params.push(dbContentType);
    }

    query += ' ORDER BY updated_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await global.pgPool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM ratings WHERE user_id = $1';
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
      ratings: result.rows
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get specific rating
// @route   GET /api/ratings/:contentType/:contentId
// @access  Private
const getRating = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const userId = req.user.id;
    const dbContentType = normalizeContentType(contentType);

    const result = await global.pgPool.query(
      'SELECT * FROM ratings WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
      [userId, dbContentType, contentId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        rating: null
      });
    }

    res.json({
      success: true,
      rating: result.rows[0]
    });
  } catch (error) {
    console.error('Get rating error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
  rateContent,
  deleteRating,
  getRatings,
  getRating
};