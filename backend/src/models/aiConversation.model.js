// src/models/aiConversation.model.js
const { getCollection } = require('../config/database');
const { ObjectId } = require('mongodb');

const COLLECTION = 'ai_conversations';

const AIConversation = {
  /**
   * Create a new conversation session
   */
  async create({ userId, sessionId, provider = 'claude', context = {} }) {
    const col = getCollection(COLLECTION);
    const doc = {
      userId,
      sessionId,
      provider,       // 'claude' | 'openai'
      messages: [],
      context,        // e.g. { page: 'ai-chat', contentId: null }
      tokensUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await col.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  },

  /**
   * Add a message to an existing conversation
   */
  async addMessage(sessionId, { role, content, tokensUsed = 0 }) {
    const col = getCollection(COLLECTION);
    const message = {
      role,       // 'user' | 'assistant'
      content,
      tokensUsed,
      timestamp: new Date()
    };

    return col.findOneAndUpdate(
      { sessionId },
      {
        $push: { messages: message },
        $inc: { tokensUsed },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );
  },

  /**
   * Get conversation by session ID
   */
  async getBySession(sessionId) {
    const col = getCollection(COLLECTION);
    return col.findOne({ sessionId });
  },

  /**
   * Get all conversations for a user
   */
  async getByUser(userId, limit = 20) {
    const col = getCollection(COLLECTION);
    return col
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .project({ messages: { $slice: -1 }, userId: 1, sessionId: 1, provider: 1, createdAt: 1, updatedAt: 1, tokensUsed: 1 }) // last message only for list view
      .toArray();
  },

  /**
   * Get recent conversation messages (for context window)
   */
  async getRecentMessages(sessionId, limit = 10) {
    const col = getCollection(COLLECTION);
    const conversation = await col.findOne(
      { sessionId },
      { projection: { messages: { $slice: -limit } } }
    );
    return conversation?.messages || [];
  },

  /**
   * Delete a conversation
   */
  async delete(sessionId, userId) {
    const col = getCollection(COLLECTION);
    return col.deleteOne({ sessionId, userId });
  },

  /**
   * Delete all conversations for a user
   */
  async deleteAllByUser(userId) {
    const col = getCollection(COLLECTION);
    return col.deleteMany({ userId });
  }
};

module.exports = AIConversation;