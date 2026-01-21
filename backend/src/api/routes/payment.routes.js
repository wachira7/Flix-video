// backend/src/api/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  // Stripe
  createStripeCheckout,
  stripeWebhook,
  getStripeStatus,
  
  // M-Pesa
  initiateMpesaPayment,
  mpesaCallback,
  getMpesaStatus,
  
  // Crypto
  createCryptoPayment,
  cryptoWebhook,
  getCryptoStatus,
  getCryptoCurrencies,
  
  // Payment Methods
  getPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,

  // Payment History
  getPaymentHistory

} = require('../controllers/payment.controller');

// =============================================================================
// STRIPE ROUTES
// =============================================================================

/**
 * @swagger
 * /api/payments/stripe/create-checkout:
 *   post:
 *     tags: [Payments - Stripe]
 *     summary: Create Stripe checkout session
 *     description: Create a Stripe checkout session for payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 499
 *               currency:
 *                 type: string
 *                 default: KES
 *                 example: KES
 *               plan_type:
 *                 type: string
 *                 example: premium
 *               description:
 *                 type: string
 *                 example: Premium Monthly Subscription
 *     responses:
 *       201:
 *         description: Checkout session created
 */
router.post('/stripe/create-checkout', protect, createStripeCheckout);

/**
 * @swagger
 * /api/payments/stripe/webhook:
 *   post:
 *     tags: [Payments - Stripe]
 *     summary: Stripe webhook handler
 *     description: Handle Stripe webhook events (called by Stripe)
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

/**
 * @swagger
 * /api/payments/stripe/status/{sessionId}:
 *   get:
 *     tags: [Payments - Stripe]
 *     summary: Get Stripe payment status
 *     description: Get status of a Stripe payment by session ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         example: cs_test_abc123
 *     responses:
 *       200:
 *         description: Payment status retrieved
 */
router.get('/stripe/status/:sessionId', protect, getStripeStatus);

// =============================================================================
// M-PESA ROUTES
// =============================================================================

/**
 * @swagger
 * /api/payments/mpesa/stk-push:
 *   post:
 *     tags: [Payments - M-Pesa]
 *     summary: Initiate M-Pesa STK Push
 *     description: Send payment prompt to customer's phone
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone_number
 *               - amount
 *             properties:
 *               phone_number:
 *                 type: string
 *                 example: "254708374149"
 *               amount:
 *                 type: number
 *                 example: 499
 *               plan_type:
 *                 type: string
 *                 example: premium
 *               description:
 *                 type: string
 *                 example: Premium Monthly Subscription
 *     responses:
 *       201:
 *         description: STK Push initiated
 */
router.post('/mpesa/stk-push', protect, initiateMpesaPayment);

/**
 * @swagger
 * /api/payments/mpesa/callback:
 *   post:
 *     tags: [Payments - M-Pesa]
 *     summary: M-Pesa callback handler
 *     description: Handle M-Pesa payment callbacks (called by Safaricom)
 *     responses:
 *       200:
 *         description: Callback processed
 */
router.post('/mpesa/callback', mpesaCallback);

/**
 * @swagger
 * /api/payments/mpesa/status/{checkoutId}:
 *   get:
 *     tags: [Payments - M-Pesa]
 *     summary: Get M-Pesa payment status
 *     description: Query M-Pesa payment status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: checkoutId
 *         required: true
 *         schema:
 *           type: string
 *         example: ws_CO_123456789
 *     responses:
 *       200:
 *         description: Payment status retrieved
 */
router.get('/mpesa/status/:checkoutId', protect, getMpesaStatus);

// =============================================================================
// CRYPTO ROUTES
// =============================================================================

/**
 * @swagger
 * /api/payments/crypto/currencies:
 *   get:
 *     tags: [Payments - Crypto]
 *     summary: Get available cryptocurrencies
 *     description: Get list of supported cryptocurrencies
 *     responses:
 *       200:
 *         description: List of currencies
 */
router.get('/crypto/currencies', getCryptoCurrencies);

/**
 * @swagger
 * /api/payments/crypto/create:
 *   post:
 *     tags: [Payments - Crypto]
 *     summary: Create crypto payment
 *     description: Create a cryptocurrency payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - crypto_currency
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 499
 *               currency:
 *                 type: string
 *                 default: KES
 *                 example: KES
 *               crypto_currency:
 *                 type: string
 *                 example: btc
 *               plan_type:
 *                 type: string
 *                 example: premium
 *               description:
 *                 type: string
 *                 example: Premium Monthly Subscription
 *     responses:
 *       201:
 *         description: Crypto payment created
 */
router.post('/crypto/create', protect, createCryptoPayment);

/**
 * @swagger
 * /api/payments/crypto/webhook:
 *   post:
 *     tags: [Payments - Crypto]
 *     summary: Crypto webhook handler
 *     description: Handle NOWPayments webhook events
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/crypto/webhook', cryptoWebhook);

/**
 * @swagger
 * /api/payments/crypto/status/{paymentId}:
 *   get:
 *     tags: [Payments - Crypto]
 *     summary: Get crypto payment status
 *     description: Get status of a crypto payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment status retrieved
 */
router.get('/crypto/status/:paymentId', protect, getCryptoStatus);

/**
 * @swagger
 * /api/payments/methods:
 *   get:
 *     tags: [Payments]
 *     summary: Get user's saved payment methods
 *     security:
 *       - bearerAuth: []
 */
router.get('/methods', protect, getPaymentMethods);

/**
 * @swagger
 * /api/payments/methods/{methodId}/default:
 *   put:
 *     tags: [Payments]
 *     summary: Set default payment method
 *     security:
 *       - bearerAuth: []
 */
router.put('/methods/:methodId/default', protect, setDefaultPaymentMethod);

/**
 * @swagger
 * /api/payments/methods/{methodId}:
 *   delete:
 *     tags: [Payments]
 *     summary: Delete payment method
 *     security:
 *       - bearerAuth: []
 */
router.delete('/methods/:methodId', protect, deletePaymentMethod);

// =============================================================================
// PAYMENT HISTORY ROUTE
// =============================================================================  

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     tags: [Payments]
 *     summary: Get user's payment history
 *     description: Get list of user's past payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Payment history retrieved
 */
router.get('/history', protect, getPaymentHistory);

module.exports = router;
