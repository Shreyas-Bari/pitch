const { Review, Deal, Company, Committee, Event, User } = require('../models');
const { DEAL_STATUS, REVIEW_STATUS, NOTIFICATION_TYPE, ROLES } = require('../utils/constants');
const ApiError = require('../utils/apiError');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

/**
 * Review & Reputation Service
 * Source: docs/PITCH_DATABASE_FINAL.md Section 24 & 26, docs/PITCH_API_FINAL.md Section 3 & 17
 * Strict rules:
 * - Only COMPLETED deals can be reviewed
 * - Only actual deal participants can review
 * - One review per direction per deal
 * - Verified reputation is derived purely from completed PITCH deals
 */

/**
 * Create a review for a completed deal.
 */
async function createDealReview(dealId, payload, user, req = null) {
  const deal = await Deal.findById(dealId);
  if (!deal) {
    throw ApiError.notFound('Deal not found', null, 'DEAL_NOT_FOUND');
  }

  // 1. Must be COMPLETED deal
  if (deal.status !== DEAL_STATUS.COMPLETED) {
    throw ApiError.badRequest(
      `Reviews can only be submitted for COMPLETED deals. Current deal status is "${deal.status}".`,
      { currentStatus: deal.status, requiredStatus: DEAL_STATUS.COMPLETED },
      'DEAL_NOT_COMPLETED'
    );
  }

  // 2. Resolve reviewer participant identity
  const [userCompany, userCommittee] = await Promise.all([
    Company.findOne({ userId: user._id }),
    Committee.findOne({ userId: user._id }),
  ]);

  let revieweeCompanyId = null;
  let revieweeCommitteeId = null;
  let targetUserId = null;

  const isCompanyParticipant =
    userCompany && deal.companyId.equals(userCompany._id);
  const isCommitteeParticipant =
    userCommittee && deal.committeeId.equals(userCommittee._id);

  if (isCompanyParticipant) {
    // Company is reviewing the Committee
    revieweeCommitteeId = deal.committeeId;
    const committee = await Committee.findById(deal.committeeId);
    targetUserId = committee?.userId;
  } else if (isCommitteeParticipant) {
    // Committee is reviewing the Company
    revieweeCompanyId = deal.companyId;
    const company = await Company.findById(deal.companyId);
    targetUserId = company?.userId;
  } else if (user.role === ROLES.ADMIN) {
    throw ApiError.badRequest(
      'Admins cannot submit reviews on behalf of participants.',
      null,
      'ADMIN_CANNOT_REVIEW'
    );
  } else {
    throw ApiError.forbidden(
      'Access denied. You are not a participant in this deal.',
      null,
      'FORBIDDEN'
    );
  }

  // 3. Enforce exactly one review per direction per deal
  const existingReview = await Review.findOne({
    dealId,
    reviewerUserId: user._id,
  });

  if (existingReview) {
    throw ApiError.conflict(
      'You have already submitted a review for this deal. Duplicate reviews are not allowed.',
      null,
      'DUPLICATE_REVIEW'
    );
  }

  // 4. Create Review document
  const review = await Review.create({
    dealId,
    reviewerUserId: user._id,
    revieweeCompanyId,
    revieweeCommitteeId,
    rating: payload.rating,
    title: payload.title || '',
    comment: payload.comment || '',
    status: REVIEW_STATUS.PUBLISHED,
  });

  // 5. Send notification to the reviewed party
  if (targetUserId) {
    await notificationService.createNotification({
      recipientUserId: targetUserId,
      type: NOTIFICATION_TYPE.NEW_REVIEW,
      title: 'New Review Received',
      message: `You received a ${payload.rating}-star review for a completed deal.`,
      entityType: 'REVIEW',
      entityId: review._id,
    });
  }

  // 6. Audit log
  await auditService.logAction({
    actorUserId: user._id,
    action: 'REVIEW_CREATED',
    entityType: 'REVIEW',
    entityId: review._id,
    metadata: {
      dealId,
      rating: payload.rating,
      revieweeCompanyId,
      revieweeCommitteeId,
    },
    req,
  });

  return review;
}

/**
 * Get all reviews for a specific deal.
 */
