const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getPopularMovies,
  getTrendingMovies,
  getMovieDetails,
  searchMovies,
  getMovieCredits,
  getSimilarMovies,
  getMovieVideos
} = require('../controllers/movie.controller');

/**
 * @swagger
 * /api/movies/popular:
 *   get:
 *     tags: [Movies]
 *     summary: Get popular movies
 *     description: Retrieve a list of popular movies from TMDB
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of popular movies
 */
router.get('/popular', getPopularMovies);

/**
 * @swagger
 * /api/movies/trending:
 *   get:
 *     tags: [Movies]
 *     summary: Get trending movies
 *     description: Retrieve trending movies for the week
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of trending movies
 */
router.get('/trending', getTrendingMovies);

/**
 * @swagger
 * /api/movies/search:
 *   get:
 *     tags: [Movies]
 *     summary: Search movies
 *     description: Search for movies by title
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', searchMovies);

/**
 * @swagger
 * /api/movies/{id}:
 *   get:
 *     tags: [Movies]
 *     summary: Get movie details
 *     description: Get detailed information about a specific movie
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB movie ID
 *     responses:
 *       200:
 *         description: Movie details
 */
router.get('/:id', getMovieDetails);

/**
 * @swagger
 * /api/movies/{id}/credits:
 *   get:
 *     tags: [Movies]
 *     summary: Get movie credits
 *     description: Get cast and crew for a movie
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB movie ID
 *     responses:
 *       200:
 *         description: Cast and crew information
 */
router.get('/:id/credits', getMovieCredits);

/**
 * @swagger
 * /api/movies/{id}/similar:
 *   get:
 *     tags: [Movies]
 *     summary: Get similar movies
 *     description: Get movies similar to the specified movie
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB movie ID
 *     responses:
 *       200:
 *         description: Similar movies
 */
router.get('/:id/similar', getSimilarMovies);

/**
 * @swagger
 * /api/movies/{id}/videos:
 *   get:
 *     tags: [Movies]
 *     summary: Get movie videos
 *     description: Get trailers and videos for a movie
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB movie ID
 *     responses:
 *       200:
 *         description: Movie videos (trailers, teasers, etc.)
 */
router.get('/:id/videos', getMovieVideos);

module.exports = router;
