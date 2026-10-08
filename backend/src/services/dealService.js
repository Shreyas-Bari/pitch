const { Deal, Fulfillment, Dispute, Report, Company, Committee, Event } = require('../models');
const { DEAL_STATUS, FULFILLMENT_STATUS, NOTIFICATION_TYPE, ROLES } = require('../utils/constants');
const ApiError = require('../utils/apiError');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const fulfillmentService = require('./fulfillmentService');

/**
 * Deal Post-Agreement & Completion Service
 * Source: docs/PITCH_DATABASE_FINAL.md Section 16, docs/PITCH_API_FINAL.md Section 17 & 21
 */

/**
 * Retrieve a deal with detailed associations.
 */
async function getDealById(dealId) {
  const deal = await Deal.findById(dealId)
    .populate('eventId')
    .populate('companyId')
    .populate('committeeId')
    .lean();

  if (!deal) {
    throw ApiError.notFound('Deal not found', null, 'DEAL_NOT_FOUND');
  }

  return deal;
}

/**
 * List deals with optional filters and pagination.
 */
async function listDeals({
  page = 1,
  limit = 20,
  status,
  companyId,
  committeeId,
  eventId,
} = {}) {
  const query = {};
  if (status) query.status = status;
  if (companyId) query.companyId = companyId;
  if (committeeId) query.committeeId = committeeId;
  if (eventId) query.eventId = eventId;

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (numericPage - 1) * numericLimit;

  const [total, deals] = await Promise.all([
    Deal.countDocuments(query),
    Deal.find(query)
      .populate('companyId', 'companyName logoFileId')
      .populate('committeeId', 'committeeName collegeName logoFileId')
      .populate('eventId', 'title startDate endDate locationMode')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(numericLimit)
      .lean(),
  ]);

  return {
    data: deals,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1,
    },
  };
}

/**
 * Get completion status & fulfillment health for a deal.
 */
async function getCompletionStatus(dealId) {
  const deal = await Deal.findById(dealId);
  if (!deal) {
    throw ApiError.notFound('Deal not found', null, 'DEAL_NOT_FOUND');
  }

  const { fulfillments, summary } = await fulfillmentService.getDealFulfillments(dealId);

  const pendingObligations = summary.pending + summary.inProgress + summary.disputed;
  const isFulfilled = summary.total > 0 && pendingObligations === 0;
  const isCompleted = deal.status === DEAL_STATUS.COMPLETED;
  const canComplete =
    [DEAL_STATUS.EXECUTED, DEAL_STATUS.FULFILLMENT, DEAL_STATUS.DISPUTED].includes(deal.status) &&
    !isCompleted;

  return {
    dealId: deal._id,
    dealStatus: deal.status,
    isCompleted,
    completedAt: deal.completedAt,
    canComplete,
    fulfillmentProgress: summary.progressPercentage,
    obligationsCount: summary.total,
    completedObligationsCount: summary.completed,
    pendingObligations,
    isFullyFulfilled: isFulfilled,
    summary,
  };
}

/**
 * Complete a deal.
 * Requires obligations to be fulfilled or explicit confirmIncomplete = true.
 */
