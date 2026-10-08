const express = require('express');
const dealController = require('../controllers/dealController');
const reviewController = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireDealParticipation } = require('../middleware/ownershipMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const {
  validateCreateFulfillment,
  validateCompleteDeal,
  validateCreateDispute,
} = require('../validators/dealValidator');
const { validateCreateReview } = require('../validators/reviewValidator');

const router = express.Router();

/**
 * Deal Routes
 * Source: docs/PITCH_API_FINAL.md Section 16 & 17
 * Base path: /api/v1/deals
 */

router.use(authMiddleware);

// GET /api/v1/deals
router.get('/', dealController.listDeals);

// GET /api/v1/deals/:dealId
router.get('/:dealId', requireDealParticipation(), dealController.getDeal);

// Fulfillment on deal
router.get(
  '/:dealId/fulfillment',
  requireDealParticipation(),
  dealController.getFulfillment
);
router.post(
  '/:dealId/fulfillment',
  requireDealParticipation(),
  validateRequest({ body: validateCreateFulfillment }),
  dealController.addFulfillment
);

// Completion on deal
router.get(
  '/:dealId/completion',
  requireDealParticipation(),
  dealController.getCompletion
);
router.post(
  '/:dealId/complete',
  requireDealParticipation(),
  validateRequest({ body: validateCompleteDeal }),
  dealController.completeDeal
);

// Disputes on deal
router.get(
  '/:dealId/disputes',
  requireDealParticipation(),
  dealController.getDisputes
);
router.post(
  '/:dealId/dispute',
  requireDealParticipation(),
  validateRequest({ body: validateCreateDispute }),
  dealController.createDispute
);

// Reviews on deal
router.get('/:dealId/reviews', reviewController.getDealReviews);
router.post(
  '/:dealId/reviews',
  validateRequest({ body: validateCreateReview }),
  reviewController.createDealReview
);

module.exports = router;
