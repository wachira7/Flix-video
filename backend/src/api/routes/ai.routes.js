// src/api/routes/ai.routes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middlewares/auth.middleware');
const { sendMessage, getConversations, getConversation, deleteConversation, deleteAllConversations, getAIStatus } = require('../controllers/ai.controller');

// ─── Rate Limiter ─────────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                   // 10 messages per hour per IP
  message: {
    success: false,
    error: 'AI chat limit reached. Try again in an hour.'
  }
});

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
 *       Free plan users are limited to 5 messages per day.
 *       Rate limited to 20 messages per hour.
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
 *       403:
 *         description: Daily limit reached (free plan)
 *       429:
 *         description: Rate limit exceeded (20 messages per hour)
 *       503:
 *         description: AI service unavailable
 */
router.post('/chat', protect, aiLimiter, sendMessage);

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