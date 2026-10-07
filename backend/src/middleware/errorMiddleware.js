const ApiError = require('../utils/apiError');
const { sendError } = require('../utils/apiResponse');
const { env } = require('../config/env');

/**
 * 404 Not Found Middleware
 * Triggered when no previous route handled the HTTP request.
 */
function notFoundHandler(req, res, _next) {
  return sendError(
    res,
    {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
    404
  );
}

/**
 * Centralized Error-Handling Middleware
 * Conforms to docs/PITCH_API_FINAL.md Section 23 & docs/PITCH_FINAL_BUILD_SPEC.md.
 * Ensures standard error JSON structure:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "Human readable message",
 *     "details": { ... }
 *   }
 * }
 */
function errorHandler(err, _req, res, _next) {
  // Log unexpected internal errors only in non-test modes (skip client 4xx errors)
  const isClientError = (err.statusCode && err.statusCode < 500) || (err instanceof SyntaxError && err.status === 400);
  if (process.env.NODE_ENV !== 'test' && !isClientError && (!err.isOperational || err.statusCode >= 500)) {
    console.error('[PITCH Error]', err.stack || err.message);
  }

  // 1. Handled operational ApiError
  if (err instanceof ApiError) {
    return sendError(
      res,
      {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      err.statusCode
    );
  }

  // 2. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const details = {};
    if (err.errors) {
      for (const [field, errorObj] of Object.entries(err.errors)) {
        details[field] = errorObj.message;
      }
    }
    return sendError(
      res,
      {
        code: 'VALIDATION_ERROR',
        message: err.message || 'Validation failed',
        details: Object.keys(details).length > 0 ? details : null,
      },
      400
    );
  }

  // 3. Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    return sendError(
      res,
      {
        code: 'INVALID_ID_FORMAT',
        message: `Invalid identifier for field "${err.path}": ${err.value}`,
      },
      400
    );
  }

  // 4. MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    return sendError(
      res,
      {
        code: 'DUPLICATE_KEY_ERROR',
        message: `A duplicate entry already exists for: ${fields}`,
        details: err.keyValue,
      },
      409
    );
  }

  // 5. JSON Syntax Error (Malformed JSON payload)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(
      res,
      {
        code: 'MALFORMED_JSON',
        message: 'Malformed JSON payload in request body',
      },
      400
    );
  }

  // 6. Generic or Unhandled Errors (500)
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = env.NODE_ENV === 'production';
  const message = isProduction && statusCode === 500
    ? 'Internal server error'
    : err.message || 'Internal server error';

  const errorPayload = {
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message,
  };

  // Attach stack trace only in development
  if (!isProduction && err.stack) {
    errorPayload.details = { stack: err.stack };
  }

  return sendError(res, errorPayload, statusCode);
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
