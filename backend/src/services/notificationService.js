const { Notification } = require('../models');

/**
 * Notification Service
 * Source: docs/PITCH_DATABASE_FINAL.md Section 27 & docs/PITCH_API_FINAL.md Section 18
 */

/**
 * Create a new notification for a user.
 */
async function createNotification({
  recipientUserId,
  type,
  title,
  message,
  entityType = null,
  entityId = null,
}) {
  try {
    const notification = await Notification.create({
      recipientUserId,
      type,
      title,
      message,
      entityType,
      entityId,
    });
    return notification;
  } catch (err) {
    console.error('[PITCH Notification] Failed to create notification:', err.message);
    return null;
  }
}

/**
 * Fetch notifications for a user with pagination.
 */
async function getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  const query = { recipientUserId: userId };
  if (unreadOnly) {
    query.readAt = null;
  }

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (numericPage - 1) * numericLimit;

  const [total, notifications] = await Promise.all([
    Notification.countDocuments(query),
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit)
      .lean(),
  ]);

  return {
    data: notifications,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1,
    },
  };
}

/**
 * Get count of unread notifications for a user.
 */
async function getUnreadCount(userId) {
  const count = await Notification.countDocuments({
    recipientUserId: userId,
    readAt: null,
  });
  return count;
}

/**
 * Mark a single notification as read.
 */
async function markAsRead(notificationId, userId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientUserId: userId },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  return notification;
}

/**
 * Mark all notifications as read for a user.
 */
async function markAllAsRead(userId) {
  const result = await Notification.updateMany(
    { recipientUserId: userId, readAt: null },
    { $set: { readAt: new Date() } }
  );
  return result;
}

/**
 * Delete a notification for a user.
 */
async function deleteNotification(notificationId, userId) {
  const deleted = await Notification.findOneAndDelete({
    _id: notificationId,
    recipientUserId: userId,
  });
  return deleted;
}

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
