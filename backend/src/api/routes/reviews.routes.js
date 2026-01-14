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
  toggleReviewLike,
  getReviewComments,
  createReviewComment,
  updateReviewComment,
  deleteReviewComment
} = require('../controllers/reviews.controller');

// ========================================
// IMPORTANT: Specific routes FIRST!
// ========================================

// myreviews (must be before /:reviewId routes)
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

// User reviews (must be before /:reviewId routes)
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

// Comment routes (must be before /:reviewId routes)
/**
 * @swagger
 * /api/reviews/{reviewId}/comments:
 *   get:
 *     tags: [Review Comments]
 *     summary: Get comments for a review
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get('/:reviewId/comments', getReviewComments);

/**
 * @swagger
 * /api/reviews/{reviewId}/comments:
 *   post:
 *     tags: [Review Comments]
 *     summary: Create comment on review
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *               parent_comment_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Comment created
 */
router.post('/:reviewId/comments', protect, createReviewComment);

/**
 * @swagger
 * /api/reviews/comments/{commentId}:
 *   put:
 *     tags: [Review Comments]
 *     summary: Update comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comment updated
 */
router.put('/comments/:commentId', protect, updateReviewComment);

/**
 * @swagger
 * /api/reviews/comments/{commentId}:
 *   delete:
 *     tags: [Review Comments]
 *     summary: Delete comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comment deleted
 */
router.delete('/comments/:commentId', protect, deleteReviewComment);

// Review actions (specific routes before dynamic)
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

// ========================================
// Dynamic routes LAST!
// ========================================

// Content reviews (must be LAST - catches everything else)
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