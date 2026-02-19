const axios = require('axios');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');
const { getCache, setCache } = require('../../config/cache');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_API_BASE_URL || 'https://api.themoviedb.org/3';

// Cache expiry: 1 hour for search results
const CACHE_EXPIRY = 3600;

const tmdbRequest = async (endpoint, params = {}) => {
  const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
    params: { api_key: TMDB_API_KEY, ...params }
  });
  return response.data;
};

// @desc    Multi-search (movies + TV + people)
// @route   GET /api/search/multi
// @access  Public
const searchMulti = async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Create cache key
    const cacheKey = `search:multi:${query.toLowerCase()}:${page}`;
    
    // Try to get from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        cached: true,
        ...cachedData
      });
    }

    // Fetch from TMDB
    const data = await tmdbRequest('/search/multi', { query, page });
    
    // Cache the result
    await setCache(cacheKey, data, CACHE_EXPIRY);

    res.json({
      success: true,
      cached: false,
      ...data
    });
  } catch (error) {
    console.error('Multi-search error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Search movies only
// @route   GET /api/search/movies
// @access  Public
const searchMovies = async (req, res) => {
  try {
    const { query, page = 1, year, language } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Create cache key with filters
    const cacheKey = `search:movies:${query.toLowerCase()}:${page}:${year || ''}:${language || ''}`;
    
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        cached: true,
        ...cachedData
      });
    }

    const params = { query, page };
    if (year) params.year = year;
    if (language) params.language = language;

    const data = await tmdbRequest('/search/movie', params);
    await setCache(cacheKey, data, CACHE_EXPIRY);

    res.json({
      success: true,
      cached: false,
      ...data
    });
  } catch (error) {
    console.error('Movie search error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Search TV shows only
// @route   GET /api/search/tv
// @access  Public
const searchTV = async (req, res) => {
  try {
    const { query, page = 1, first_air_date_year, language } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const cacheKey = `search:tv:${query.toLowerCase()}:${page}:${first_air_date_year || ''}:${language || ''}`;
    
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        cached: true,
        ...cachedData
      });
    }

    const params = { query, page };
    if (first_air_date_year) params.first_air_date_year = first_air_date_year;
    if (language) params.language = language;

    const data = await tmdbRequest('/search/tv', params);
    await setCache(cacheKey, data, CACHE_EXPIRY);

    res.json({
      success: true,
      cached: false,
      ...data
    });
  } catch (error) {
    console.error('TV search error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Search people (actors, directors, etc.)
// @route   GET /api/search/people
// @access  Public
const searchPeople = async (req, res) => {
  try {
    const { query, page = 1, language } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const cacheKey = `search:people:${query.toLowerCase()}:${page}:${language || ''}`;
    
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        cached: true,
        ...cachedData
      });
    }

    const params = { query, page };
    if (language) params.language = language;

    const data = await tmdbRequest('/search/person', params);
    await setCache(cacheKey, data, CACHE_EXPIRY);

    res.json({
      success: true,
      cached: false,
      ...data
    });
  } catch (error) {
    console.error('People search error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
  searchMulti,
  searchMovies,
  searchTV,
  searchPeople
};
