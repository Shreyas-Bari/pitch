const { env } = require('../config/env');
const ApiError = require('../utils/apiError');

// Registry of in-memory stores for reset support in test environments
const rateLimitStores = new Map();

/**
 * Reset all in-memory rate limit counters (useful for unit/integration tests).
 */
function resetRateLimits() {
  for (const store of rateLimitStores.values()) {
    store.clear();
  }
}

/**
 * Create a configurable rate limiter middleware.
 * @param {Object} options
 * @param {string} [options.name] - Identifier for store registry
 * @param {number} [options.windowMs] - Time window in milliseconds
 * @param {number} [options.max] - Max allowed requests within windowMs
 * @param {string} [options.message] - Error message when rate limit is exceeded
 * @param {Function} [options.keyGenerator] - Function returning rate limit identifier (default: client IP)
 * @returns {Function} Express middleware
 */
function createRateLimiter(options = {}) {
  const getWindowMs = () =>
    options.windowMs !== undefined
      ? options.windowMs
      : env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000;

  const getMax = () =>
    options.max !== undefined
      ? options.max
      : env.AUTH_RATE_LIMIT_MAX !== undefined
      ? env.AUTH_RATE_LIMIT_MAX
      : 100;

  const message =
    options.message ||
    'Too many authentication attempts. Please try again later.';

  const keyGenerator =
    options.keyGenerator ||
    ((req) => req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1');

  const hits = new Map();
  rateLimitStores.set(options.name || Symbol(), hits);

  // Periodic cleanup of expired entries
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (record.resetTime <= now) {
        hits.delete(key);
      }
    }
  }, 60000);
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const now = Date.now();
    const windowMs = getWindowMs();
    const max = getMax();
    const key = keyGenerator(req);

    let record = hits.get(key);
    if (!record || record.resetTime <= now) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, max - record.count)
    );
    res.setHeader(
      'X-RateLimit-Reset',
      Math.ceil(record.resetTime / 1000)
    );

    if (record.count > max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((record.resetTime - now) / 1000)
      );
      res.setHeader('Retry-After', retryAfterSeconds);

      return next(
        ApiError.tooManyRequests(
          message,
          { retryAfterSeconds },
          'RATE_LIMIT_EXCEEDED'
        )
      );
    }

    next();
  };
}

// Pre-configured rate limiter for sensitive authentication endpoints
const authRateLimiter = createRateLimiter({
  name: 'authRateLimiter',
  message: 'Too many authentication attempts. Please try again later.',
});

module.exports = {
  createRateLimiter,
  authRateLimiter,
  resetRateLimits,
};
