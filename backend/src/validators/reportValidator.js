const { REPORT_TARGET_TYPE, REPORT_STATUS } = require('../utils/constants');

/**
 * Report Functional Validators
 * Source: docs/PITCH_API_FINAL.md Section 21 & docs/PITCH_DATABASE_FINAL.md Section 28
 */

function validateCreateReport(body = {}) {
  const errors = {};
  if (
    !body.targetType ||
    !Object.values(REPORT_TARGET_TYPE).includes(body.targetType)
  ) {
    errors.targetType =
      'Valid report targetType is required (' +
      Object.values(REPORT_TARGET_TYPE).join(', ') +
      ')';
  }
  if (
    !body.targetId ||
    typeof body.targetId !== 'string' ||
    !/^[0-9a-fA-F]{24}$/.test(body.targetId)
  ) {
    errors.targetId = 'Target ID must be a valid ObjectId';
  }
  if (
    !body.reason ||
    typeof body.reason !== 'string' ||
    body.reason.trim().length < 3
  ) {
    errors.reason = 'Report reason is required and must be at least 3 characters';
  }
  return errors;
}

function validateUpdateReportStatus(body = {}) {
  const errors = {};
  if (!body.status || !Object.values(REPORT_STATUS).includes(body.status)) {
    errors.status = 'Valid report status is required';
  }
  return errors;
}

module.exports = {
  validateCreateReport,
  validateUpdateReportStatus,
};