async function completeDeal(dealId, { confirmIncomplete = false, notes = '' } = {}, user, req = null) {
  const deal = await Deal.findById(dealId);
  if (!deal) {
    throw ApiError.notFound('Deal not found', null, 'DEAL_NOT_FOUND');
  }

  // Check state machine transition validity
  if (deal.status === DEAL_STATUS.COMPLETED) {
    throw ApiError.badRequest('Deal is already marked as COMPLETED.', null, 'DEAL_ALREADY_COMPLETED');
  }

  if (!deal.canTransitionTo(DEAL_STATUS.COMPLETED)) {
    throw ApiError.badRequest(
      `Cannot transition deal from "${deal.status}" to "COMPLETED". Deal must be EXECUTED, FULFILLMENT, or DISPUTED.`,
      null,
      'INVALID_DEAL_STATE'
    );
  }

  // Check fulfillment obligations
  const { summary } = await fulfillmentService.getDealFulfillments(dealId);
  const pendingObligations = summary.pending + summary.inProgress + summary.disputed;

  if (pendingObligations > 0 && !confirmIncomplete) {
    throw ApiError.badRequest(
      `Deal has ${pendingObligations} unfulfilled obligation(s). To proceed anyway, specify confirmIncomplete: true.`,
      {
        pendingObligations,
        totalObligations: summary.total,
        completedObligations: summary.completed,
      },
      'OBLIGATIONS_PENDING'
    );
  }

  // Update status and timestamp
  deal.status = DEAL_STATUS.COMPLETED;
  deal.completedAt = new Date();
  await deal.save();

  // Find participants to notify
  const [company, committee] = await Promise.all([
    Company.findById(deal.companyId),
    Committee.findById(deal.committeeId),
  ]);

  if (company?.userId) {
    await notificationService.createNotification({
      recipientUserId: company.userId,
      type: NOTIFICATION_TYPE.DEAL_COMPLETED,
      title: 'Deal Completed',
      message: 'Your deal has been marked as COMPLETED. You can now leave a review!',
      entityType: 'DEAL',
      entityId: deal._id,
    });
  }

  if (committee?.userId) {
    await notificationService.createNotification({
      recipientUserId: committee.userId,
      type: NOTIFICATION_TYPE.DEAL_COMPLETED,
      title: 'Deal Completed',
      message: 'Your deal has been marked as COMPLETED. You can now leave a review!',
      entityType: 'DEAL',
      entityId: deal._id,
    });
  }

  // Audit log
  await auditService.logAction({
    actorUserId: user._id,
    action: 'DEAL_COMPLETED',
    entityType: 'DEAL',
    entityId: deal._id,
    metadata: {
      dealId: deal._id,
      confirmIncomplete,
      notes,
      completedAt: deal.completedAt,
    },
    req,
  });

  return deal;
}

/**
 * Open a dispute on a deal.
 */
async function createDealDispute(dealId, { reason, description, evidence = [] } = {}, user, req = null) {
  const deal = await Deal.findById(dealId);
  if (!deal) {
    throw ApiError.notFound('Deal not found', null, 'DEAL_NOT_FOUND');
  }

  if (deal.status === DEAL_STATUS.COMPLETED) {
    throw ApiError.badRequest('Cannot dispute a completed deal.', null, 'DEAL_ALREADY_COMPLETED');
  }

  if (!deal.canTransitionTo(DEAL_STATUS.DISPUTED)) {
    throw ApiError.badRequest(
      `Cannot transition deal from "${deal.status}" to "DISPUTED".`,
      null,
      'INVALID_DEAL_STATE'
    );
  }

  // Transition deal to DISPUTED
  deal.status = DEAL_STATUS.DISPUTED;
  await deal.save();

  // Create Dispute record
  const dispute = await Dispute.create({
    dealId,
    reportedByUserId: user._id,
    reason,
    description,
    evidence,
    status: 'OPEN',
  });

  // Create Report record linked to DEAL
  await Report.create({
    reporterUserId: user._id,
    targetType: 'DEAL',
    targetId: dealId,
    reason,
    description,
    status: 'OPEN',
  });

  // Notify counterparty
  const [company, committee] = await Promise.all([
    Company.findById(deal.companyId),
    Committee.findById(deal.committeeId),
  ]);

  const otherUserId =
    company?.userId && !company.userId.equals(user._id)
      ? company.userId
      : committee?.userId && !committee.userId.equals(user._id)
      ? committee.userId
      : null;

  if (otherUserId) {
    await notificationService.createNotification({
      recipientUserId: otherUserId,
      type: NOTIFICATION_TYPE.DISPUTE_CREATED,
      title: 'Deal Disputed',
      message: `A dispute has been submitted for your deal: ${reason}`,
      entityType: 'DISPUTE',
      entityId: dispute._id,
    });
  }

  // Audit log
  await auditService.logAction({
    actorUserId: user._id,
    action: 'DEAL_DISPUTED',
    entityType: 'DEAL',
    entityId: deal._id,
    metadata: {
      disputeId: dispute._id,
      reason,
      description,
    },
    req,
  });

  return dispute;
}

/**
 * Get disputes for a deal.
 */
async function getDealDisputes(dealId) {
  const disputes = await Dispute.find({ dealId })
    .populate('reportedByUserId', 'name email role')
    .sort({ createdAt: -1 })
    .lean();

  return disputes;
}

module.exports = {
  getDealById,
  listDeals,
  getCompletionStatus,
  completeDeal,
  createDealDispute,
  getDealDisputes,
};
