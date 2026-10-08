const express = require('express');
const authController = require('../controllers/authController');
const eventController = require('../controllers/eventController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireCompany } = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * User Routes
 * Base path: /api/v1/users
 * Source: docs/PITCH_API_FINAL.md Section 2, 6
 */

// Current authenticated user
router.get('/me', authMiddleware, authController.getMe);

// Saved events for company
router.get('/me/saved-events', authMiddleware, requireCompany, eventController.getSavedEvents);

module.exports = router;

