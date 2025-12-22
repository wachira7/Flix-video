const express = require('express');
const router = express.Router();
const {
  searchMulti,
  searchMovies,
  searchTV,
  searchPeople
} = require('../controllers/search.controller');

/**
 * @swagger
 * /api/search/multi:
 *   get:
 *     tags: [Search]
 *     summary: Multi-search (movies, TV shows, people)
 *     description: Search across all content types in one request
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *         example: avengers
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Mixed search results (movies, TV shows, people)
 */
router.get('/multi', searchMulti);

/**
 * @swagger
 * /api/search/movies:
 *   get:
 *     tags: [Search]
 *     summary: Search movies only
 *     description: Search for movies with optional filters
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         example: inception
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Release year filter
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Language code (e.g., en, es)
 *     responses:
 *       200:
 *         description: Movie search results
 */
router.get('/movies', searchMovies);

/**
 * @swagger
 * /api/search/tv:
 *   get:
 *     tags: [Search]
 *     summary: Search TV shows only
 *     description: Search for TV shows with optional filters
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         example: breaking bad
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: first_air_date_year
 *         schema:
 *           type: integer
 *         description: First air date year filter
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: TV show search results
 */
router.get('/tv', searchTV);

/**
 * @swagger
 * /api/search/people:
 *   get:
 *     tags: [Search]
 *     summary: Search people (actors, directors)
 *     description: Search for actors, directors, and other film industry people
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         example: tom hanks
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: People search results
 */
router.get('/people', searchPeople);

module.exports = router;
