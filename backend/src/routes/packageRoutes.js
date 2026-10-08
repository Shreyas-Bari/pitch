const express = require('express');
const packageController = require('../controllers/packageController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { validateUpdatePackage } = require('../validators/packageValidator');

const router = express.Router();

/**
 * Sponsorship Package Routes
 * Base path: /api/v1/packages
 * Sources: docs/PITCH_API_FINAL.md Section 5 & docs/PITCH_FINAL_BUILD_SPEC.md Section 16, Step 8
 */

// 1. Get package by ID
router.get('/:packageId', packageController.getPackage);

// 2. Update package (owning committee or admin)
router.patch(
  '/:packageId',
  authMiddleware,
  validateRequest({ body: validateUpdatePackage }),
  packageController.updatePackage
);

router.put(
  '/:packageId',
  authMiddleware,
  validateRequest({ body: validateUpdatePackage }),
  packageController.updatePackage
);

// 3. Delete package (owning committee or admin)
router.delete('/:packageId', authMiddleware, packageController.deletePackage);

module.exports = router;
