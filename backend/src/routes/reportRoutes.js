const express = require('express');
const reportController = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { validateCreateReport } = require('../validators/reportValidator');

const router = express.Router();

/**
 * Report Routes
 * Source: docs/PITCH_API_FINAL.md Section 21
 * Base path: /api/v1/reports
 */

router.use(authMiddleware);

// POST /api/v1/reports
router.post(
  '/',
  validateRequest({ body: validateCreateReport }),
  reportController.createReport
);

// GET /api/v1/reports/me
router.get('/me', reportController.getMyReports);

// GET /api/v1/reports/:reportId
router.get('/:reportId', reportController.getReportById);

module.exports = router;
