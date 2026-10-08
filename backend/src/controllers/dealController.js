const dealService = require('../services/dealService');
const fulfillmentService = require('../services/fulfillmentService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

/**
 * Deal Controller
 * Source: docs/PITCH_API_FINAL.md Section 16 & 17
 */

/**
 * GET /api/v1/deals
 */
async function listDeals(req, res, next) {
  try {
    const result = await dealService.listDeals(req.query);
    return sendPaginated(res, result.data, result.pagination, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/deals/:dealId
 */
async function getDeal(req, res, next) {
  try {
    const { dealId } = req.params;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }

    const deal = await dealService.getDealById(dealId);
    return sendSuccess(res, deal, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/deals/:dealId/completion
 */
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

/**
 * POST /api/v1/deals/:dealId/complete
 */
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

/**
 * POST /api/v1/deals/:dealId/dispute
 */
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

/**
 * GET /api/v1/deals/:dealId/disputes
 */
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

/**
 * GET /api/v1/deals/:dealId/fulfillment
 */
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

/**
 * POST /api/v1/deals/:dealId/fulfillment
 */
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
  listDeals,
  getDeal,
  getCompletion,
  completeDeal,
  createDispute,
  getDisputes,
  getFulfillment,
  addFulfillment,
};
