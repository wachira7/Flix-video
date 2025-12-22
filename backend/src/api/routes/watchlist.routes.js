const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  checkWatchlist
} = require('../controllers/watchlist.controller');

/**
 * @swagger
 * /api/watchlist:
 *   get:
 *     tags: [Watchlist]
 *     summary: Get user's watchlist
 *     description: Retrieve all content in user's watchlist
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
 *         description: Watchlist retrieved
 */
router.get('/', protect, getWatchlist);

/**
 * @swagger
 * /api/watchlist/{contentType}/{contentId}:
 *   post:
 *     tags: [Watchlist]
 *     summary: Add to watchlist
 *     description: Add a movie or TV show to user's watchlist
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
 *       201:
 *         description: Added to watchlist
 */
router.post('/:contentType/:contentId', protect, addToWatchlist);

/**
 * @swagger
 * /api/watchlist/{contentType}/{contentId}:
 *   delete:
 *     tags: [Watchlist]
 *     summary: Remove from watchlist
 *     description: Remove content from user's watchlist
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
 *         description: Removed from watchlist
 */
router.delete('/:contentType/:contentId', protect, removeFromWatchlist);

/**
 * @swagger
 * /api/watchlist/check/{contentType}/{contentId}:
 *   get:
 *     tags: [Watchlist]
 *     summary: Check if in watchlist
 *     description: Check if content is in user's watchlist
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
router.get('/check/:contentType/:contentId', protect, checkWatchlist);

module.exports = router;