async function getDealReviews(dealId) {
  const reviews = await Review.find({ dealId, status: REVIEW_STATUS.PUBLISHED })
    .populate('reviewerUserId', 'name role')
    .sort({ createdAt: -1 })
    .lean();

  return reviews;
}

/**
 * Update an existing review.
 */
async function updateReview(reviewId, updates, user, req = null) {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw ApiError.notFound('Review not found', null, 'REVIEW_NOT_FOUND');
  }

  const isAuthor = review.reviewerUserId.equals(user._id);
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isAuthor && !isAdmin) {
    throw ApiError.forbidden(
      'Access denied. You can only update your own review.',
      null,
      'FORBIDDEN'
    );
  }

  if (updates.status && !isAdmin) {
    delete updates.status; // Ordinary users cannot change moderation status
  }

  Object.assign(review, updates);
  await review.save();

  await auditService.logAction({
    actorUserId: user._id,
    action: 'REVIEW_UPDATED',
    entityType: 'REVIEW',
    entityId: review._id,
    metadata: { updates },
    req,
  });

  return review;
}

/**
 * Get aggregated reputation & published reviews for an organization.
 */
async function getOrganizationReviews(ownerType, ownerId, { page = 1, limit = 20 } = {}) {
  const query = {
    status: REVIEW_STATUS.PUBLISHED,
    ...(ownerType === 'COMPANY'
      ? { revieweeCompanyId: ownerId }
      : { revieweeCommitteeId: ownerId }),
  };

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (numericPage - 1) * numericLimit;

  const [total, reviews, allPublished] = await Promise.all([
    Review.countDocuments(query),
    Review.find(query)
      .populate('reviewerUserId', 'name role')
      .populate('dealId', 'eventId completedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit)
      .lean(),
    Review.find(query, { rating: 1 }).lean(),
  ]);

  // Aggregate ratings
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sumRatings = 0;

  for (const r of allPublished) {
    const star = Math.round(r.rating);
    if (distribution[star] !== undefined) {
      distribution[star]++;
    }
    sumRatings += r.rating;
  }

  const totalReviews = allPublished.length;
  const averageRating =
    totalReviews > 0 ? parseFloat((sumRatings / totalReviews).toFixed(1)) : 0;

  return {
    reviews,
    summary: {
      averageRating,
      totalReviews,
      ratingDistribution: distribution,
    },
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1,
    },
  };
}

/**
 * Get PITCH-verified history derived strictly from COMPLETED deals.
 * Excludes self-reported records.
 */
async function getVerifiedHistory(ownerType, ownerId, { page = 1, limit = 20 } = {}) {
  const query = {
    status: DEAL_STATUS.COMPLETED,
    ...(ownerType === 'COMPANY'
      ? { companyId: ownerId }
      : { committeeId: ownerId }),
  };

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (numericPage - 1) * numericLimit;

  const [total, deals] = await Promise.all([
    Deal.countDocuments(query),
    Deal.find(query)
      .populate('eventId', 'title category locationMode startDate endDate')
      .populate('companyId', 'companyName industry logoFileId')
      .populate('committeeId', 'committeeName collegeName logoFileId')
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(numericLimit)
      .lean(),
  ]);

  // Transform each deal into a verified sponsorship history item
  const verifiedDeals = deals.map((d) => ({
    dealId: d._id,
    eventId: d.eventId?._id,
    eventName: d.eventId?.title || 'Unknown Event',
    eventCategory: d.eventId?.category || null,
    partnerName:
      ownerType === 'COMPANY'
        ? d.committeeId?.committeeName
        : d.companyId?.companyName,
    partnerCollege:
      ownerType === 'COMPANY' ? d.committeeId?.collegeName : null,
    completedAt: d.completedAt,
    executedAt: d.executedAt,
    verificationStatus: 'PITCH_VERIFIED',
    isPitchVerified: true,
  }));

  return {
    verifiedHistory: verifiedDeals,
    summary: {
      completedDealsCount: total,
      verificationSource: 'PITCH_DEALS',
      isFullyVerified: true,
    },
    pagination: {
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages: Math.ceil(total / numericLimit) || 1,
    },
  };
}

module.exports = {
  createDealReview,
  getDealReviews,
  updateReview,
  getOrganizationReviews,
  getVerifiedHistory,
};
