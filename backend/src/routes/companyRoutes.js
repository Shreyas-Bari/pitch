const express = require('express');
const companyController = require('../controllers/companyController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireCompanyOwnership } = require('../middleware/ownershipMiddleware');

const router = express.Router();

/**
 * Company Routes
 * Base path: /api/v1/companies
 * Source: docs/PITCH_API_FINAL.md Section 3 & docs/PITCH_FINAL_BUILD_SPEC.md Section 35
 */

// Public / view company profile (sanitized public marketplace projection)
router.get('/:companyId', companyController.getPublicCompany);

// Private / view full company profile (owner or admin only)
router.get(
  '/:companyId/private',
  authMiddleware,
  requireCompanyOwnership({ paramName: 'companyId' }),
  companyController.getPrivateCompany
);

// Protected update: must be authenticated and own the company (or admin)
router.put(
  '/:companyId',
  authMiddleware,
  requireCompanyOwnership({ paramName: 'companyId' }),
  companyController.updateCompany
);

router.patch(
  '/:companyId',
  authMiddleware,
  requireCompanyOwnership({ paramName: 'companyId' }),
  companyController.updateCompany
);

module.exports = router;
