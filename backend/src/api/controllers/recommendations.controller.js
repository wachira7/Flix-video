//backend/src/api/controllers/recommendations.controller.js
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');
const { generateRecommendations, getProviderStatus } = require('../../services/ai.service');
const { getCache, setCache } = require('../../utils/cache-helper');

// Cache expiry: 24 hours (recommendations don't change often)
const CACHE_EXPIRY = 86400;

// @desc    Generate AI-powered recommendations for user
// @route   POST /api/recommendations/generate
// @access  Private
const generateUserRecommendations = async (req, res) => {
  try { 
    const userId = req.user.id;

    // Check cache first
    const cacheKey = `recommendations:${userId}`;
    const cachedRecommendations = await getCache(cacheKey);
    
    if (cachedRecommendations) {
      return res.json({
        success: true,
        cached: true,
        message: 'Recommendations retrieved from cache',
        ...cachedRecommendations
      });
    }

    // Fetch user's viewing data
    const userData = await fetchUserViewingData(userId);

    // Check if user has enough data
    if (!userData.favorites.length && !userData.ratings.length && !userData.reviews.length) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Not enough viewing data. Please add some favorites, ratings, or reviews first.'
      });
    }

    // Generate AI recommendations
    const aiResponse = await generateRecommendations(userData);

    // Cache the results
    await setCache(cacheKey, {
      recommendations: aiResponse.recommendations,
      summary: aiResponse.summary,
      generated_at: new Date().toISOString(),
      tokens_used: aiResponse.tokens_used,
      cost_estimate: aiResponse.cost_estimate
    }, CACHE_EXPIRY);

    res.json({
      success: true,
      cached: false,
      message: 'AI recommendations generated successfully',
      recommendations: aiResponse.recommendations,
      summary: aiResponse.summary,
      generated_at: new Date().toISOString(),
      stats: {
        tokens_used: aiResponse.tokens_used,
        cost_estimate: `$${aiResponse.cost_estimate}`,
        cache_duration: '24 hours'
      }
    });

  } catch (error) {
    console.error('Generate recommendations error:', error);
    
    if (error.message.includes('API key')) {
      return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        error: 'AI service not configured. Please add OpenAI API key.'
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get cached recommendations
// @route   GET /api/recommendations/me
// @access  Private
const getMyRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `recommendations:${userId}`;
    
    const cachedRecommendations = await getCache(cacheKey);
    
    if (!cachedRecommendations) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'No recommendations found. Generate new recommendations first.',
        action: 'POST /api/recommendations/generate'
      });
    }

    res.json({
      success: true,
      cached: true,
      ...cachedRecommendations
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Clear recommendations cache
// @route   DELETE /api/recommendations/me
// @access  Private
const clearMyRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `recommendations:${userId}`;
    
    const { deleteCache } = require('../../utils/cache-helper');
    await deleteCache(cacheKey);

    res.json({
      success: true,
      message: 'Recommendations cache cleared. Generate new recommendations to get fresh suggestions.'
    });

  } catch (error) {
    console.error('Clear recommendations error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get AI provider status
// @route   GET /api/recommendations/status
// @access  Public
const getAIStatus = async (req, res) => {
  try {
    const status = getProviderStatus();
    
    res.json({
      success: true,
      ai_providers: status,
      message: status.available_count > 0 
        ? `${status.available_count} AI provider(s) configured and ready` 
        : 'No AI providers configured'
    });

  } catch (error) {
    console.error('Get AI status error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

/**
 * Fetch user's viewing data from database
 */
const fetchUserViewingData = async (userId) => {
  // Fetch favorites
  const favoritesResult = await global.pgPool.query(
    'SELECT content_type, content_id, added_at FROM favorites WHERE user_id = $1 ORDER BY added_at DESC LIMIT 20',
    [userId]
  );

  // Fetch watchlist
  const watchlistResult = await global.pgPool.query(
    'SELECT content_type, content_id, added_at FROM watchlist WHERE user_id = $1 ORDER BY added_at DESC LIMIT 20',
    [userId]
  );

  // Fetch ratings
  const ratingsResult = await global.pgPool.query(
    'SELECT content_type, content_id, rating, created_at FROM ratings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
    [userId]
  );

  // Fetch reviews
  const reviewsResult = await global.pgPool.query(
    'SELECT content_type, content_id, title, content, created_at FROM reviews WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
    [userId]
  );

  return {
    favorites: favoritesResult.rows,
    watchlist: watchlistResult.rows,
    ratings: ratingsResult.rows,
    reviews: reviewsResult.rows
  };
};

module.exports = {
  generateUserRecommendations,
  getMyRecommendations,
  clearMyRecommendations,
  getAIStatus
};