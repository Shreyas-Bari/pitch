const express = require('express');
const messageController = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Message Routes
 * Base path: /api/v1/messages
 * Sources: docs/PITCH_API_FINAL.md Section 10 & docs/PITCH_FINAL_BUILD_SPEC.md Section 20, Step 13
 */

// 1. Edit message
router.patch('/:messageId', authMiddleware, messageController.editMessage);

// 2. Delete message (soft delete)
router.delete('/:messageId', authMiddleware, messageController.deleteMessage);

module.exports = router;
