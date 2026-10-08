const express = require('express');
const searchController = require('../controllers/searchController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { requireCompany, requireCommittee } = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * Search & Recommendations Routes
 * Base paths:
 * - /api/v1/search
 * - /api/v1/recommendations
 * Sources: docs/PITCH_API_FINAL.md Section 7 & docs/PITCH_FINAL_BUILD_SPEC.md Section 36
 */

// Search across events and companies
router.get('/', optionalAuth, searchController.search);

// Event recommendations for companies
router.get('/events', authMiddleware, requireCompany, searchController.getEventRecommendations);

// Company recommendations for committees
router.get('/companies', authMiddleware, requireCommittee, searchController.getCompanyRecommendations);

module.exports = router;
