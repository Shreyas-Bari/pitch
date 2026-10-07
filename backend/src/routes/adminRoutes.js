const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * Admin Routes
 * Base path: /api/v1/admin
 * Protected: Authentication + ADMIN Role
 * Source: docs/PITCH_API_FINAL.md Section 20
 */

// All admin routes require authentication and ADMIN role
router.use(authMiddleware);
router.use(requireAdmin);

router.get('/users', adminController.listUsers);
router.get('/users/:userId', adminController.getUser);
router.patch('/users/:userId/status', adminController.updateUserStatus);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
