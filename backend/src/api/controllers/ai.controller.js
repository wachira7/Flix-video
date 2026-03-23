// src/api/controllers/ai.controller.js
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');
const logger = require('../../utils/logger');
const AIConversation = require('../../models/aiConversation.model');
const { redisClient } = require('../../config/cache')
const { v4: uuidv4 } = require('uuid');

// ─── AI Chat ──────────────────────────────────────────────────────

// @desc    Send a message and get AI response
// @route   POST /api/ai/chat
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, session_id, context = {} } = req.body;

    if (!message || !message.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Message is required'
      });
    }

    if (message.length > 500) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: 'Message too long. Maximum 500 characters allowed.'
        })
     }

     
    const plan = req.user.plan_type || 'free'

    if (plan === 'free') {
      const key = `ai_chat:${userId}:daily`
      const count = await redisClient.get(key)
        if (count && parseInt(count) >= 5) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            error: 'Free plan is limited to 5 AI messages per day. Upgrade to Premium for unlimited access.'
            })
        }
        await redisClient.incr(key)
        await redisClient.expire(key, 86400)
    }

    // Use existing session or create new one
    const sessionId = session_id || uuidv4();

    // Load or create conversation
    let conversation = await AIConversation.getBySession(sessionId);
    if (!conversation) {
      conversation = await AIConversation.create({
        userId,
        sessionId,
        provider: process.env.AI_PRIMARY_PROVIDER || 'claude',
        context
      });
    }

    // Get recent messages for context (last 10)
    const recentMessages = await AIConversation.getRecentMessages(sessionId, 10);

    // Save user message to MongoDB
    await AIConversation.addMessage(sessionId, {
      role: 'user',
      content: message.trim()
    });

    // Build messages for AI provider
    const messagesForAI = [
      ...recentMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() }
    ];

    // Call AI provider
    const ClaudeProvider = require('../../services/ai-providers/claude.provider');
    const OpenAIProvider = require('../../services/ai-providers/openai.provider');

    const primaryProvider = process.env.AI_PRIMARY_PROVIDER || 'claude';
    let aiResponse = null;
    let providerUsed = null;

    const providers = primaryProvider === 'claude'
      ? [
          new ClaudeProvider(process.env.ANTHROPIC_API_KEY),
          new OpenAIProvider(process.env.OPENAI_API_KEY)
        ]
      : [
          new OpenAIProvider(process.env.OPENAI_API_KEY),
          new ClaudeProvider(process.env.ANTHROPIC_API_KEY)
        ];

    for (const provider of providers) {
      if (!provider.isConfigured()) continue;
      try {
        aiResponse = await provider.chat(messagesForAI, context);
        providerUsed = provider.getName();
        break;
      } catch (err) {
        logger.warn(`AI provider ${provider.getName()} failed`, { error: err.message });
      }
    }

    if (!aiResponse) {
      return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        error: 'AI service unavailable. Please try again later.'
      });
    }

    // Save assistant response to MongoDB
    await AIConversation.addMessage(sessionId, {
      role: 'assistant',
      content: aiResponse.content,
      tokensUsed: aiResponse.tokens_used || 0
    });

    logger.info('AI chat message processed', { userId, sessionId, provider: providerUsed });

    res.json({
      success: true,
      session_id: sessionId,
      response: aiResponse.content,
      provider: providerUsed,
      tokens_used: aiResponse.tokens_used
    });

  } catch (error) {
    logger.error('AI chat error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// ─── Conversation Management ──────────────────────────────────────

// @desc    Get all conversations for a user
// @route   GET /api/ai/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const conversations = await AIConversation.getByUser(userId, parseInt(limit));

    res.json({ success: true, conversations });

  } catch (error) {
    logger.error('Get conversations error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get a specific conversation with full messages
// @route   GET /api/ai/conversations/:sessionId
// @access  Private
const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const conversation = await AIConversation.getBySession(sessionId);

    if (!conversation || conversation.userId !== userId) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({ success: true, conversation });

  } catch (error) {
    logger.error('Get conversation error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Delete a conversation
// @route   DELETE /api/ai/conversations/:sessionId
// @access  Private
const deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    await AIConversation.delete(sessionId, userId);

    res.json({ success: true, message: 'Conversation deleted' });

  } catch (error) {
    logger.error('Delete conversation error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Delete all conversations for a user
// @route   DELETE /api/ai/conversations
// @access  Private
const deleteAllConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    await AIConversation.deleteAllByUser(userId);
    res.json({ success: true, message: 'All conversations deleted' });

  } catch (error) {
    logger.error('Delete all conversations error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get AI provider status
// @route   GET /api/ai/status
// @access  Public
const getAIStatus = async (req, res) => {
  try {
    const status = getProviderStatus();
    res.json({ success: true, ai_providers: status });
  } catch (error) {
    logger.error('Get AI status error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation,
  deleteAllConversations,
  getAIStatus
};