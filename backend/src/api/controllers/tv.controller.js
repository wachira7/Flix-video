const axios = require('axios');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_API_BASE_URL || 'https://api.themoviedb.org/3';

// Helper function to make TMDB API requests
const tmdbRequest = async (endpoint, params = {}) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
      params: {
        api_key: TMDB_API_KEY,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('TMDB API Error:', error.response?.data || error.message);
    throw error;
  }
};

// @desc    Get popular TV shows
// @route   GET /api/tv/popular
// @access  Public
const getPopularTVShows = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    
    const data = await tmdbRequest('/tv/popular', { page });
    
    res.json({
      success: true,
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results: data.results
    });
  } catch (error) {
    console.error('Get popular TV shows error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get trending TV shows
// @route   GET /api/tv/trending
// @access  Public
const getTrendingTVShows = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    
    const data = await tmdbRequest('/trending/tv/week', { page });
    
    res.json({
      success: true,
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results: data.results
    });
  } catch (error) {
    console.error('Get trending TV shows error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get TV show details
// @route   GET /api/tv/:id
// @access  Public
const getTVShowDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = await tmdbRequest(`/tv/${id}`, {
      append_to_response: 'videos,credits,similar,recommendations'
    });
    
    res.json({
      success: true,
      tv_show: data
    });
  } catch (error) {
    console.error('Get TV show details error:', error);
    
    if (error.response?.status === 404) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'TV show not found'
      });
    }
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Search TV shows
// @route   GET /api/tv/search
// @access  Public
const searchTVShows = async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    
    if (!query) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const data = await tmdbRequest('/search/tv', { query, page });
    
    res.json({
      success: true,
      query,
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results: data.results
    });
  } catch (error) {
    console.error('Search TV shows error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get TV show credits (cast & crew)
// @route   GET /api/tv/:id/credits
// @access  Public
const getTVShowCredits = async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = await tmdbRequest(`/tv/${id}/credits`);
    
    res.json({
      success: true,
      cast: data.cast,
      crew: data.crew
    });
  } catch (error) {
    console.error('Get TV show credits error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get similar TV shows
// @route   GET /api/tv/:id/similar
// @access  Public
const getSimilarTVShows = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1 } = req.query;
    
    const data = await tmdbRequest(`/tv/${id}/similar`, { page });
    
    res.json({
      success: true,
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results: data.results
    });
  } catch (error) {
    console.error('Get similar TV shows error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get TV show videos (trailers, teasers)
// @route   GET /api/tv/:id/videos
// @access  Public
const getTVShowVideos = async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = await tmdbRequest(`/tv/${id}/videos`);
    
    res.json({
      success: true,
      videos: data.results
    });
  } catch (error) {
    console.error('Get TV show videos error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get season details
// @route   GET /api/tv/:id/season/:season_number
// @access  Public
const getSeasonDetails = async (req, res) => {
  try {
    const { id, season_number } = req.params;
    
    const data = await tmdbRequest(`/tv/${id}/season/${season_number}`);
    
    res.json({
      success: true,
      season: data
    });
  } catch (error) {
    console.error('Get season details error:', error);
    
    if (error.response?.status === 404) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Season not found'
      });
    }
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
  getPopularTVShows,
  getTrendingTVShows,
  getTVShowDetails,
  searchTVShows,
  getTVShowCredits,
  getSimilarTVShows,
  getTVShowVideos,
  getSeasonDetails
};
