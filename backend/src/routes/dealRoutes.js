const express = require('express');
const dealController = require('../controllers/dealController');
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireDealParticipation } = require('../middleware/ownershipMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const {
  validateCreateDeal,
  validateUpdateDeal,
  validateCancelDeal,
  validateCreateFulfillment,
  validateCompleteDeal,
  validateCreateDispute,
} = require('../validators/dealValidator');
const { validateCreateProposal } = require('../validators/proposalValidator');
const { validateGenerateMou } = require('../validators/mouValidator');
const { validateCreateReview } = require('../validators/reviewValidator');

const router = express.Router();

/**
 * Deal Routes
 * Sources: docs/PITCH_API_FINAL.md Sections 12, 16 & 17
 * Base path: /api/v1/deals
 */

// All deal routes require authentication
router.use(authenticate);

// Deal CRUD & listing
router.post('/', validateRequest({ body: validateCreateDeal }), dealController.createDeal);
router.get('/', dealController.getDeals);
router.get('/:dealId', dealController.getDealById);
router.patch('/:dealId', validateRequest({ body: validateUpdateDeal }), dealController.updateDeal);

// Deal lifecycle transitions
router.get('/:dealId/timeline', dealController.getDealTimeline);
router.post('/:dealId/cancel', validateRequest({ body: validateCancelDeal }), dealController.cancelDeal);
router.post('/:dealId/agree', dealController.agreeDeal);
router.get('/:dealId/agreement', dealController.getDealAgreement);

// Nested Proposal routes
router.get('/:dealId/proposals', dealController.getProposals);
router.post('/:dealId/proposals', validateRequest({ body: validateCreateProposal }), dealController.createProposal);

// Nested MoU routes
router.get('/:dealId/mou', dealController.getMou);
router.post('/:dealId/mou', validateRequest({ body: validateGenerateMou }), dealController.generateMou);

// Fulfillment routes
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

// Completion routes
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

// Disputes routes
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
