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

// @desc    Get popular movies
// @route   GET /api/movies/popular
// @access  Public
const getPopularMovies = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    
    const data = await tmdbRequest('/movie/popular', { page });
    
    res.json({
      success: true,
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results: data.results
    });
  } catch (error) {
    console.error('Get popular movies error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get trending movies
// @route   GET /api/movies/trending
// @access  Public
const getTrendingMovies = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    
    const data = await tmdbRequest('/trending/movie/week', { page });
    
    res.json({
      success: true,
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results: data.results
    });
  } catch (error) {
    console.error('Get trending movies error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get movie details
// @route   GET /api/movies/:id
// @access  Public
const getMovieDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = await tmdbRequest(`/movie/${id}`, {
      append_to_response: 'videos,credits,similar,recommendations'
    });
    
    res.json({
      success: true,
      movie: data
    });
  } catch (error) {
    console.error('Get movie details error:', error);
    
    if (error.response?.status === 404) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Movie not found'
      });
    }
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Search movies
// @route   GET /api/movies/search
// @access  Public
const searchMovies = async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    
    if (!query) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const data = await tmdbRequest('/search/movie', { query, page });
    
    res.json({
      success: true,
      query,
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results: data.results
    });
  } catch (error) {
    console.error('Search movies error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get movie credits (cast & crew)
// @route   GET /api/movies/:id/credits
// @access  Public
const getMovieCredits = async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = await tmdbRequest(`/movie/${id}/credits`);
    
    res.json({
      success: true,
      cast: data.cast,
      crew: data.crew
    });
  } catch (error) {
    console.error('Get movie credits error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get similar movies
// @route   GET /api/movies/:id/similar
// @access  Public
const getSimilarMovies = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1 } = req.query;
    
    const data = await tmdbRequest(`/movie/${id}/similar`, { page });
    
    res.json({
      success: true,
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results: data.results
    });
  } catch (error) {
    console.error('Get similar movies error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get movie videos (trailers, teasers)
// @route   GET /api/movies/:id/videos
// @access  Public
const getMovieVideos = async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = await tmdbRequest(`/movie/${id}/videos`);
    
    res.json({
      success: true,
      videos: data.results
    });
  } catch (error) {
    console.error('Get movie videos error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
  getPopularMovies,
  getTrendingMovies,
  getMovieDetails,
  searchMovies,
  getMovieCredits,
  getSimilarMovies,
  getMovieVideos
};
