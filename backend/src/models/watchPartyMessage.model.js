// src/models/watchPartyMessage.model.js
const { getCollection } = require('../config/database');
const { ObjectId } = require('mongodb');

const COLLECTION = 'watch_party_messages';

const WatchPartyMessage = {
  /**
   * Save a chat message
   */
  async create({ partyId, userId, username, type = 'text', content }) {
    const col = getCollection(COLLECTION);
    const doc = {
      partyId,
      userId,
      username,
      type,         // 'text' | 'reaction' | 'system'
      content,
      createdAt: new Date()
    };
    const result = await col.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  },

  /**
   * Get chat history for a party
   */
  async getByParty(partyId, limit = 50) {
    const col = getCollection(COLLECTION);
    return col
      .find({ partyId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()
      .then(docs => docs.reverse()); // chronological order
  },

  /**
   * Delete all messages for a party (when party ends)
   */
  async deleteByParty(partyId) {
    const col = getCollection(COLLECTION);
    return col.deleteMany({ partyId });
  },

  /**
   * Get message count for a party
   */
  async countByParty(partyId) {
    const col = getCollection(COLLECTION);
    return col.countDocuments({ partyId });
  }
};

module.exports = WatchPartyMessage;