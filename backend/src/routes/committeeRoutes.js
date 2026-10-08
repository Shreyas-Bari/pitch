const express = require('express');
const committeeController = require('../controllers/committeeController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireCommitteeOwnership } = require('../middleware/ownershipMiddleware');
const { requireCommittee } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const {
  validateCommitteeUpdate,
  validateCreateHistory,
  validateUpdateHistory,
} = require('../validators/committeeValidator');

const router = express.Router();

/**
 * Committee Routes
 * Base path: /api/v1/committees
 * Source: docs/PITCH_API_FINAL.md Section 3 & docs/PITCH_FINAL_BUILD_SPEC.md Section 35
 */

// 1. Marketplace listing (public discovery with search, filter, pagination)
router.get('/', committeeController.listCommittees);

// 2. Private owner profile operations (must be authenticated as COMMITTEE)
router.get('/me', authMiddleware, requireCommittee, committeeController.getMyCommittee);

router.patch(
  '/me',
  authMiddleware,
  requireCommittee,
  validateRequest({ body: validateCommitteeUpdate }),
  committeeController.updateMyCommittee
);

router.put(
  '/me',
  authMiddleware,
  requireCommittee,
  validateRequest({ body: validateCommitteeUpdate }),
  committeeController.updateMyCommittee
);

// 3. Self-reported history management for owner (COMMITTEE role only)
router.get('/me/history', authMiddleware, requireCommittee, committeeController.getMyHistory);

router.post(
  '/me/history',
  authMiddleware,
  requireCommittee,
  validateRequest({ body: validateCreateHistory }),
  committeeController.createMyHistory
);

router.patch(
  '/me/history/:historyId',
  authMiddleware,
  requireCommittee,
  validateRequest({ body: validateUpdateHistory }),
  committeeController.updateMyHistory
);

router.put(
  '/me/history/:historyId',
  authMiddleware,
  requireCommittee,
  validateRequest({ body: validateUpdateHistory }),
  committeeController.updateMyHistory
);

router.delete(
  '/me/history/:historyId',
  authMiddleware,
  requireCommittee,
  committeeController.deleteMyHistory
);

// 4. Public profile lookup (sanitized public marketplace projection)
router.get('/:committeeId', committeeController.getPublicCommittee);

// 5. Public self-reported history lookup
router.get('/:committeeId/history', committeeController.getCommitteeHistory);

// 6. Private profile lookup by ID (owner or admin only)
router.get(
  '/:committeeId/private',
  authMiddleware,
  requireCommitteeOwnership({ paramName: 'committeeId' }),
  committeeController.getPrivateCommittee
);

// 7. Protected profile update by ID (must own committee, or admin)
router.put(
  '/:committeeId',
  authMiddleware,
  requireCommitteeOwnership({ paramName: 'committeeId' }),
  validateRequest({ body: validateCommitteeUpdate }),
  committeeController.updateCommittee
);

router.patch(
  '/:committeeId',
  authMiddleware,
  requireCommitteeOwnership({ paramName: 'committeeId' }),
  validateRequest({ body: validateCommitteeUpdate }),
  committeeController.updateCommittee
);

module.exports = router;
