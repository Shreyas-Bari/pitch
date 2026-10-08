const dealService = require('../services/dealService');
const proposalService = require('../services/proposalService');
const mouService = require('../services/mouService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');

/**
 * Deal Controller
 * Source of Truth: docs/PITCH_API_FINAL.md Section 12
 */

async function createDeal(req, res, next) {
  try {
    const deal = await dealService.createDeal({
      userId: req.user._id,
      role: req.user.role,
      data: req.body,
    });
    return sendSuccess(res, deal, 201);
  } catch (err) {
    next(err);
  }
}

async function getDeals(req, res, next) {
  try {
    const { deals, pagination } = await dealService.getDeals({
      userId: req.user._id,
      role: req.user.role,
      query: req.query,
    });
    return sendPaginated(res, deals, pagination, 200);
  } catch (err) {
    next(err);
  }
}

async function getDealById(req, res, next) {
  try {
    const dealId = req.params.dealId || req.params.id;
    const deal = await dealService.getDealById({
      dealId,
      userId: req.user._id,
      role: req.user.role,
    });
    return sendSuccess(res, deal, 200);
  } catch (err) {
    next(err);
  }
}

async function updateDeal(req, res, next) {
  try {
    const dealId = req.params.dealId || req.params.id;
    const deal = await dealService.updateDeal({
      dealId,
      userId: req.user._id,
      role: req.user.role,
      updates: req.body,
    });
    return sendSuccess(res, deal, 200);
  } catch (err) {
    next(err);
  }
}

async function cancelDeal(req, res, next) {
  try {
    const dealId = req.params.dealId || req.params.id;
    const reason = req.body.reason || req.body.cancellationReason;
    const deal = await dealService.cancelDeal({
      dealId,
      userId: req.user._id,
      role: req.user.role,
      reason,
    });
    return sendSuccess(res, deal, 200);
  } catch (err) {
    next(err);
  }
}

async function agreeDeal(req, res, next) {
  try {
    const dealId = req.params.dealId || req.params.id;
    const result = await dealService.agreeDeal({
      dealId,
      userId: req.user._id,
      role: req.user.role,
      data: req.body,
    });
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function getDealAgreement(req, res, next) {
  try {
    const dealId = req.params.dealId || req.params.id;
    const agreement = await dealService.getDealAgreement({
      dealId,
      userId: req.user._id,
      role: req.user.role,
    });
    return sendSuccess(res, agreement, 200);
  } catch (err) {
    next(err);
  }
}

async function getDealTimeline(req, res, next) {
  try {
    const dealId = req.params.dealId || req.params.id;
    const timeline = await dealService.getDealTimeline({
      dealId,
      userId: req.user._id,
      role: req.user.role,
    });
    return sendSuccess(res, timeline, 200);
  } catch (err) {
    next(err);
  }
}

// Nested route handlers for /api/v1/deals/:dealId/proposals
async function getProposals(req, res, next) {
  try {
    const dealId = req.params.dealId || req.params.id;
    const proposals = await proposalService.getProposalsForDeal({
      dealId,
      userId: req.user._id,
      role: req.user.role,
    });
    return sendSuccess(res, proposals, 200);
  } catch (err) {
    next(err);
  }
}

async function createProposal(req, res, next) {
  try {
    const dealId = req.params.dealId || req.params.id;
    const proposal = await proposalService.createProposal({
      dealId,
      userId: req.user._id,
      role: req.user.role,
      data: req.body,
    });
    return sendSuccess(res, proposal, 201);
  } catch (err) {
    next(err);
  }
}

// Nested route handlers for /api/v1/deals/:dealId/mou
async function getMou(req, res, next) {
  try {
    const dealId = req.params.dealId || req.params.id;
    const mouData = await mouService.getMouForDeal({
      dealId,
      userId: req.user._id,
      role: req.user.role,
    });
    return sendSuccess(res, mouData, 200);
  } catch (err) {
    next(err);
  }
}

async function generateMou(req, res, next) {
  try {
    const dealId = req.params.dealId || req.params.id;
    const mouResult = await mouService.generateMouForDeal({
      dealId,
      userId: req.user._id,
      role: req.user.role,
      options: req.body,
    });
    return sendSuccess(res, mouResult, 201);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  cancelDeal,
  agreeDeal,
  getDealAgreement,
  getDealTimeline,
  getProposals,
  createProposal,
  getMou,
  generateMou,
};
