// src/api/routes/demo.routes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { startDemo } = require('../controllers/demo.controller');

// Each demo creates an account, so keep it to a handful per visitor
const demoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { success: false, error: "You've started a few demos already. Try again in an hour." }
});

/**
 * @swagger
 * /api/demo:
 *   post:
 *     tags: [Demo]
 *     summary: Start a one-click demo
 *     description: |
 *       Creates a private, pre-filled demo account (watchlist, favourites, ratings, lists,
 *       an AI chat and a watch party) and signs it in. Deleted after 24 hours. Demo accounts
 *       are on the Free plan and can't pay, change sign-in details or post public reviews.
 *     responses:
 *       201:
 *         description: Demo started; returns a token and user like login
 *       429:
 *         description: Too many demos from this visitor
 *       503:
 *         description: Too many demos running
 */
router.post('/', demoLimiter, startDemo);

module.exports = router;
