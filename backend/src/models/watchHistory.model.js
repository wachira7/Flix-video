// src/models/watchHistory.model.js
const { getCollection } = require('../config/database');

const COLLECTION = 'watch_history';

const WatchHistory = {
  /**
   * Record or update a watch session
   */
  async upsert({ userId, contentType, contentId, progressSeconds, durationSeconds, completed = false, seasonNumber = null, episodeNumber = null, quality = 'HD' }) {
    const col = getCollection(COLLECTION);

    const filter = {
      userId,
      contentType,
      contentId: String(contentId),
      ...(seasonNumber && { seasonNumber }),
      ...(episodeNumber && { episodeNumber })
    };

    const update = {
      $set: {
        progressSeconds,
        durationSeconds,
        completed,
        quality,
        updatedAt: new Date()
      },
      $setOnInsert: {
        userId,
        contentType,
        contentId: String(contentId),
        seasonNumber,
        episodeNumber,
        startedAt: new Date()
      },
      $inc: { watchCount: completed ? 1 : 0 }
    };

    const result = await col.findOneAndUpdate(filter, update, {
      upsert: true,
      returnDocument: 'after'
    });

    return result;
  },

  /**
   * Get watch history for a user
   */
  async getByUser(userId, { limit = 20, contentType = null } = {}) {
    const col = getCollection(COLLECTION);
    const filter = { userId };
    if (contentType) filter.contentType = contentType;

    return col
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();
  },

  /**
   * Get progress for a specific content
   */
  async getProgress(userId, contentId, contentType) {
    const col = getCollection(COLLECTION);
    return col.findOne({
      userId,
      contentId: String(contentId),
      contentType
    });
  },

  /**
   * Get continue watching list (in progress, not completed)
   */
  async getContinueWatching(userId, limit = 10) {
    const col = getCollection(COLLECTION);
    return col
      .find({
        userId,
        completed: false,
        progressSeconds: { $gt: 0 }
      })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();
  },

  /**
   * Delete history entry
   */
  async delete(userId, contentId, contentType) {
    const col = getCollection(COLLECTION);
    return col.deleteOne({
      userId,
      contentId: String(contentId),
      contentType
    });
  },

  /**
   * Clear all history for a user
   */
  async clearAll(userId) {
    const col = getCollection(COLLECTION);
    return col.deleteMany({ userId });
  }
};

module.exports = WatchHistory;