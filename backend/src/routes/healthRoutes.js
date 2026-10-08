const express = require('express');
const HealthController = require('../controllers/healthController');

const router = express.Router();

/**
 * Health Endpoints
 * Source: docs/PITCH_API_FINAL.md Section 22
 * - GET /: Returns overall API status and metrics
 * - GET /db: Inspects and pings MongoDB connection
 */
router.get('/', HealthController.getHealth);
router.get('/db', HealthController.getDatabaseHealth);

module.exports = router;
