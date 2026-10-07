const morgan = require('morgan');
const { env } = require('../config/env');

/**
 * HTTP request logging middleware.
 * Uses morgan:
 * - 'dev' format for local development
 * - 'combined' standard Apache combined format for production
 * - skipped in test mode to maintain clean test output
 */
const loggerMiddleware = morgan(
  env.NODE_ENV === 'production' ? 'combined' : 'dev',
  {
    skip: () => env.NODE_ENV === 'test',
  }
);

module.exports = loggerMiddleware;
