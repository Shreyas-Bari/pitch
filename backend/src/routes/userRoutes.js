const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * User Routes
 * Base path: /api/v1/users
 * Source: docs/PITCH_API_FINAL.md Section 2
 */

// Current authenticated user
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
