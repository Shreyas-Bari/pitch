const notificationService = require('../services/notificationService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

/**
 * Notification Controller
 * Source: docs/PITCH_API_FINAL.md Section 18
 */

async function getNotifications(req, res, next) {
  try {
    const unreadOnly = req.query.unread === 'true';
    const result = await notificationService.getUserNotifications(req.user._id, {
      ...req.query,
      unreadOnly,
    });
    return sendPaginated(res, result.data, result.pagination, 200);
  } catch (err) {
    next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    return sendSuccess(res, { unreadCount: count }, 200);
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { notificationId } = req.params;
    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return next(ApiError.badRequest('Invalid notification ID format', null, 'INVALID_ID'));
    }

    const updated = await notificationService.markAsRead(notificationId, req.user._id);
    if (!updated) {
      return next(ApiError.notFound('Notification not found', null, 'NOTIFICATION_NOT_FOUND'));
    }

    return sendSuccess(res, updated, 200);
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await notificationService.markAllAsRead(req.user._id);
    return sendSuccess(res, { message: 'All notifications marked as read' }, 200);
  } catch (err) {
    next(err);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const { notificationId } = req.params;
    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return next(ApiError.badRequest('Invalid notification ID format', null, 'INVALID_ID'));
    }

    const deleted = await notificationService.deleteNotification(notificationId, req.user._id);
    if (!deleted) {
      return next(ApiError.notFound('Notification not found', null, 'NOTIFICATION_NOT_FOUND'));
    }

    return sendSuccess(res, { message: 'Notification deleted successfully' }, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
