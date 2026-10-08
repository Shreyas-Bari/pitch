const {
  User,
  Company,
  Committee,
  Event,
  Deal,
  Fulfillment,
  FulfillmentEvidence,
  Dispute,
  Report,
  Review,
  AuditLog,
} = require('../models');
const { USER_STATUS, EVENT_STATUS, DEAL_STATUS, ROLES } = require('../utils/constants');
const ApiError = require('../utils/apiError');
const auditService = require('./auditService');

/**
 * Admin Service
 * Source: docs/PITCH_API_FINAL.md Section 20 & docs/PITCH_FINAL_BUILD_SPEC.md Step 27
 */

/**
 * List platform users with filters and pagination.
 */
async function getUsers({ page = 1, limit = 20, role, status, search } = {}) {
  const query = {};
  if (role) query.role = role;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (numericPage - 1) * numericLimit;

  const [total, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit)
      .lean(),
  ]);

  return {
    data: users,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1,
    },
  };
}

/**
 * Get user detail with attached profile.
 */
async function getUserById(userId) {
  const user = await User.findById(userId).select('-passwordHash').lean();
  if (!user) {
    throw ApiError.notFound('User not found', null, 'USER_NOT_FOUND');
  }

  let profile = null;
  if (user.role === ROLES.COMPANY) {
    profile = await Company.findOne({ userId }).lean();
  } else if (user.role === ROLES.COMMITTEE) {
    profile = await Committee.findOne({ userId }).lean();
  }

  return {
    ...user,
    profile,
  };
}

/**
 * Update user account status (e.g. SUSPENDED, ACTIVE, DEACTIVATED).
 */
async function updateUserStatus(userId, status, adminUser, req = null) {
  if (!Object.values(USER_STATUS).includes(status)) {
    throw ApiError.badRequest(`Invalid user status: ${status}`, null, 'INVALID_STATUS');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found', null, 'USER_NOT_FOUND');
  }

  const oldStatus = user.status;
  user.status = status;
  if (status === USER_STATUS.DEACTIVATED) {
    user.isActive = false;
  } else if (status === USER_STATUS.ACTIVE) {
    user.isActive = true;
  }
  await user.save();

  await auditService.logAction({
    actorUserId: adminUser._id,
    action: 'ADMIN_USER_STATUS_UPDATE',
    entityType: 'USER',
    entityId: user._id,
    metadata: { oldStatus, newStatus: status },
    req,
  });

  return user.toSafeObject ? user.toSafeObject() : user;
}

/**
 * List platform events with administrative filters.
 */
async function getEvents({ page = 1, limit = 20, status, category, search } = {}) {
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (numericPage - 1) * numericLimit;

  const [total, events] = await Promise.all([
    Event.countDocuments(query),
    Event.find(query)
      .populate('committeeId', 'committeeName collegeName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit)
      .lean(),
  ]);

  return {
    data: events,
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1,
    },
  };
}

/**
 * Administrative event status override (moderation).
 */
async function updateEventStatus(eventId, status, adminUser, req = null) {
  if (!Object.values(EVENT_STATUS).includes(status)) {
    throw ApiError.badRequest(`Invalid event status: ${status}`, null, 'INVALID_STATUS');
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND');
  }

  const oldStatus = event.status;
  event.status = status;
  await event.save();

  await auditService.logAction({
    actorUserId: adminUser._id,
    action: 'ADMIN_EVENT_STATUS_UPDATE',
    entityType: 'EVENT',
    entityId: event._id,
    metadata: { oldStatus, newStatus: status },
    req,
  });

  return event;
}

/**
 * List platform deals across all statuses.
 */
async function getDeals({ page = 1, limit = 20, status, companyId, committeeId } = {}) {
  const query = {};
  if (status) query.status = status;
  if (companyId) query.companyId = companyId;
  if (committeeId) query.committeeId = committeeId;

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (numericPage - 1) * numericLimit;

  const [total, deals] = await Promise.all([
    Deal.countDocuments(query),
    Deal.find(query)
      .populate('companyId', 'companyName industry')
      .populate('committeeId', 'committeeName collegeName')
      .populate('eventId', 'title startDate endDate')
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
 * Inspect a deal with comprehensive related records.
 */
async function getDealInspector(dealId) {
  const deal = await Deal.findById(dealId)
    .populate('companyId')
    .populate('committeeId')
    .populate('eventId')
    .lean();

  if (!deal) {
    throw ApiError.notFound('Deal not found', null, 'DEAL_NOT_FOUND');
  }

  const [fulfillments, disputes, reviews] = await Promise.all([
    Fulfillment.find({ dealId }).lean(),
    Dispute.find({ dealId }).populate('reportedByUserId', 'name email role').lean(),
    Review.find({ dealId }).populate('reviewerUserId', 'name role').lean(),
  ]);

  return {
    deal,
    fulfillments,
    disputes,
    reviews,
  };
}

/**
 * Analytics: Platform Overview.
 */
async function getAnalyticsOverview() {
  const [
    totalUsers,
    totalCompanies,
    totalCommittees,
    totalEvents,
    totalDeals,
    completedDeals,
    openReports,
    totalFulfillments,
  ] = await Promise.all([
    User.countDocuments(),
    Company.countDocuments(),
    Committee.countDocuments(),
    Event.countDocuments(),
    Deal.countDocuments(),
    Deal.countDocuments({ status: DEAL_STATUS.COMPLETED }),
    Report.countDocuments({ status: 'OPEN' }),
    Fulfillment.countDocuments(),
  ]);

  return {
    users: { total: totalUsers, companies: totalCompanies, committees: totalCommittees },
    events: { total: totalEvents },
    deals: {
      total: totalDeals,
      completed: completedDeals,
      completionRate: totalDeals > 0 ? Math.round((completedDeals / totalDeals) * 100) : 0,
    },
    fulfillment: { total: totalFulfillments },
    reports: { open: openReports },
  };
}

/**
 * Analytics: Events Breakdown.
 */
async function getAnalyticsEvents() {
  const [byStatus, byCategory, byLocationMode] = await Promise.all([
    Event.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Event.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    Event.aggregate([{ $group: { _id: '$locationMode', count: { $sum: 1 } } }]),
  ]);

  return {
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id || 'UNKNOWN', s.count])),
    byCategory: Object.fromEntries(byCategory.map((c) => [c._id || 'UNCATEGORIZED', c.count])),
    byLocationMode: Object.fromEntries(byLocationMode.map((l) => [l._id || 'UNKNOWN', l.count])),
  };
}

/**
 * Analytics: Deals Breakdown.
 */
async function getAnalyticsDeals() {
  const [byStatus, fulfillmentStatusBreakdown] = await Promise.all([
    Deal.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Fulfillment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  return {
    dealsByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    fulfillmentsByStatus: Object.fromEntries(
      fulfillmentStatusBreakdown.map((f) => [f._id, f.count])
    ),
  };
}

/**
 * Analytics: Users Breakdown.
 */
async function getAnalyticsUsers() {
  const [byRole, byStatus] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  return {
    byRole: Object.fromEntries(byRole.map((r) => [r._id, r.count])),
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
  };
}

module.exports = {
  getUsers,
  getUserById,
  updateUserStatus,
  getEvents,
  updateEventStatus,
  getDeals,
  getDealInspector,
  getAnalyticsOverview,
  getAnalyticsEvents,
  getAnalyticsDeals,
  getAnalyticsUsers,
};
