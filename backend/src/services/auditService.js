const { AuditLog } = require('../models');

/**
 * Audit Logging Service
 * Source: docs/PITCH_DATABASE_FINAL.md Section 29 & docs/PITCH_FINAL_BUILD_SPEC.md Section 28 / Step 28
 * Append-only immutable log for all critical platform actions.
 * Redacts sensitive credentials (passwords, tokens, keys) before persistence.
 */

// Keys to recursively redact from audit metadata
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'refreshtoken',
  'accesstoken',
  'token',
  'jwt',
  'secret',
  'authorization',
  'cookie',
  'cookies',
  'creditcard',
]);

/**
 * Deep-clean metadata object to remove any sensitive secrets.
 */
function sanitizeMetadata(obj, depth = 0) {
  if (!obj || depth > 5) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeMetadata(item, depth + 1));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      cleaned[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      cleaned[key] = sanitizeMetadata(value, depth + 1);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Record an audit log entry.
 *
 * @param {Object} params
 * @param {ObjectId|string} [params.actorUserId=null]
 * @param {string} params.action - e.g. 'USER_LOGIN', 'DEAL_COMPLETED', 'DEAL_DISPUTED'
 * @param {string} [params.entityType=null] - e.g. 'DEAL', 'USER', 'FULFILLMENT'
 * @param {ObjectId|string} [params.entityId=null]
 * @param {Object} [params.metadata={}]
 * @param {Object} [params.req=null] - Optional express request to extract IP/User-Agent
 * @returns {Promise<Object>}
 */
async function logAction({
  actorUserId = null,
  action,
  entityType = null,
  entityId = null,
  metadata = {},
  req = null,
}) {
  try {
    let ipAddress = null;
    let userAgent = null;

    if (req) {
      ipAddress =
        req.ip ||
        req.headers['x-forwarded-for'] ||
        req.connection?.remoteAddress ||
        null;
      userAgent = req.headers['user-agent'] || null;
      if (!actorUserId && req.user?._id) {
        actorUserId = req.user._id;
      }
    }

    const sanitizedMeta = sanitizeMetadata(metadata);

    const logEntry = await AuditLog.create({
      actorUserId,
      action,
      entityType,
      entityId,
      metadata: sanitizedMeta,
      ipAddress,
      userAgent,
    });

    return logEntry;
  } catch (err) {
    console.error('[PITCH AuditLog] Failed to write audit log:', err.message);
    return null;
  }
}

/**
 * Query audit logs with pagination and filters (Admin only).
 */
async function getAuditLogs({
  page = 1,
  limit = 20,
  actorUserId,
  action,
  entityType,
  entityId,
  startDate,
  endDate,
}) {
  const query = {};

  if (actorUserId) query.actorUserId = actorUserId;
  if (action) query.action = action;
  if (entityType) query.entityType = entityType;
  if (entityId) query.entityId = entityId;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (numericPage - 1) * numericLimit;

  const [total, logs] = await Promise.all([
    AuditLog.countDocuments(query),
    AuditLog.find(query)
      .populate('actorUserId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit)
      .lean(),
  ]);

  return {
    data: logs,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1,
    },
  };
}

module.exports = {
  logAction,
  getAuditLogs,
  sanitizeMetadata,
};
