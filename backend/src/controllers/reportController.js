const reportService = require('../services/reportService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

/**
 * Report Controller
 * Source: docs/PITCH_API_FINAL.md Section 21
 */

/**
 * POST /api/v1/reports
 */
async function createReport(req, res, next) {
  try {
    const report = await reportService.createReport(req.body, req.user, req);
    return sendSuccess(res, report, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/reports/me
 */
async function getMyReports(req, res, next) {
  try {
    const result = await reportService.getMyReports(req.user._id, req.query);
    return sendPaginated(res, result.data, result.pagination, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/reports/:reportId
 */
async function getReportById(req, res, next) {
  try {
    const { reportId } = req.params;
    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
      return next(ApiError.badRequest('Invalid report ID format', null, 'INVALID_ID'));
    }

    const report = await reportService.getReportById(reportId, req.user);
    return sendSuccess(res, report, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/admin/reports
 */
async function listAllReports(req, res, next) {
  try {
    const result = await reportService.listAllReports(req.query);
    return sendPaginated(res, result.data, result.pagination, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/admin/reports/:reportId
 */
async function updateReportStatus(req, res, next) {
  try {
    const { reportId } = req.params;
    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
      return next(ApiError.badRequest('Invalid report ID format', null, 'INVALID_ID'));
    }

    const updated = await reportService.updateReportStatus(
      reportId,
      req.body,
      req.user,
      req
    );

    return sendSuccess(res, updated, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReport,
  getMyReports,
  getReportById,
  listAllReports,
  updateReportStatus,
};
