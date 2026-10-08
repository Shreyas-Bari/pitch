const express = require('express');
const invitationController = require('../controllers/invitationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, requireCompany } = require('../middleware/roleMiddleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();

/**
 * Invitation Routes
 * Base path: /api/v1/invitations
 * Sources: docs/PITCH_API_FINAL.md Section 9 & docs/PITCH_FINAL_BUILD_SPEC.md Section 18, 49, Step 11
 */

// 1. List user invitations
router.get('/', authMiddleware, invitationController.listInvitations);

// 2. View specific invitation
router.get('/:invitationId', authMiddleware, invitationController.getInvitation);

// 3. Accept invitation (Company recipient only)
router.post(
  '/:invitationId/accept',
  authMiddleware,
  requireCompany,
  invitationController.acceptInvitation
);

// 4. Decline invitation (Company recipient only)
router.post(
  '/:invitationId/decline',
  authMiddleware,
  requireCompany,
  invitationController.declineInvitation
);

// 5. Cancel invitation (Owning committee only)
router.post(
  '/:invitationId/cancel',
  authMiddleware,
  requireRole(ROLES.COMMITTEE),
  invitationController.cancelInvitation
);

module.exports = router;
