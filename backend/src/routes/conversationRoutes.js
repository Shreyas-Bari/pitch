const express = require('express');
const conversationController = require('../controllers/conversationController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Conversation Routes
 * Base path: /api/v1/conversations
 * Sources: docs/PITCH_API_FINAL.md Section 10 & docs/PITCH_FINAL_BUILD_SPEC.md Section 19, Step 13
 */

// 1. List user conversations
router.get('/', authMiddleware, conversationController.listConversations);

// 2. Create / establish conversation
router.post('/', authMiddleware, conversationController.createConversation);

// 3. Get single conversation details
router.get('/:conversationId', authMiddleware, conversationController.getConversation);

// 4. Archive conversation
router.post('/:conversationId/archive', authMiddleware, conversationController.archiveConversation);

// 5. Get conversation messages (paginated)
router.get('/:conversationId/messages', authMiddleware, conversationController.getMessages);

// 6. Send message in conversation
router.post('/:conversationId/messages', authMiddleware, conversationController.sendMessage);

// 7. Mark conversation messages as read
router.post('/:conversationId/read', authMiddleware, conversationController.markAsRead);

// 8. Contact sharing (mutual interest participants)
router.post('/:conversationId/contact-share', authMiddleware, conversationController.shareContact);
router.get('/:conversationId/contact-shares', authMiddleware, conversationController.getContactShares);

module.exports = router;
