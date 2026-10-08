const express = require('express');
const committeeController = require('../controllers/committeeController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireCommitteeOwnership } = require('../middleware/ownershipMiddleware');

const router = express.Router();

/**
 * Committee Routes
 * Base path: /api/v1/committees
 * Source: docs/PITCH_API_FINAL.md Section 3 & docs/PITCH_FINAL_BUILD_SPEC.md Section 35
 */

// Public / view committee profile (sanitized public marketplace projection)
router.get('/:committeeId', committeeController.getPublicCommittee);

// Private / view full committee profile (owner or admin only)
router.get(
  '/:committeeId/private',
  authMiddleware,
  requireCommitteeOwnership({ paramName: 'committeeId' }),
  committeeController.getPrivateCommittee
);

// Protected update: must be authenticated and own the committee (or admin)
router.put(
  '/:committeeId',
  authMiddleware,
  requireCommitteeOwnership({ paramName: 'committeeId' }),
  committeeController.updateCommittee
);

router.patch(
  '/:committeeId',
  authMiddleware,
  requireCommitteeOwnership({ paramName: 'committeeId' }),
  committeeController.updateCommittee
);

module.exports = router;
