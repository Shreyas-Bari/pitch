const fulfillmentService = require('../services/fulfillmentService');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

/**
 * Fulfillment Controller
 * Source: docs/PITCH_API_FINAL.md Section 16
 */

/**
 * GET /api/v1/deals/:dealId/fulfillment
 */
async function getDealFulfillment(req, res, next) {
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
async function addDealFulfillment(req, res, next) {
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

/**
 * PATCH /api/v1/fulfillment/:fulfillmentId
 */
async function updateFulfillment(req, res, next) {
  try {
    const { fulfillmentId } = req.params;
    if (!fulfillmentId || !mongoose.Types.ObjectId.isValid(fulfillmentId)) {
      return next(ApiError.badRequest('Invalid fulfillment ID format', null, 'INVALID_ID'));
    }

    const updated = await fulfillmentService.updateFulfillment(
      fulfillmentId,
      req.body,
      req.user,
      req
    );

    return sendSuccess(res, updated, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/fulfillment/:fulfillmentId/complete
 */
async function completeFulfillment(req, res, next) {
  try {
    const { fulfillmentId } = req.params;
    if (!fulfillmentId || !mongoose.Types.ObjectId.isValid(fulfillmentId)) {
      return next(ApiError.badRequest('Invalid fulfillment ID format', null, 'INVALID_ID'));
    }

    const completed = await fulfillmentService.completeFulfillmentObligation(
      fulfillmentId,
      req.user,
      req
    );

    return sendSuccess(res, completed, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/fulfillment/:fulfillmentId/evidence
 */
async function addEvidence(req, res, next) {
  try {
    const { fulfillmentId } = req.params;
    if (!fulfillmentId || !mongoose.Types.ObjectId.isValid(fulfillmentId)) {
      return next(ApiError.badRequest('Invalid fulfillment ID format', null, 'INVALID_ID'));
    }

    const evidence = await fulfillmentService.addEvidence(
      fulfillmentId,
      req.body,
      req.user,
      req
    );

    return sendSuccess(res, evidence, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/fulfillment/:fulfillmentId/evidence
 */
async function getEvidence(req, res, next) {
  try {
    const { fulfillmentId } = req.params;
    if (!fulfillmentId || !mongoose.Types.ObjectId.isValid(fulfillmentId)) {
      return next(ApiError.badRequest('Invalid fulfillment ID format', null, 'INVALID_ID'));
    }

    const evidenceList = await fulfillmentService.getEvidence(fulfillmentId);
    return sendSuccess(res, evidenceList, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDealFulfillment,
  addDealFulfillment,
  updateFulfillment,
  completeFulfillment,
  addEvidence,
  getEvidence,
};
