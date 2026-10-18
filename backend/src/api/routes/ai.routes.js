// src/api/routes/ai.routes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middlewares/auth.middleware');
const AIConversation = require('../../models/aiConversation.model');
const { getUsage } = require('../../services/ai-usage.service');
const { sendMessage, getConversations, getConversation, deleteConversation, deleteAllConversations, getAIStatus, getAIUsage } = require('../controllers/ai.controller');

// ─── Burst guard ──────────────────────────────────────────────────
// Per user, so people sharing one network (offices, campuses, mobile
// carriers) don't use up each other's limit. The daily allowance below
// is the real cap; this only stops rapid-fire abuse.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  keyGenerator: (req) => `user:${req.user.id}`,
  message: {
    success: false,
    error: 'You are sending messages very quickly. Try again in a little while.'
  }
});

// ─── Daily allowance ──────────────────────────────────────────────
// Every plan gets FlixVideo AI, with a daily message allowance
// (config/plans.js: ai_messages_daily). The count only goes up once the
// AI has replied (see sendMessage).
const dailyAllowance = async (req, res, next) => {
  try {
    const sessionId = req.body?.session_id;
    if (sessionId) {
      const conversation = await AIConversation.getBySession(sessionId);
      if (conversation && String(conversation.userId) !== String(req.user.id)) {
        return res.status(404).json({ success: false, error: 'Conversation not found' });
      }
    }

    const usage = await getUsage(req.user.id);
    if (usage.used >= usage.limit) {
      return res.status(429).json({
        success: false,
        error: "You've used today's FlixVideo AI messages",
        limit_info: {
          limit: usage.limit,
          used: usage.used,
          period: 'daily',
          plan: usage.plan,
          resets_at: usage.resets_at,
          upgrade_required: usage.plan !== 'premium'
        }
      });
    }
    req.aiUsage = usage;
    next();
  } catch (error) {
    next(error);
  }
};

// ─── Routes ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/ai/status:
 *   get:
 *     tags: [AI]
 *     summary: Get AI provider status
 *     description: Returns the status of configured AI providers (Claude, OpenAI). Used by the frontend to show whether AI features are available.
 *     responses:
 *       200:
 *         description: AI provider status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 ai_providers:
 *                   type: object
 *                   properties:
 *                     openai:
 *                       type: object
 *                       properties:
 *                         configured:
 *                           type: boolean
 *                         name:
 *                           type: string
 *                     claude:
 *                       type: object
 *                       properties:
 *                         configured:
 *                           type: boolean
 *                         name:
 *                           type: string
 *                     available_count:
 *                       type: integer
 *                     primary_provider:
 *                       type: string
 */
router.get('/status', getAIStatus);

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     tags: [AI]
 *     summary: Send a message to the AI assistant
 *     description: |
 *       Sends a user message to the configured AI provider (Claude or OpenAI) and returns a response.
 *       Conversation history is persisted in MongoDB for context continuity.
 *       Every plan has a daily message allowance (Free 3, Basic 15, Premium 40),
 *       resetting at midnight Nairobi time. Also limited to 30 messages per hour.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's message to the AI (max 500 characters)
 *                 example: "Recommend me a thriller movie similar to Inception"
 *                 maxLength: 500
 *               session_id:
 *                 type: string
 *                 format: uuid
 *                 description: Existing session ID to continue a conversation. If omitted, a new session is created.
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               context:
 *                 type: object
 *                 description: Optional context metadata (e.g. current page, content being viewed)
 *                 example: { "page": "movie-detail", "contentId": 550 }
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 session_id:
 *                   type: string
 *                   description: Session ID for continuing this conversation
 *                 response:
 *                   type: string
 *                   description: AI assistant's response
 *                 provider:
 *                   type: string
 *                   description: Which AI provider was used
 *                   example: claude
 *                 tokens_used:
 *                   type: integer
 *       400:
 *         description: Message is empty or too long
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: session_id belongs to another user
 *       429:
 *         description: Daily allowance used up (limit_info has resets_at and upgrade_required), or the hourly burst limit
 *       503:
 *         description: AI service unavailable
 */
router.post('/chat', protect, aiLimiter, dailyAllowance, sendMessage);

/**
 * @swagger
 * /api/ai/usage:
 *   get:
 *     tags: [AI]
 *     summary: Today's FlixVideo AI message allowance
 *     description: How many AI messages the user's plan allows today, how many are used, and when the count resets (midnight, Nairobi time).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage for today
 */
router.get('/usage', protect, getAIUsage);

/**
 * @swagger
 * /api/ai/conversations:
 *   get:
 *     tags: [AI]
 *     summary: Get all conversations for the current user
 *     description: Returns a list of the user's AI chat conversations from MongoDB, sorted by most recent. Only returns the last message of each conversation for the list view.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of conversations to return
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 conversations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sessionId:
 *                         type: string
 *                       provider:
 *                         type: string
 *                       tokensUsed:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/conversations', protect, getConversations);

/**
 * @swagger
 * /api/ai/conversations/{sessionId}:
 *   get:
 *     tags: [AI]
 *     summary: Get a specific conversation with full message history
 *     description: Returns the complete conversation including all messages. Used when a user clicks on a conversation in the sidebar to resume it.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation session ID
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 conversation:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                             enum: [user, assistant]
 *                           content:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           tokensUsed:
 *                             type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
router.get('/conversations/:sessionId', protect, getConversation);

/**
 * @swagger
 * /api/ai/conversations/{sessionId}:
 *   delete:
 *     tags: [AI]
 *     summary: Delete a specific conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
router.delete('/conversations/:sessionId', protect, deleteConversation);

/**
 * @swagger
 * /api/ai/conversations:
 *   delete:
 *     tags: [AI]
 *     summary: Delete all conversations for the current user
 *     description: Permanently deletes all AI chat history for the user from MongoDB.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All conversations deleted successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/conversations', protect, deleteAllConversations);

module.exports = router;