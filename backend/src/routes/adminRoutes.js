const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { validateUpdateReportStatus } = require('../validators/reportValidator');

const router = express.Router();

/**
 * Admin Routes
 * Base path: /api/v1/admin
 * Source: docs/PITCH_API_FINAL.md Section 20
 * Protected: Authentication + ADMIN Role Required on all routes.
 */

router.use(authMiddleware);
router.use(requireAdmin);

// Users
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUser);
router.patch('/users/:userId/status', adminController.updateUserStatus);

// Events
router.get('/events', adminController.getEvents);
router.patch('/events/:eventId/status', adminController.updateEventStatus);

// Deals
router.get('/deals', adminController.getDeals);
router.get('/deals/:dealId', adminController.getDeal);

// Reports
router.get('/reports', adminController.getReports);
router.get('/reports/:reportId', adminController.getReport);
router.patch(
  '/reports/:reportId',
  validateRequest({ body: validateUpdateReportStatus }),
  adminController.updateReport
);

// Analytics
router.get('/analytics/overview', adminController.getAnalyticsOverview);
router.get('/analytics/events', adminController.getAnalyticsEvents);
router.get('/analytics/deals', adminController.getAnalyticsDeals);
router.get('/analytics/users', adminController.getAnalyticsUsers);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
