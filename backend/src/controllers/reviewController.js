const reviewService = require('../services/reviewService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

/**
 * Review Controller
 * Source: docs/PITCH_API_FINAL.md Section 3 & 17
 */

/**
 * POST /api/v1/deals/:dealId/reviews
 */
async function createDealReview(req, res, next) {
  try {
    const { dealId } = req.params;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }

    const review = await reviewService.createDealReview(
      dealId,
      req.body,
      req.user,
      req
    );

    return sendSuccess(res, review, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/deals/:dealId/reviews
 */
async function getDealReviews(req, res, next) {
  try {
    const { dealId } = req.params;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }

    const reviews = await reviewService.getDealReviews(dealId);
    return sendSuccess(res, reviews, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/reviews/:reviewId
 */
async function updateReview(req, res, next) {
  try {
    const { reviewId } = req.params;
    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return next(ApiError.badRequest('Invalid review ID format', null, 'INVALID_ID'));
    }

    const updated = await reviewService.updateReview(
      reviewId,
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
 * GET /api/v1/companies/:companyId/reviews
 */
async function getCompanyReviews(req, res, next) {
  try {
    const { companyId } = req.params;
    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      return next(ApiError.badRequest('Invalid company ID format', null, 'INVALID_ID'));
    }

    const result = await reviewService.getOrganizationReviews('COMPANY', companyId, req.query);
    return res.status(200).json({
      success: true,
      data: result.reviews,
      summary: result.summary,
      pagination: {
        ...result.pagination,
        summary: result.summary,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/committees/:committeeId/reviews
 */
async function getCommitteeReviews(req, res, next) {
  try {
    const { committeeId } = req.params;
    if (!committeeId || !mongoose.Types.ObjectId.isValid(committeeId)) {
      return next(ApiError.badRequest('Invalid committee ID format', null, 'INVALID_ID'));
    }

    const result = await reviewService.getOrganizationReviews('COMMITTEE', committeeId, req.query);
    return res.status(200).json({
      success: true,
      data: result.reviews,
      summary: result.summary,
      pagination: {
        ...result.pagination,
        summary: result.summary,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/companies/:companyId/verified-history
 */
async function getCompanyVerifiedHistory(req, res, next) {
  try {
    const { companyId } = req.params;
    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      return next(ApiError.badRequest('Invalid company ID format', null, 'INVALID_ID'));
    }

    const result = await reviewService.getVerifiedHistory('COMPANY', companyId, req.query);
    return res.status(200).json({
      success: true,
      data: result.verifiedHistory,
      summary: result.summary,
      pagination: {
        ...result.pagination,
        summary: result.summary,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/committees/:committeeId/verified-history
 */
async function getCommitteeVerifiedHistory(req, res, next) {
  try {
    const { committeeId } = req.params;
    if (!committeeId || !mongoose.Types.ObjectId.isValid(committeeId)) {
      return next(ApiError.badRequest('Invalid committee ID format', null, 'INVALID_ID'));
    }

    const result = await reviewService.getVerifiedHistory('COMMITTEE', committeeId, req.query);
    return res.status(200).json({
      success: true,
      data: result.verifiedHistory,
      summary: result.summary,
      pagination: {
        ...result.pagination,
        summary: result.summary,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createDealReview,
  getDealReviews,
  updateReview,
  getCompanyReviews,
  getCommitteeReviews,
  getCompanyVerifiedHistory,
  getCommitteeVerifiedHistory,
};
