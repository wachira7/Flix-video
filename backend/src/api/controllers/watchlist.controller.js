// backend/src/api/controllers/watchlist.controller.js
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');

// Helper to convert 'tv' to 'tv_show' for database
const normalizeContentType = (type) => {
  return type === 'tv' ? 'tv_show' : type;
};

// @desc    Add to watchlist
// @route   POST /api/watchlist/:contentType/:contentId
// @access  Private
const addToWatchlist = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const userId = req.user.id;

    if (!['movie', 'tv'].includes(contentType)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Content type must be either "movie" or "tv"'
      });
    }

    const dbContentType = normalizeContentType(contentType);

    // Check if already in watchlist
    const existing = await global.pgPool.query(
      'SELECT id FROM watchlist WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
      [userId, dbContentType, contentId]
    );

    if (existing.rows.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Already in watchlist'
      });
    }

    // Add to watchlist
    const result = await global.pgPool.query(
      `INSERT INTO watchlist (user_id, content_type, content_id, added_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING *`,
      [userId, dbContentType, contentId]
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Added to watchlist',
      watchlist_item: result.rows[0]
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Remove from watchlist
// @route   DELETE /api/watchlist/:contentType/:contentId
// @access  Private
const removeFromWatchlist = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const userId = req.user.id;
    const dbContentType = normalizeContentType(contentType);

    const result = await global.pgPool.query(
      'DELETE FROM watchlist WHERE user_id = $1 AND content_type = $2 AND content_id = $3 RETURNING *',
      [userId, dbContentType, contentId]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Item not found in watchlist'
      });
    }

    res.json({
      success: true,
      message: 'Removed from watchlist'
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get watchlist
// @route   GET /api/watchlist
// @access  Private
const getWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentType, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM watchlist WHERE user_id = $1';
    let params = [userId];

    if (contentType) {
      const dbContentType = normalizeContentType(contentType);
      query += ' AND content_type = $2';
      params.push(dbContentType);
    }

    query += ' ORDER BY added_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await global.pgPool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM watchlist WHERE user_id = $1';
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
      watchlist: result.rows
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Check if content is in watchlist
// @route   GET /api/watchlist/check/:contentType/:contentId
// @access  Private
const checkWatchlist = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const userId = req.user.id;
    const dbContentType = normalizeContentType(contentType);

    const result = await global.pgPool.query(
      'SELECT id FROM watchlist WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
      [userId, dbContentType, contentId]
    );

    res.json({
      success: true,
      in_watchlist: result.rows.length > 0
    });
  } catch (error) {
    console.error('Check watchlist error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  checkWatchlist
};