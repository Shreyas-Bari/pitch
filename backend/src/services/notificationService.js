const mongoose = require('mongoose');
const { Notification } = require('../models');
const ApiError = require('../utils/apiError');
const { NOTIFICATION_TYPE } = require('../utils/constants');

// Socket instance holder for realtime push
let socketIoInstance = null;

function setSocketIo(io) {
  socketIoInstance = io;
}

/**
 * Notification Service
 * Source: docs/PITCH_DATABASE_FINAL.md Section 27 & docs/PITCH_API_FINAL.md Section 18
 */

async function createNotification({ recipientUserId, type, title, message, entityType = null, entityId = null }) {
  if (!recipientUserId || !mongoose.Types.ObjectId.isValid(recipientUserId)) {
    return null;
  }

  const notification = await Notification.create({
    recipientUserId,
    type,
    title: (title || '').trim(),
    message: (message || '').trim(),
    entityType,
    entityId: entityId ? new mongoose.Types.ObjectId(entityId) : null,
    readAt: null,
  });

  // Realtime push via Socket.IO if connected
  if (socketIoInstance) {
    socketIoInstance.to(`user:${recipientUserId}`).to(`user_${recipientUserId}`).emit('notification:new', notification);
  }

  return notification;
}

async function getUserNotifications(userId, query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = { recipientUserId: userId };
  if (query.unreadOnly === 'true' || query.unreadOnly === true || query.unread === 'true' || query.unread === true) {
    filter.readAt = null;
  }

  const [total, notifications] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    notifications,
    data: notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getUnreadCount(userId) {
  const count = await Notification.countDocuments({
    recipientUserId: userId,
    readAt: null,
  });
  return { unreadCount: count };
}

async function markAsRead(notificationId, userId) {
  if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
    throw ApiError.badRequest('Invalid notification ID format', null, 'INVALID_ID');
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientUserId: userId },
    { $set: { readAt: new Date() } },
    { new: true }
  );

  if (!notification) {
    throw ApiError.notFound('Notification not found', null, 'NOTIFICATION_NOT_FOUND');
  }

  return notification;
}

async function markAllAsRead(userId) {
  const result = await Notification.updateMany(
    { recipientUserId: userId, readAt: null },
    { $set: { readAt: new Date() } }
  );

  return { message: 'All notifications marked as read', modifiedCount: result.modifiedCount };
}

async function deleteNotification(notificationId, userId) {
  if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
    throw ApiError.badRequest('Invalid notification ID format', null, 'INVALID_ID');
  }

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipientUserId: userId,
  });

  if (!notification) {
    throw ApiError.notFound('Notification not found', null, 'NOTIFICATION_NOT_FOUND');
  }

  return { message: 'Notification deleted successfully' };
}

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  setSocketIo,
};
