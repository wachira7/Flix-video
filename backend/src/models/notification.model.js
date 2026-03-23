// src/models/notification.model.js
const { getCollection } = require('../config/database');
const { ObjectId } = require('mongodb');

const COLLECTION = 'notifications';

const Notification = {
  /**
   * Create a notification
   */
  async create({ userId, type, title, message, data = {} }) {
    const col = getCollection(COLLECTION);
    const doc = {
      userId,
      type,       // 'payment_success' | 'payment_failed' | 'subscription_expiring' | 'watch_party_invite' | 'new_review'
      title,
      message,
      data,       // flexible metadata per type
      read: false,
      readAt: null,
      createdAt: new Date()
    };
    const result = await col.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  },

  /**
   * Get notifications for a user
   */
  async getByUser(userId, { limit = 20, unreadOnly = false } = {}) {
    const col = getCollection(COLLECTION);
    const filter = { userId };
    if (unreadOnly) filter.read = false;

    return col
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  },

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    const col = getCollection(COLLECTION);
    return col.countDocuments({ userId, read: false });
  },

  /**
   * Mark one as read
   */
  async markAsRead(notificationId, userId) {
    const col = getCollection(COLLECTION);
    return col.findOneAndUpdate(
      { _id: new ObjectId(notificationId), userId },
      { $set: { read: true, readAt: new Date() } },
      { returnDocument: 'after' }
    );
  },

  /**
   * Mark all as read for a user
   */
  async markAllAsRead(userId) {
    const col = getCollection(COLLECTION);
    return col.updateMany(
      { userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
  },

  /**
   * Delete a notification
   */
  async delete(notificationId, userId) {
    const col = getCollection(COLLECTION);
    return col.deleteOne({ _id: new ObjectId(notificationId), userId });
  },

  /**
   * Delete old notifications (older than 90 days)
   */
  async deleteOld() {
    const col = getCollection(COLLECTION);
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    return col.deleteMany({ createdAt: { $lt: cutoff } });
  }
};

module.exports = Notification;