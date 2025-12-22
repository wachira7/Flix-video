const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/admin.middleware');
const {
  getUserAnalytics,
  getContentAnalytics,
  getEngagementAnalytics
} = require('../controllers/analytics.controller');

// All analytics routes require admin privileges
router.use(protect, requireAdmin);

/**
 * @swagger
 * /api/admin/analytics/users:
 *   get:
 *     tags: [Admin - Analytics]
 *     summary: Get user growth analytics
 *     description: Get user registration and retention analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7days, 30days, 90days, 1year]
 *           default: 30days
 *     responses:
 *       200:
 *         description: User analytics data
 */
router.get('/users', getUserAnalytics);

/**
 * @swagger
 * /api/admin/analytics/content:
 *   get:
 *     tags: [Admin - Analytics]
 *     summary: Get content analytics
 *     description: Get most popular content, lists, and watch parties
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Content analytics data
 */
router.get('/content', getContentAnalytics);

/**
 * @swagger
 * /api/admin/analytics/engagement:
 *   get:
 *     tags: [Admin - Analytics]
 *     summary: Get engagement analytics
 *     description: Get daily active users and user activity metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Engagement analytics data
 */
router.get('/engagement', getEngagementAnalytics);

module.exports = router;
