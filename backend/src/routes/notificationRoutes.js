const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Notification Routes
 * Base path: /api/v1/notifications
 * Source: docs/PITCH_API_FINAL.md Section 18
 */

router.use(authMiddleware);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.post('/:notificationId/read', notificationController.markAsRead);
router.post('/read-all', notificationController.markAllAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
