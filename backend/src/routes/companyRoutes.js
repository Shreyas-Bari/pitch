const express = require('express');
const companyController = require('../controllers/companyController');
const reviewController = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireCompanyOwnership } = require('../middleware/ownershipMiddleware');
const { requireCompany } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const {
  validateCompanyUpdate,
  validateCreateHistory,
  validateUpdateHistory,
} = require('../validators/companyValidator');

const router = express.Router();

/**
 * Company Routes
 * Base path: /api/v1/companies
 * Source: docs/PITCH_API_FINAL.md Section 3 & docs/PITCH_FINAL_BUILD_SPEC.md Section 35
 */

// 1. Marketplace listing (public discovery with search, filter, pagination)
router.get('/', companyController.listCompanies);

// 2. Private owner profile operations (must be authenticated as COMPANY)
router.get('/me', authMiddleware, requireCompany, companyController.getMyCompany);

router.patch(
  '/me',
  authMiddleware,
  requireCompany,
  validateRequest({ body: validateCompanyUpdate }),
  companyController.updateMyCompany
);

router.put(
  '/me',
  authMiddleware,
  requireCompany,
  validateRequest({ body: validateCompanyUpdate }),
  companyController.updateMyCompany
);

// 3. Self-reported history management for owner (COMPANY role only)
router.get('/me/history', authMiddleware, requireCompany, companyController.getMyHistory);

router.post(
  '/me/history',
  authMiddleware,
  requireCompany,
  validateRequest({ body: validateCreateHistory }),
  companyController.createMyHistory
);

router.patch(
  '/me/history/:historyId',
  authMiddleware,
  requireCompany,
  validateRequest({ body: validateUpdateHistory }),
  companyController.updateMyHistory
);

router.put(
  '/me/history/:historyId',
  authMiddleware,
  requireCompany,
  validateRequest({ body: validateUpdateHistory }),
  companyController.updateMyHistory
);

router.delete(
  '/me/history/:historyId',
  authMiddleware,
  requireCompany,
  companyController.deleteMyHistory
);

// 4. Public profile lookup (sanitized public marketplace projection)
router.get('/:companyId', companyController.getPublicCompany);

// 5. Public self-reported history lookup
router.get('/:companyId/history', companyController.getCompanyHistory);

// 6. Private profile lookup by ID (owner or admin only)
router.get(
  '/:companyId/private',
  authMiddleware,
  requireCompanyOwnership({ paramName: 'companyId' }),
  companyController.getPrivateCompany
);

// 7. Protected profile update by ID (must own company, or admin)
router.put(
  '/:companyId',
  authMiddleware,
  requireCompanyOwnership({ paramName: 'companyId' }),
  validateRequest({ body: validateCompanyUpdate }),
  companyController.updateCompany
);

router.patch(
  '/:companyId',
  authMiddleware,
  requireCompanyOwnership({ paramName: 'companyId' }),
  validateRequest({ body: validateCompanyUpdate }),
  companyController.updateCompany
);

// 8. Reviews and verified history
router.get('/:companyId/reviews', reviewController.getCompanyReviews);
router.get('/:companyId/verified-history', reviewController.getCompanyVerifiedHistory);

module.exports = router;

