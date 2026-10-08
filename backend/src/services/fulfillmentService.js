const { Fulfillment, FulfillmentEvidence, Deal, Company, Committee } = require('../models');
const { FULFILLMENT_STATUS, DEAL_STATUS, NOTIFICATION_TYPE, ROLES } = require('../utils/constants');
const ApiError = require('../utils/apiError');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

/**
 * Fulfillment Service
 * Source: docs/PITCH_DATABASE_FINAL.md Section 22 & 23, docs/PITCH_API_FINAL.md Section 16
 * Handles obligations, partial deliveries, non-cash sponsorships, status transitions, and evidence.
 */

/**
 * Calculate progress metrics for a list of fulfillments.
 */
function calculateFulfillmentSummary(fulfillments = []) {
  const total = fulfillments.length;
  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      disputed: 0,
      progressPercentage: 100, // No obligations = fully ready
      byParty: {
        COMPANY: { total: 0, completed: 0 },
        COMMITTEE: { total: 0, completed: 0 },
      },
    };
  }

  let completed = 0;
  let inProgress = 0;
  let pending = 0;
  let disputed = 0;

  const byParty = {
    COMPANY: { total: 0, completed: 0 },
    COMMITTEE: { total: 0, completed: 0 },
  };

  for (const f of fulfillments) {
    if (f.status === FULFILLMENT_STATUS.COMPLETED) completed++;
    else if (f.status === FULFILLMENT_STATUS.IN_PROGRESS) inProgress++;
    else if (f.status === FULFILLMENT_STATUS.PENDING) pending++;
    else if (f.status === FULFILLMENT_STATUS.DISPUTED) disputed++;

    const party = f.responsibleParty;
    if (byParty[party]) {
      byParty[party].total++;
      if (f.status === FULFILLMENT_STATUS.COMPLETED) {
        byParty[party].completed++;
      }
    }
  }

  const progressPercentage = Math.round((completed / total) * 100);

  return {
    total,
    completed,
    inProgress,
    pending,
    disputed,
    progressPercentage,
    byParty,
  };
}

/**
 * Get all fulfillment obligations for a deal.
 */
async function getDealFulfillments(dealId) {
  const fulfillments = await Fulfillment.find({ dealId })
    .sort({ dueDate: 1, createdAt: 1 })
    .lean();

  const summary = calculateFulfillmentSummary(fulfillments);

  return {
    fulfillments,
    summary,
  };
}

/**
 * Add a new fulfillment obligation to a deal.
 */
async function createFulfillmentObligation(dealId, payload, user, req = null) {
  const deal = await Deal.findById(dealId);
  if (!deal) {
    throw ApiError.notFound('Deal not found', null, 'DEAL_NOT_FOUND');
  }

  // Only allow adding fulfillment obligations if deal is in an active/signed state
  const allowedStatuses = [
    DEAL_STATUS.AGREED,
    DEAL_STATUS.AWAITING_SIGNATURES,
    DEAL_STATUS.PARTIALLY_SIGNED,
    DEAL_STATUS.EXECUTED,
    DEAL_STATUS.FULFILLMENT,
    DEAL_STATUS.DISPUTED,
  ];

  if (!allowedStatuses.includes(deal.status)) {
    throw ApiError.badRequest(
      `Cannot add fulfillment obligation to deal in status "${deal.status}". Deal must be executed or active.`,
      null,
      'INVALID_DEAL_STATE'
    );
  }

  // If deal is EXECUTED and transitioning to FULFILLMENT
  if (deal.status === DEAL_STATUS.EXECUTED) {
    deal.status = DEAL_STATUS.FULFILLMENT;
    await deal.save();
  }

  const fulfillment = await Fulfillment.create({
    dealId,
    responsibleParty: payload.responsibleParty,
    type: payload.type,
    description: payload.description,
    quantity: payload.quantity !== undefined ? payload.quantity : 1,
    unit: payload.unit || 'units',
    dueDate: payload.dueDate || null,
    status: payload.status || FULFILLMENT_STATUS.PENDING,
  });

  // Audit log
  await auditService.logAction({
    actorUserId: user._id,
    action: 'FULFILLMENT_CREATED',
    entityType: 'FULFILLMENT',
    entityId: fulfillment._id,
    metadata: {
      dealId,
      type: payload.type,
      responsibleParty: payload.responsibleParty,
      description: payload.description,
    },
    req,
  });

  return fulfillment;
}

