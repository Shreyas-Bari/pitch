const express = require('express');
const fulfillmentController = require('../controllers/fulfillmentController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const {
  validateUpdateFulfillment,
  validateAddEvidence,
} = require('../validators/dealValidator');

const router = express.Router();

/**
 * Fulfillment Routes
 * Source: docs/PITCH_API_FINAL.md Section 16
 * Base path: /api/v1/fulfillment
 */

router.use(authMiddleware);

// PATCH /api/v1/fulfillment/:fulfillmentId
router.patch(
  '/:fulfillmentId',
  validateRequest({ body: validateUpdateFulfillment }),
  fulfillmentController.updateFulfillment
);

// POST /api/v1/fulfillment/:fulfillmentId/complete
router.post(
  '/:fulfillmentId/complete',
  fulfillmentController.completeFulfillment
);

// POST /api/v1/fulfillment/:fulfillmentId/evidence
router.post(
  '/:fulfillmentId/evidence',
  validateRequest({ body: validateAddEvidence }),
  fulfillmentController.addEvidence
);

// GET /api/v1/fulfillment/:fulfillmentId/evidence
router.get(
  '/:fulfillmentId/evidence',
  fulfillmentController.getEvidence
);

module.exports = router;
