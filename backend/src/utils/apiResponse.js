/**
 * Standardized API Response Utilities
 * Source of Truth: docs/PITCH_API_FINAL.md Section 23
 */

/**
 * Standard success response helper
 * {
 *   success: true,
 *   data: { ... }
 * }
 */
function sendSuccess(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Standard paginated list response helper
 * {
 *   success: true,
 *   data: [ ... ],
 *   pagination: { page, limit, total, totalPages }
 * }
 */
function sendPaginated(res, data = [], pagination = {}, statusCode = 200) {
  const page = parseInt(pagination.page, 10) || 1;
  const limit = parseInt(pagination.limit, 10) || 20;
  const total = parseInt(pagination.total, 10) || (Array.isArray(data) ? data.length : 0);
  const totalPages = pagination.totalPages || Math.ceil(total / limit) || 1;

  return res.status(statusCode).json({
    success: true,
    data: Array.isArray(data) ? data : [],
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}

/**
 * Standard error response helper
 * {
 *   success: false,
 *   error: {
 *     code: "VALIDATION_ERROR",
 *     message: "...",
 *     details: { ... }
 *   }
 * }
 */
function sendError(res, errorData = {}, statusCode = 500) {
  const code = errorData.code || 'INTERNAL_SERVER_ERROR';
  const message = errorData.message || 'An unexpected error occurred';
  const details = errorData.details !== undefined ? errorData.details : null;

  const payload = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details !== null && details !== undefined) {
    payload.error.details = details;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  sendSuccess,
  sendPaginated,
  sendError,
};
