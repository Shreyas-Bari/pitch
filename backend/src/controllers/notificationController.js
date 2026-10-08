const mongoose = require('mongoose');
const notificationService = require('../services/notificationService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Notification Controller
 * Sources: docs/PITCH_API_FINAL.md Section 18 & docs/PITCH_FINAL_BUILD_SPEC.md Section 29, 41, Step 12
 */

async function listNotifications(req, res, next) {
  try {
    const unreadOnly = req.query.unreadOnly || req.query.unread;
    const result = await notificationService.getUserNotifications(req.user._id, {
      ...req.query,
      unreadOnly,
    });
    return sendPaginated(res, result.notifications || result.data, result.pagination);
  } catch (err) {
    next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const result = await notificationService.getUnreadCount(req.user._id);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const notificationId = req.params.notificationId || req.params.id;
    const notification = await notificationService.markAsRead(notificationId, req.user._id);
    return sendSuccess(res, { notification, ...(notification.toObject ? notification.toObject() : notification) }, 200);
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const notificationId = req.params.notificationId || req.params.id;
    const result = await notificationService.deleteNotification(notificationId, req.user._id);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listNotifications,
  getNotifications: listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
