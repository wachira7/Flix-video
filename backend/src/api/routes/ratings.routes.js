// backend/src/api/routes/ratings.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  rateContent,
  deleteRating,
  getRatings,
  getRating
} = require('../controllers/ratings.controller');

/**
 * @swagger
 * /api/ratings:
 *   get:
 *     tags: [Ratings]
 *     summary: Get user's ratings
 *     description: Retrieve all content rated by the user
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of ratings
 */
router.get('/', protect, getRatings);

/**
 * @swagger
 * /api/ratings/{contentType}/{contentId}:
 *   get:
 *     tags: [Ratings]
 *     summary: Get specific rating
 *     description: Get user's rating for specific content
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
 *         description: Rating retrieved
 */
router.get('/:contentType/:contentId', protect, getRating);

/**
 * @swagger
 * /api/ratings/{contentType}/{contentId}:
 *   post:
 *     tags: [Ratings]
 *     summary: Rate content
 *     description: Rate a movie or TV show (creates or updates rating)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1.0
 *                 maximum: 10.0
 *                 example: 8.5
 *               review:
 *                 type: string
 *                 example: "Amazing movie! Highly recommended."
 *     responses:
 *       201:
 *         description: Content rated
 */
router.post('/:contentType/:contentId', protect, rateContent);

/**
 * @swagger
 * /api/ratings/{contentType}/{contentId}:
 *   delete:
 *     tags: [Ratings]
 *     summary: Delete rating
 *     description: Delete user's rating for content
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
 *         description: Rating deleted
 */
router.delete('/:contentType/:contentId', protect, deleteRating);

module.exports = router;
