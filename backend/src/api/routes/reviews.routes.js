const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  createReview,
  getContentReviews,
  getUserReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  toggleReviewLike
} = require('../controllers/reviews.controller');

/**
 * @swagger
 * /api/reviews/me:
 *   get:
 *     tags: [Reviews]
 *     summary: Get my reviews (current user)
 *     description: Get all reviews written by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *           enum: [movie, tv]
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
 *         description: User's reviews
 */
router.get('/me', protect, getMyReviews);

/**
 * @swagger
 * /api/reviews/user/{userId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get user's reviews
 *     description: Get all public reviews by a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *           enum: [movie, tv]
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
 *         description: User's reviews
 */
router.get('/user/:userId', getUserReviews);

/**
 * @swagger
 * /api/reviews/{reviewId}/like:
 *   post:
 *     tags: [Reviews]
 *     summary: Like/Unlike a review
 *     description: Toggle like on a review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Like toggled
 */
router.post('/:reviewId/like', protect, toggleReviewLike);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   put:
 *     tags: [Reviews]
 *     summary: Update a review
 *     description: Update your own review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               contains_spoilers:
 *                 type: boolean
 *               is_public:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Review updated
 */
router.put('/:reviewId', protect, updateReview);

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete a review
 *     description: Delete your own review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Review deleted
 */
router.delete('/:reviewId', protect, deleteReview);

/**
 * @swagger
 * /api/reviews/{contentType}/{contentId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews for content
 *     description: Get all public reviews for a specific movie or TV show
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
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, likes, oldest]
 *           default: recent
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get('/:contentType/:contentId', getContentReviews);

/**
 * @swagger
 * /api/reviews/{contentType}/{contentId}:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a review
 *     description: Write a review for a movie or TV show
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
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: "A Masterpiece!"
 *               content:
 *                 type: string
 *                 example: "This movie exceeded all expectations. The cinematography was stunning..."
 *               contains_spoilers:
 *                 type: boolean
 *                 default: false
 *               is_public:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Review created
 */
router.post('/:contentType/:contentId', protect, createReview);

module.exports = router;