/**
 * Update an existing fulfillment obligation.
 */
async function updateFulfillment(fulfillmentId, updates, user, req = null) {
  const fulfillment = await Fulfillment.findById(fulfillmentId);
  if (!fulfillment) {
    throw ApiError.notFound('Fulfillment obligation not found', null, 'FULFILLMENT_NOT_FOUND');
  }

  const deal = await Deal.findById(fulfillment.dealId);
  if (!deal) {
    throw ApiError.notFound('Associated deal not found', null, 'DEAL_NOT_FOUND');
  }

  // Handle status completion timestamp
  if (updates.status === FULFILLMENT_STATUS.COMPLETED && !fulfillment.completedAt) {
    updates.completedAt = new Date();
  } else if (updates.status && updates.status !== FULFILLMENT_STATUS.COMPLETED) {
    updates.completedAt = null;
  }

  Object.assign(fulfillment, updates);
  await fulfillment.save();

  // Audit log
  await auditService.logAction({
    actorUserId: user._id,
    action: 'FULFILLMENT_UPDATED',
    entityType: 'FULFILLMENT',
    entityId: fulfillment._id,
    metadata: {
      dealId: fulfillment.dealId,
      updates,
    },
    req,
  });

  return fulfillment;
}

/**
 * Mark a fulfillment obligation as completed.
 */
async function completeFulfillmentObligation(fulfillmentId, user, req = null) {
  const fulfillment = await Fulfillment.findById(fulfillmentId);
  if (!fulfillment) {
    throw ApiError.notFound('Fulfillment obligation not found', null, 'FULFILLMENT_NOT_FOUND');
  }

  fulfillment.status = FULFILLMENT_STATUS.COMPLETED;
  fulfillment.completedAt = new Date();
  await fulfillment.save();

  // Audit log
  await auditService.logAction({
    actorUserId: user._id,
    action: 'FULFILLMENT_COMPLETED',
    entityType: 'FULFILLMENT',
    entityId: fulfillment._id,
    metadata: {
      dealId: fulfillment.dealId,
      completedAt: fulfillment.completedAt,
    },
    req,
  });

  return fulfillment;
}

/**
 * Add evidence to a fulfillment obligation.
 */
async function addEvidence(fulfillmentId, { fileId, description = '' }, user, req = null) {
  const fulfillment = await Fulfillment.findById(fulfillmentId);
  if (!fulfillment) {
    throw ApiError.notFound('Fulfillment obligation not found', null, 'FULFILLMENT_NOT_FOUND');
  }

  const evidence = await FulfillmentEvidence.create({
    fulfillmentId,
    uploadedByUserId: user._id,
    fileId,
    description,
  });

  // Audit log
  await auditService.logAction({
    actorUserId: user._id,
    action: 'FULFILLMENT_EVIDENCE_ADDED',
    entityType: 'FULFILLMENT_EVIDENCE',
    entityId: evidence._id,
    metadata: {
      fulfillmentId,
      fileId,
      description,
    },
    req,
  });

  return evidence;
}

/**
 * Get all evidence for a fulfillment obligation.
 */
async function getEvidence(fulfillmentId) {
  const fulfillment = await Fulfillment.findById(fulfillmentId);
  if (!fulfillment) {
    throw ApiError.notFound('Fulfillment obligation not found', null, 'FULFILLMENT_NOT_FOUND');
  }

  const evidenceList = await FulfillmentEvidence.find({ fulfillmentId })
    .populate('uploadedByUserId', 'name email role')
    .populate('fileId')
    .sort({ createdAt: -1 })
    .lean();

  return evidenceList;
}

module.exports = {
  calculateFulfillmentSummary,
  getDealFulfillments,
  createFulfillmentObligation,
  updateFulfillment,
  completeFulfillmentObligation,
  addEvidence,
  getEvidence,
};
