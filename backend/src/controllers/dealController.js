const mongoose = require('mongoose');
const dealService = require('../services/dealService');
const fulfillmentService = require('../services/fulfillmentService');
const proposalService = require('../services/proposalService');
const mouService = require('../services/mouService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Deal Controller
 * Sources: docs/PITCH_API_FINAL.md Sections 12, 16 & 17
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
    if (req.user) {
      const { deals, pagination } = await dealService.getDeals({
        userId: req.user._id,
        role: req.user.role,
        query: req.query,
      });
      return sendPaginated(res, deals, pagination, 200);
    }
    const result = await dealService.listDeals(req.query);
    return sendPaginated(res, result.data, result.pagination, 200);
  } catch (err) {
    next(err);
  }
}

async function listDeals(req, res, next) {
  return getDeals(req, res, next);
}

async function getDealById(req, res, next) {
  try {
    const dealId = req.params.dealId || req.params.id;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }
    const deal = await dealService.getDealById({
      dealId,
      userId: req.user?._id,
      role: req.user?.role,
    });
    return sendSuccess(res, deal, 200);
  } catch (err) {
    next(err);
  }
}

async function getDeal(req, res, next) {
  return getDealById(req, res, next);
}

async function updateDeal(req, res, next) {
  try {
    const dealId = req.params.dealId || req.params.id;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }
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
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }
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
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }
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
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }
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
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }
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

async function getProposals(req, res, next) {
  try {
    const dealId = req.params.dealId || req.params.id;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }
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
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }
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

async function getMou(req, res, next) {
  try {
    const dealId = req.params.dealId || req.params.id;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }
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
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }
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

async function getCompletion(req, res, next) {
  try {
    const { dealId } = req.params;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }

    const status = await dealService.getCompletionStatus(dealId);
    return sendSuccess(res, status, 200);
  } catch (err) {
    next(err);
  }
}

async function completeDeal(req, res, next) {
  try {
    const { dealId } = req.params;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }

    const completed = await dealService.completeDeal(
      dealId,
      req.body,
      req.user,
      req
    );

    return sendSuccess(res, completed, 200);
  } catch (err) {
    next(err);
  }
}

async function createDispute(req, res, next) {
  try {
    const { dealId } = req.params;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }

    const dispute = await dealService.createDealDispute(
      dealId,
      req.body,
      req.user,
      req
    );

    return sendSuccess(res, dispute, 201);
  } catch (err) {
    next(err);
  }
}

async function getDisputes(req, res, next) {
  try {
    const { dealId } = req.params;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }

    const disputes = await dealService.getDealDisputes(dealId);
    return sendSuccess(res, disputes, 200);
  } catch (err) {
    next(err);
  }
}

async function getFulfillment(req, res, next) {
  try {
    const { dealId } = req.params;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }

    const result = await fulfillmentService.getDealFulfillments(dealId);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function addFulfillment(req, res, next) {
  try {
    const { dealId } = req.params;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }

    const fulfillment = await fulfillmentService.createFulfillmentObligation(
      dealId,
      req.body,
      req.user,
      req
    );

    return sendSuccess(res, fulfillment, 201);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createDeal,
  getDeals,
  listDeals,
  getDealById,
  getDeal: getDealById,
  updateDeal,
  cancelDeal,
  agreeDeal,
  getDealAgreement,
  getDealTimeline,
  getProposals,
  createProposal,
  getMou,
  generateMou,
  getCompletion,
  completeDeal,
  createDispute,
  getDisputes,
  getFulfillment,
  addFulfillment,
};
