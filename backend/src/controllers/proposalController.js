const proposalService = require('../services/proposalService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Proposal Controller
 * Source of Truth: docs/PITCH_API_FINAL.md Section 13
 */

async function getProposalById(req, res, next) {
  try {
    const proposalId = req.params.proposalId || req.params.id;
    const proposal = await proposalService.getProposalById({
      proposalId,
      userId: req.user._id,
      role: req.user.role,
    });
    return sendSuccess(res, proposal, 200);
  } catch (err) {
    next(err);
  }
}

async function counterProposal(req, res, next) {
  try {
    const proposalId = req.params.proposalId || req.params.id;
    const counter = await proposalService.counterProposal({
      proposalId,
      userId: req.user._id,
      role: req.user.role,
      data: req.body,
    });
    return sendSuccess(res, counter, 201);
  } catch (err) {
    next(err);
  }
}

async function acceptProposal(req, res, next) {
  try {
    const proposalId = req.params.proposalId || req.params.id;
    const result = await proposalService.acceptProposal({
      proposalId,
      userId: req.user._id,
      role: req.user.role,
      data: req.body,
    });
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function declineProposal(req, res, next) {
  try {
    const proposalId = req.params.proposalId || req.params.id;
    const reason = req.body.reason;
    const result = await proposalService.declineProposal({
      proposalId,
      userId: req.user._id,
      role: req.user.role,
      reason,
    });
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function withdrawProposal(req, res, next) {
  try {
    const proposalId = req.params.proposalId || req.params.id;
    const result = await proposalService.withdrawProposal({
      proposalId,
      userId: req.user._id,
      role: req.user.role,
    });
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProposalById,
  counterProposal,
  acceptProposal,
  declineProposal,
  withdrawProposal,
};
