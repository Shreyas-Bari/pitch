const express = require('express');
const applicationController = require('../controllers/applicationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, requireCompany } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { validateUpdateApplication } = require('../validators/applicationValidator');
const { ROLES } = require('../utils/constants');

const router = express.Router();

/**
 * Application Routes
 * Base path: /api/v1/applications
 * Sources: docs/PITCH_API_FINAL.md Section 8 & docs/PITCH_FINAL_BUILD_SPEC.md Section 17, 48, Step 10
 */

// 1. List user applications (Company views applied, Committee views received)
router.get('/', authMiddleware, applicationController.listApplications);

// 2. View specific application
router.get('/:applicationId', authMiddleware, applicationController.getApplication);

// 3. Update pending application (Company only)
router.patch(
  '/:applicationId',
  authMiddleware,
  requireCompany,
  validateRequest({ body: validateUpdateApplication }),
  applicationController.updateApplication
);

// 4. Accept application (Owning committee only)
router.post(
  '/:applicationId/accept',
  authMiddleware,
  requireRole(ROLES.COMMITTEE),
  applicationController.acceptApplication
);

// 5. Reject application (Owning committee only)
router.post(
  '/:applicationId/reject',
  authMiddleware,
  requireRole(ROLES.COMMITTEE),
  applicationController.rejectApplication
);

// 6. Withdraw application (Company only)
router.post(
  '/:applicationId/withdraw',
  authMiddleware,
  requireCompany,
  applicationController.withdrawApplication
);

module.exports = router;
