const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Notification Routes
 * Base path: /api/v1/notifications
 * Sources: docs/PITCH_API_FINAL.md Section 18 & docs/PITCH_FINAL_BUILD_SPEC.md Section 29, 41, Step 12
 */

router.use(authMiddleware);

// 1. List notifications
router.get('/', notificationController.listNotifications);

// 2. Unread count
router.get('/unread-count', notificationController.getUnreadCount);

// 3. Mark all as read
router.post('/read-all', notificationController.markAllAsRead);

// 4. Mark single as read
router.post('/:notificationId/read', notificationController.markAsRead);

// 5. Delete notification
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
