const { Report, User } = require('../models');
const { REPORT_STATUS, ROLES } = require('../utils/constants');
const ApiError = require('../utils/apiError');
const auditService = require('./auditService');

/**
 * Report & Dispute Resolution Service
 * Source: docs/PITCH_DATABASE_FINAL.md Section 28 & docs/PITCH_API_FINAL.md Section 21
 */

/**
 * Create a new user report.
 */
async function createReport(payload, user, req = null) {
  const report = await Report.create({
    reporterUserId: user._id,
    targetType: payload.targetType,
    targetId: payload.targetId,
    reason: payload.reason,
    description: payload.description || '',
    status: REPORT_STATUS.OPEN,
  });

  await auditService.logAction({
    actorUserId: user._id,
    action: 'REPORT_CREATED',
    entityType: 'REPORT',
    entityId: report._id,
    metadata: {
      targetType: payload.targetType,
      targetId: payload.targetId,
      reason: payload.reason,
    },
    req,
  });

  return report;
}

/**
 * Get reports submitted by the authenticated user.
 */
async function getMyReports(userId, { page = 1, limit = 20, status } = {}) {
  const query = { reporterUserId: userId };
  if (status) query.status = status;

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (numericPage - 1) * numericLimit;

  const [total, reports] = await Promise.all([
    Report.countDocuments(query),
    Report.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit)
      .lean(),
  ]);

  return {
    data: reports,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1,
    },
  };
}

/**
 * Get a report by ID (reporter or admin only).
 */
async function getReportById(reportId, user) {
  const report = await Report.findById(reportId)
    .populate('reporterUserId', 'name email role')
    .populate('resolvedByUserId', 'name email role')
    .lean();

  if (!report) {
    throw ApiError.notFound('Report not found', null, 'REPORT_NOT_FOUND');
  }

  const isReporter =
    report.reporterUserId &&
    (report.reporterUserId._id
      ? report.reporterUserId._id.equals(user._id)
      : report.reporterUserId.toString() === user._id.toString());
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isReporter && !isAdmin) {
    throw ApiError.forbidden(
      'Access denied. You cannot view reports submitted by other users.',
      null,
      'FORBIDDEN'
    );
  }

  return report;
}

/**
 * List all reports across the platform (Admin only).
 */
async function listAllReports({ page = 1, limit = 20, status, targetType } = {}) {
  const query = {};
  if (status) query.status = status;
  if (targetType) query.targetType = targetType;

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (numericPage - 1) * numericLimit;

  const [total, reports] = await Promise.all([
    Report.countDocuments(query),
    Report.find(query)
      .populate('reporterUserId', 'name email role')
      .populate('resolvedByUserId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit)
      .lean(),
  ]);

  return {
    data: reports,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1,
    },
  };
}

/**
 * Update report status / resolve report (Admin only).
 */
async function updateReportStatus(reportId, { status, resolution = '' }, adminUser, req = null) {
  const report = await Report.findById(reportId);
  if (!report) {
    throw ApiError.notFound('Report not found', null, 'REPORT_NOT_FOUND');
  }

  report.status = status;
  if (resolution) report.resolution = resolution;

  if ([REPORT_STATUS.RESOLVED, REPORT_STATUS.DISMISSED].includes(status)) {
    report.resolvedByUserId = adminUser._id;
    report.resolvedAt = new Date();
  }

  await report.save();

  await auditService.logAction({
    actorUserId: adminUser._id,
    action: 'ADMIN_REPORT_STATUS_UPDATE',
    entityType: 'REPORT',
    entityId: report._id,
    metadata: {
      newStatus: status,
      resolution,
      resolvedAt: report.resolvedAt,
    },
    req,
  });

  return report;
}

module.exports = {
  createReport,
  getMyReports,
  getReportById,
  listAllReports,
  updateReportStatus,
};
