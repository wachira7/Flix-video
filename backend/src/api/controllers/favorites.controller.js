// backend/src/api/controllers/favorites.controller.js
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../../utils/constants');
const { favoritesTotal } = require('../../config/metrics');

// Helper to convert 'tv' to 'tv_show' for database
const normalizeContentType = (type) => {
  return type === 'tv' ? 'tv_show' : type;
};

// @desc    Add to favorites
// @route   POST /api/favorites/:contentType/:contentId
// @access  Private
const addFavorite = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const userId = req.user.id;

    // Validate content type
    if (!['movie', 'tv'].includes(contentType)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Content type must be either "movie" or "tv"'
      });
    }

    const dbContentType = normalizeContentType(contentType);

    // Check if already in favorites
    const existing = await global.pgPool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
      [userId, dbContentType, contentId]
    );

    if (existing.rows.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Already in favorites'
      });
    }

    // Add to favorites
    const result = await global.pgPool.query(
      `INSERT INTO favorites (user_id, content_type, content_id, added_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING *`,
      [userId, dbContentType, contentId]
    );

    favoritesTotal.inc({ content_type: contentType }); 
    
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Added to favorites',
      favorite: result.rows[0]
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Remove from favorites
// @route   DELETE /api/favorites/:contentType/:contentId
// @access  Private
const removeFavorite = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const userId = req.user.id;
    const dbContentType = normalizeContentType(contentType);

    const result = await global.pgPool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND content_type = $2 AND content_id = $3 RETURNING *',
      [userId, dbContentType, contentId]
    );

    if (result.rows.length === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Favorite not found'
      });
    }

    res.json({
      success: true,
      message: 'Removed from favorites'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get all favorites
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contentType, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM favorites WHERE user_id = $1';
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
    let countQuery = 'SELECT COUNT(*) FROM favorites WHERE user_id = $1';
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
      favorites: result.rows
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Check if content is favorited
// @route   GET /api/favorites/check/:contentType/:contentId
// @access  Private
const checkFavorite = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const userId = req.user.id;
    const dbContentType = normalizeContentType(contentType);

    const result = await global.pgPool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
      [userId, dbContentType, contentId]
    );

    res.json({
      success: true,
      is_favorited: result.rows.length > 0
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite
};