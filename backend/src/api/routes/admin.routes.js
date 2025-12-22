const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/admin.middleware');
const {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  banUser,
  unbanUser,
  deleteUser,
  getActivityLogs,
  getAllPayments,
  getPaymentStats,
  getFailedPayments,
  deleteReview,
  deleteList,
  getContentReports,
  updateContentReport 
} = require('../controllers/admin.controller');

// All admin routes require authentication + admin privileges
router.use(protect, requireAdmin);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard overview
 *     description: Get statistics and overview for admin dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       403:
 *         description: Admin privileges required
 */
router.get('/dashboard', getDashboardStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users
 *     description: Get paginated list of all users with search and filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email, username, or name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, banned, admin]
 *           default: all
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get user details
 *     description: Get detailed information about a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User details with activity
 *       404:
 *         description: User not found
 */
router.get('/users/:userId', getUserDetails);

/**
 * @swagger
 * /api/admin/users/{userId}/ban:
 *   put:
 *     tags: [Admin]
 *     summary: Ban a user
 *     description: Ban a user from the platform
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Violation of terms of service"
 *     responses:
 *       200:
 *         description: User banned successfully
 *       400:
 *         description: Cannot ban yourself or other admins
 */
router.put('/users/:userId/ban', banUser);

/**
 * @swagger
 * /api/admin/users/{userId}/unban:
 *   put:
 *     tags: [Admin]
 *     summary: Unban a user
 *     description: Remove ban from a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User unbanned successfully
 */
router.put('/users/:userId/unban', unbanUser);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user permanently
 *     description: Permanently delete a user and all their data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete yourself or other admins
 */
router.delete('/users/:userId', deleteUser);

/**
 * @swagger
 * /api/admin/activity-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin activity logs
 *     description: View all admin actions for audit trail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           default: all
 *     responses:
 *       200:
 *         description: Activity logs
 */
router.get('/activity-logs', getActivityLogs);

/**
 * @swagger
 * /api/admin/payments:
 *   get:
 *     tags: [Admin - Payments]
 *     summary: Get all payments
 *     description: Get paginated list of all payments with filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, completed, pending, failed]
 *           default: all
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [all, stripe, mpesa, crypto]
 *           default: all
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get('/payments', getAllPayments);

/**
 * @swagger
 * /api/admin/payments/stats:
 *   get:
 *     tags: [Admin - Payments]
 *     summary: Get payment statistics
 *     description: Get revenue and payment method statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment statistics
 */
router.get('/payments/stats', getPaymentStats);

/**
 * @swagger
 * /api/admin/payments/failed:
 *   get:
 *     tags: [Admin - Payments]
 *     summary: Get failed payments
 *     description: Get list of all failed payment transactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: List of failed payments
 */
router.get('/payments/failed', getFailedPayments);

/**
 * @swagger
 * /api/admin/reviews/{reviewId}:
 *   delete:
 *     tags: [Admin - Moderation]
 *     summary: Delete a review
 *     description: Remove a review for moderation purposes
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
 *                 example: "Inappropriate content"
 *     responses:
 *       200:
 *         description: Review deleted successfully
 */
router.delete('/reviews/:reviewId', deleteReview);

/**
 * @swagger
 * /api/admin/lists/{listId}:
 *   delete:
 *     tags: [Admin - Moderation]
 *     summary: Delete a list
 *     description: Remove a list for moderation purposes
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
 *                 example: "Spam"
 *     responses:
 *       200:
 *         description: List deleted successfully
 */
router.delete('/lists/:listId', deleteList);

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     tags: [Admin - Moderation]
 *     summary: Get content reports
 *     description: Get user-submitted content reports for moderation
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
 *         description: List of content reports
 */
router.get('/reports', getContentReports);

/**
 * @swagger
 * /api/admin/reports/{reportId}:
 *   put:
 *     tags: [Admin - Moderation]
 *     summary: Update content report status
 *     description: Mark a content report as reviewed, actioned, or dismissed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reviewed, actioned, dismissed]
 *               action_taken:
 *                 type: string
 *                 example: "Deleted review and warned user"
 *     responses:
 *       200:
 *         description: Report updated successfully
 */
router.put('/reports/:reportId', updateContentReport);

module.exports = router;
