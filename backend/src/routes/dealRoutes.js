const express = require('express');
const dealController = require('../controllers/dealController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const {
  validateCreateDeal,
  validateUpdateDeal,
  validateCancelDeal,
} = require('../validators/dealValidator');
const { validateCreateProposal } = require('../validators/proposalValidator');
const { validateGenerateMou } = require('../validators/mouValidator');

const router = express.Router();

/**
 * Deal Routes
 * Source of Truth: docs/PITCH_API_FINAL.md Section 12
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

module.exports = router;
