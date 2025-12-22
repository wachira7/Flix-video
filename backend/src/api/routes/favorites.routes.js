const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite
} = require('../controllers/favorites.controller');

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     tags: [Favorites]
 *     summary: Get user's favorites
 *     description: Retrieve all favorited content for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *           enum: [movie, tv]
 *         description: Filter by content type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of favorites
 */
router.get('/', protect, getFavorites);

/**
 * @swagger
 * /api/favorites/{contentType}/{contentId}:
 *   post:
 *     tags: [Favorites]
 *     summary: Add to favorites
 *     description: Add a movie or TV show to user's favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [movie, tv]
 *         description: Type of content
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB content ID
 *     responses:
 *       201:
 *         description: Added to favorites
 *       400:
 *         description: Already in favorites
 */
router.post('/:contentType/:contentId', protect, addFavorite);

/**
 * @swagger
 * /api/favorites/{contentType}/{contentId}:
 *   delete:
 *     tags: [Favorites]
 *     summary: Remove from favorites
 *     description: Remove a movie or TV show from user's favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [movie, tv]
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Removed from favorites
 *       404:
 *         description: Not found in favorites
 */
router.delete('/:contentType/:contentId', protect, removeFavorite);

/**
 * @swagger
 * /api/favorites/check/{contentType}/{contentId}:
 *   get:
 *     tags: [Favorites]
 *     summary: Check if favorited
 *     description: Check if content is in user's favorites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [movie, tv]
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Check result
 */
router.get('/check/:contentType/:contentId', protect, checkFavorite);

module.exports = router;
