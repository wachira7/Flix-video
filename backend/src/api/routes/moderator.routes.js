const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { requireModerator } = require('../middlewares/admin.middleware');
const {
  deleteReview,
  deleteList,
  getContentReports,
  updateContentReport,
  banUser,
  unbanUser,
  getModeratorDashboard
} = require('../controllers/admin.controller');

// All moderator routes require authentication + moderator privileges
router.use(protect, requireModerator);

/**
 * @swagger
 * /api/moderator/dashboard:
 *   get:
 *     tags: [Moderator]
 *     summary: Get moderator dashboard
 *     description: Get moderation statistics and pending reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Moderator dashboard statistics
 */
router.get('/dashboard', getModeratorDashboard);

/**
 * @swagger
 * /api/moderator/reviews/{reviewId}:
 *   delete:
 *     tags: [Moderator]
 *     summary: Delete a review (Moderator)
 *     description: Remove inappropriate review
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review deleted
 */
router.delete('/reviews/:reviewId', deleteReview);

/**
 * @swagger
 * /api/moderator/lists/{listId}:
 *   delete:
 *     tags: [Moderator]
 *     summary: Delete a list (Moderator)
 *     description: Remove inappropriate list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: List deleted
 */
router.delete('/lists/:listId', deleteList);

/**
 * @swagger
 * /api/moderator/reports:
 *   get:
 *     tags: [Moderator]
 *     summary: Get content reports
 *     description: View user-submitted content reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, reviewed, actioned, dismissed]
 *           default: pending
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
 *         description: List of reports
 */
router.get('/reports', getContentReports);

/**
 * @swagger
 * /api/moderator/reports/{reportId}:
 *   put:
 *     tags: [Moderator]
 *     summary: Update report status
 *     description: Mark report as reviewed/actioned/dismissed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reviewed, actioned, dismissed]
 *               action_taken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report updated
 */
router.put('/reports/:reportId', updateContentReport);

/**
 * @swagger
 * /api/moderator/users/{userId}/ban:
 *   put:
 *     tags: [Moderator]
 *     summary: Ban a user
 *     description: Ban user for violations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User banned
 */
router.put('/users/:userId/ban', banUser);

/**
 * @swagger
 * /api/moderator/users/{userId}/unban:
 *   put:
 *     tags: [Moderator]
 *     summary: Unban a user
 *     description: Remove ban from user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User unbanned
 */
router.put('/users/:userId/unban', unbanUser);

module.exports = router;
