const express = require('express');
const router = express.Router();
const {
  getPopularTVShows,
  getTrendingTVShows,
  getTVShowDetails,
  searchTVShows,
  getTVShowCredits,
  getSimilarTVShows,
  getTVShowVideos,
  getSeasonDetails
} = require('../controllers/tv.controller');

/**
 * @swagger
 * /api/tv/popular:
 *   get:
 *     tags: [TV Shows]
 *     summary: Get popular TV shows
 *     description: Retrieve a list of popular TV shows from TMDB
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of popular TV shows
 */
router.get('/popular', getPopularTVShows);

/**
 * @swagger
 * /api/tv/trending:
 *   get:
 *     tags: [TV Shows]
 *     summary: Get trending TV shows
 *     description: Retrieve trending TV shows for the week
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of trending TV shows
 */
router.get('/trending', getTrendingTVShows);

/**
 * @swagger
 * /api/tv/search:
 *   get:
 *     tags: [TV Shows]
 *     summary: Search TV shows
 *     description: Search for TV shows by title
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
router.get('/search', searchTVShows);

/**
 * @swagger
 * /api/tv/{id}:
 *   get:
 *     tags: [TV Shows]
 *     summary: Get TV show details
 *     description: Get detailed information about a specific TV show
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB TV show ID
 *     responses:
 *       200:
 *         description: TV show details
 */
router.get('/:id', getTVShowDetails);

/**
 * @swagger
 * /api/tv/{id}/credits:
 *   get:
 *     tags: [TV Shows]
 *     summary: Get TV show credits
 *     description: Get cast and crew for a TV show
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB TV show ID
 *     responses:
 *       200:
 *         description: Cast and crew information
 */
router.get('/:id/credits', getTVShowCredits);

/**
 * @swagger
 * /api/tv/{id}/similar:
 *   get:
 *     tags: [TV Shows]
 *     summary: Get similar TV shows
 *     description: Get TV shows similar to the specified show
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB TV show ID
 *     responses:
 *       200:
 *         description: Similar TV shows
 */
router.get('/:id/similar', getSimilarTVShows);

/**
 * @swagger
 * /api/tv/{id}/videos:
 *   get:
 *     tags: [TV Shows]
 *     summary: Get TV show videos
 *     description: Get trailers and videos for a TV show
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB TV show ID
 *     responses:
 *       200:
 *         description: TV show videos (trailers, teasers, etc.)
 */
router.get('/:id/videos', getTVShowVideos);

/**
 * @swagger
 * /api/tv/{id}/season/{season_number}:
 *   get:
 *     tags: [TV Shows]
 *     summary: Get season details
 *     description: Get detailed information about a specific season
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB TV show ID
 *       - in: path
 *         name: season_number
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season number
 *     responses:
 *       200:
 *         description: Season details including episodes
 */
router.get('/:id/season/:season_number', getSeasonDetails);

module.exports = router;
