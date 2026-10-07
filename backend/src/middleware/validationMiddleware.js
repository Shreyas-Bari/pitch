const ApiError = require('../utils/apiError');

/**
 * Reusable Request Validation Foundation Middleware.
 * Supports functional validators, schema definitions, or custom validator objects
 * across req.body, req.query, and req.params.
 *
 * Example usage:
 * validateRequest({
 *   body: (body) => {
 *     const errors = {};
 *     if (!body.email) errors.email = 'Email is required';
 *     return errors;
 *   }
 * })
 */
function validateRequest(options = {}) {
  return (req, _res, next) => {
    const allErrors = {};

    // Validate body
    if (options.body) {
      if (typeof options.body === 'function') {
        const errors = options.body(req.body);
        if (errors && Object.keys(errors).length > 0) {
          allErrors.body = errors;
        }
      } else if (typeof options.body.validate === 'function') {
        // Support Joi / Zod style validator objects if present
        const result = options.body.validate(req.body);
        if (result && result.error) {
          allErrors.body = result.error.details || result.error.message;
        }
      }
    }

    // Validate query
    if (options.query) {
      if (typeof options.query === 'function') {
        const errors = options.query(req.query);
        if (errors && Object.keys(errors).length > 0) {
          allErrors.query = errors;
        }
      }
    }

    // Validate params
    if (options.params) {
      if (typeof options.params === 'function') {
        const errors = options.params(req.params);
        if (errors && Object.keys(errors).length > 0) {
          allErrors.params = errors;
        }
      }
    }

    // If any validation errors exist, call error handler with standard validation error
    if (Object.keys(allErrors).length > 0) {
      const flattenedErrors = {};
      for (const [scope, errs] of Object.entries(allErrors)) {
        if (typeof errs === 'object') {
          for (const [key, msg] of Object.entries(errs)) {
            flattenedErrors[`${scope}.${key}`] = msg;
          }
        } else {
          flattenedErrors[scope] = errs;
        }
      }

      return next(
        new ApiError(
          400,
          'Validation failed',
          'VALIDATION_ERROR',
          flattenedErrors
        )
      );
    }

    next();
  };
}

module.exports = {
  validateRequest,
  validate: validateRequest,
};
