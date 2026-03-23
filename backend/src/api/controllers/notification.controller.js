// src/api/controllers/notification.controller.js
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../utils/constants');
const logger = require('../../utils/logger');
const Notification = require('../../models/notification.model');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, unread_only = false } = req.query;

    const notifications = await Notification.getByUser(userId, {
      limit: parseInt(limit),
      unreadOnly: unread_only === 'true'
    });

    res.json({ success: true, notifications });
  } catch (error) {
    logger.error('Get notifications error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false, error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Get unread count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.getUnreadCount(userId);
    res.json({ success: true, count });
  } catch (error) {
    logger.error('Get unread count error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false, error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:notificationId/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.markAsRead(notificationId, userId);

    if (!notification) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false, error: 'Notification not found'
      });
    }

    res.json({ success: true, notification });
  } catch (error) {
    logger.error('Mark as read error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false, error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.markAllAsRead(userId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Mark all as read error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false, error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:notificationId
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const result = await Notification.delete(notificationId, userId);

    if (result.deletedCount === 0) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false, error: 'Notification not found'
      });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    logger.error('Delete notification error', { error: error.message });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false, error: ERROR_MESSAGES.SERVER_ERROR
    });
  }
};

// @desc    Create notification (internal use)
// @access  Internal
const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    return await Notification.create({ userId, type, title, message, data });
  } catch (error) {
    logger.error('Create notification error', { error: error.message, userId, type });
    throw error;
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
};