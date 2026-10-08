const adminService = require('../services/adminService');
const reportService = require('../services/reportService');
const auditService = require('../services/auditService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

/**
 * Admin Controller
 * Source: docs/PITCH_API_FINAL.md Section 20
 */

// --- Users ---
async function getUsers(req, res, next) {
  try {
    const result = await adminService.getUsers(req.query);
    return res.status(200).json({
      success: true,
      data: {
        users: result.data,
      },
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return next(ApiError.badRequest('Invalid user ID format', null, 'INVALID_ID'));
    }

    const user = await adminService.getUserById(userId);
    return sendSuccess(res, { user, ...user }, 200);
  } catch (err) {
    next(err);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return next(ApiError.badRequest('Invalid user ID format', null, 'INVALID_ID'));
    }
    if (!status) {
      return next(ApiError.badRequest('Status is required', null, 'VALIDATION_ERROR'));
    }

    const updated = await adminService.updateUserStatus(userId, status, req.user, req);
    return sendSuccess(res, { user: updated, ...updated }, 200);
  } catch (err) {
    next(err);
  }
}

// --- Events ---
async function getEvents(req, res, next) {
  try {
    const result = await adminService.getEvents(req.query);
    return sendPaginated(res, result.data, result.pagination, 200);
  } catch (err) {
    next(err);
  }
}

async function updateEventStatus(req, res, next) {
  try {
    const { eventId } = req.params;
    const { status } = req.body;
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return next(ApiError.badRequest('Invalid event ID format', null, 'INVALID_ID'));
    }
    if (!status) {
      return next(ApiError.badRequest('Status is required', null, 'VALIDATION_ERROR'));
    }

    const updated = await adminService.updateEventStatus(eventId, status, req.user, req);
    return sendSuccess(res, updated, 200);
  } catch (err) {
    next(err);
  }
}

// --- Deals ---
async function getDeals(req, res, next) {
  try {
    const result = await adminService.getDeals(req.query);
    return sendPaginated(res, result.data, result.pagination, 200);
  } catch (err) {
    next(err);
  }
}

async function getDeal(req, res, next) {
  try {
    const { dealId } = req.params;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return next(ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID'));
    }

    const result = await adminService.getDealInspector(dealId);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

// --- Reports ---
async function getReports(req, res, next) {
  try {
    const result = await reportService.listAllReports(req.query);
    return sendPaginated(res, result.data, result.pagination, 200);
  } catch (err) {
    next(err);
  }
}

async function getReport(req, res, next) {
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

async function updateReport(req, res, next) {
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

// --- Analytics ---
async function getAnalyticsOverview(_req, res, next) {
  try {
    const stats = await adminService.getAnalyticsOverview();
    return sendSuccess(res, stats, 200);
  } catch (err) {
    next(err);
  }
}

async function getAnalyticsEvents(_req, res, next) {
  try {
    const stats = await adminService.getAnalyticsEvents();
    return sendSuccess(res, stats, 200);
  } catch (err) {
    next(err);
  }
}

async function getAnalyticsDeals(_req, res, next) {
  try {
    const stats = await adminService.getAnalyticsDeals();
    return sendSuccess(res, stats, 200);
  } catch (err) {
    next(err);
  }
}

async function getAnalyticsUsers(_req, res, next) {
  try {
    const stats = await adminService.getAnalyticsUsers();
    return sendSuccess(res, stats, 200);
  } catch (err) {
    next(err);
  }
}

// --- Audit Logs ---
async function getAuditLogs(req, res, next) {
  try {
    const result = await auditService.getAuditLogs(req.query);
    return res.status(200).json({
      success: true,
      data: {
        logs: result.data,
      },
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  getUser,
  updateUserStatus,
  getEvents,
  updateEventStatus,
  getDeals,
  getDeal,
  getReports,
  getReport,
  updateReport,
  getAnalyticsOverview,
  getAnalyticsEvents,
  getAnalyticsDeals,
  getAnalyticsUsers,
  getAuditLogs,
};
