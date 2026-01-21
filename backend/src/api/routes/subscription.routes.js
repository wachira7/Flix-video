// backend/src/api/routes/subscription.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getPlans,
  getMySubscription,
  upgradeSubscription,
  cancelSubscription,
  getUsageStats,
  activateSubscription,
  canPerformAction
} = require('../controllers/subscription.controller');

/**
 * @swagger
 * /api/subscriptions/plans:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get all subscription plans
 *     description: Get list of available subscription plans
 *     responses:
 *       200:
 *         description: List of plans
 */
router.get('/plans', getPlans);

/**
 * @swagger
 * /api/subscriptions/my-subscription:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get current subscription
 *     description: Get user's current subscription details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription details
 */
router.get('/my-subscription', protect, getMySubscription);

/**
 * @swagger
 * /api/subscriptions/upgrade:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Upgrade subscription
 *     description: Upgrade to a higher plan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan_type
 *               - payment_method
 *             properties:
 *               plan_type:
 *                 type: string
 *                 enum: [basic, premium]
 *                 example: premium
 *               payment_method:
 *                 type: string
 *                 enum: [stripe, mpesa, crypto]
 *                 example: mpesa
 *     responses:
 *       201:
 *         description: Upgrade initiated
 */
router.post('/upgrade', protect, upgradeSubscription);

/**
 * @swagger
 * /api/subscriptions/cancel:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Cancel subscription
 *     description: Cancel current subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Too expensive
 *     responses:
 *       200:
 *         description: Subscription cancelled
 */
router.post('/cancel', protect, cancelSubscription);

/**
 * @swagger
 * /api/subscriptions/usage:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get usage statistics
 *     description: Get current usage against plan limits
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics
 */
router.get('/usage', protect, getUsageStats);

/**
 * @swagger
 * /api/subscriptions/activate:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Activate subscription
 *     description: Activate subscription after successful payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscription_id
 *               - payment_id
 *             properties:
 *               subscription_id:
 *                 type: string
 *                 format: uuid
 *               payment_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Subscription activated
 */
router.post('/activate', protect, activateSubscription);

/**
 * @swagger
 * /api/subscriptions/can/{action}:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Check if action is allowed
 *     description: Check if user's plan allows specific action
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *         example: ai_chat
 *     responses:
 *       200:
 *         description: Action permission check
 */
router.get('/can/:action', protect, canPerformAction);

module.exports = router;
