const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  generateUserRecommendations,
  getMyRecommendations,
  clearMyRecommendations,
  getAIStatus
} = require('../controllers/recommendations.controller');


/**
 * @swagger
 * /api/recommendations/status:
 *   get:
 *     tags: [Recommendations]
 *     summary: Get AI provider status
 *     description: Check which AI providers are configured and available
 *     responses:
 *       200:
 *         description: AI provider status
 */

router.get('/status', getAIStatus);

/**
 * @swagger
 * /api/recommendations/generate:
 *   post:
 *     tags: [Recommendations]
 *     summary: Generate AI-powered recommendations
 *     description: Analyzes your viewing history and generates personalized movie/TV recommendations using AI
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI recommendations generated successfully
 *       400:
 *         description: Not enough viewing data
 *       503:
 *         description: AI service not configured
 */
router.post('/generate', protect, generateUserRecommendations);

/**
 * @swagger
 * /api/recommendations/me:
 *   get:
 *     tags: [Recommendations]
 *     summary: Get my cached recommendations
 *     description: Retrieve previously generated AI recommendations (cached for 24 hours)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cached recommendations retrieved
 *       404:
 *         description: No recommendations found
 */
router.get('/me', protect, getMyRecommendations);

/**
 * @swagger
 * /api/recommendations/me:
 *   delete:
 *     tags: [Recommendations]
 *     summary: Clear recommendations cache
 *     description: Delete cached recommendations to generate fresh suggestions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.delete('/me', protect, clearMyRecommendations);

module.exports = router;