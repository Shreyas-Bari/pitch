const notificationService = require('../services/notificationService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');

/**
 * Notification Controller
 * Sources: docs/PITCH_API_FINAL.md Section 18 & docs/PITCH_FINAL_BUILD_SPEC.md Section 29, 41, Step 12
 */

async function listNotifications(req, res, next) {
  try {
    const result = await notificationService.getUserNotifications(req.user._id, req.query);
    return sendPaginated(res, result.notifications, result.pagination);
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
    const notification = await notificationService.markAsRead(req.params.notificationId, req.user._id);
    return sendSuccess(res, { notification }, 200);
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
    const result = await notificationService.deleteNotification(req.params.notificationId, req.user._id);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
