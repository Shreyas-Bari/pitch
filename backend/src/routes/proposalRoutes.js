const express = require('express');
const proposalController = require('../controllers/proposalController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { validateCounterProposal } = require('../validators/proposalValidator');

const router = express.Router();

/**
 * Proposal Routes
 * Source of Truth: docs/PITCH_API_FINAL.md Section 13
 */

router.use(authenticate);

router.get('/:proposalId', proposalController.getProposalById);
router.post(
  '/:proposalId/counter',
  validateRequest({ body: validateCounterProposal }),
  proposalController.counterProposal
);
router.post('/:proposalId/accept', proposalController.acceptProposal);
router.post('/:proposalId/decline', proposalController.declineProposal);
router.post('/:proposalId/withdraw', proposalController.withdrawProposal);

module.exports = router;
