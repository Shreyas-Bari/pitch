const mongoose = require('mongoose');
const {
  Deal,
  Proposal,
  DealAgreement,
  Mou,
  MouVersion,
  Signature,
  Event,
  Company,
  Committee,
  Fulfillment,
  Dispute,
  Report,
} = require('../models');
const {
  DEAL_STATUS,
  ROLES,
  SIGNER_ROLE,
  PROPOSAL_STATUS,
  FULFILLMENT_STATUS,
  NOTIFICATION_TYPE,
  DEAL_TRANSITIONS,
} = require('../utils/constants');
const ApiError = require('../utils/apiError');
const { normalizeContributions } = require('../validators/dealValidator');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const fulfillmentService = require('./fulfillmentService');

/**
 * Deal Lifecycle Service
 * Source of Truth: docs/PITCH_DATABASE_FINAL.md Section 16, docs/PITCH_API_FINAL.md Section 12,
 * and docs/PITCH_FINAL_BUILD_SPEC.md Sections 21-22 & Step 17.
 */

/**
 * Verify caller is an authorized participant of the deal or platform admin.
 * @returns {Promise<{ deal: Object, userRole: string, company: Object|null, committee: Object|null }>}
 */
async function verifyDealParticipant(dealId, userId, role) {
  let deal = null;
  if (dealId && typeof dealId === 'object' && !(dealId instanceof mongoose.Types.ObjectId) && (dealId instanceof Deal || dealId.committeeId !== undefined)) {
    deal = dealId;
  } else {
    deal = await Deal.findById(dealId);
  }
  if (!deal) {
    throw ApiError.notFound('Deal not found', null, 'DEAL_NOT_FOUND');
  }

  if (role === ROLES.ADMIN) {
    return { deal, userRole: ROLES.ADMIN, company: null, committee: null };
  }

  let company = null;
  let committee = null;
  let userRole = null;

  if (role === ROLES.COMPANY) {
    company = await Company.findOne({ userId });
    const isCompanyMatch =
      (company &&
        deal.companyId &&
        (deal.companyId.equals
          ? deal.companyId.equals(company._id)
          : deal.companyId.toString() === company._id.toString())) ||
      (deal.companyId &&
        (deal.companyId.equals
          ? deal.companyId.equals(userId)
          : deal.companyId.toString() === userId.toString()));

    if (isCompanyMatch) {
      userRole = ROLES.COMPANY;
      return { deal, userRole, company, committee: null };
    }
  } else if (role === ROLES.COMMITTEE) {
    committee = await Committee.findOne({ userId });
    const isCommitteeMatch =
      (committee &&
        deal.committeeId &&
        (deal.committeeId.equals
          ? deal.committeeId.equals(committee._id)
          : deal.committeeId.toString() === committee._id.toString())) ||
      (deal.committeeId &&
        (deal.committeeId.equals
          ? deal.committeeId.equals(userId)
          : deal.committeeId.toString() === userId.toString()));

    if (isCommitteeMatch) {
      userRole = ROLES.COMMITTEE;
      return { deal, userRole, company: null, committee };
    }
  }
  throw ApiError.forbidden(
    'Access denied. You are not an authorized participant in this deal.',
    null,
    'FORBIDDEN'
  );
}

/**
 * Create a new deal between a company and committee for an event.
 */
async function createDeal({ userId, role, data = {} }) {
  const { eventId, companyId: providedCompanyId, committeeId: providedCommitteeId, applicationId, invitationId, initialStatus } = data;

  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND');
  }

  let companyId = providedCompanyId;
  let committeeId = providedCommitteeId || event.committeeId;

  if (role === ROLES.COMPANY) {
    const userCompany = await Company.findOne({ userId });
    if (!userCompany) {
      throw ApiError.notFound('Company profile not found for user', null, 'COMPANY_NOT_FOUND');
    }
    companyId = userCompany._id;
  } else if (role === ROLES.COMMITTEE) {
    const userCommittee = await Committee.findOne({ userId });
    if (!userCommittee) {
      throw ApiError.notFound('Committee profile not found for user', null, 'COMMITTEE_NOT_FOUND');
    }
    committeeId = userCommittee._id;
    if (!event.committeeId.equals(userCommittee._id)) {
      throw ApiError.forbidden('You do not own the event associated with this deal', null, 'FORBIDDEN');
    }
  }

  if (!companyId) {
    throw ApiError.badRequest('Company ID is required to create a deal', null, 'COMPANY_REQUIRED');
  }
  if (!committeeId) {
    throw ApiError.badRequest('Committee ID is required to create a deal', null, 'COMMITTEE_REQUIRED');
  }

  // Check if an active open deal already exists
  const existingActiveDeal = await Deal.findOne({
    eventId,
    companyId,
    committeeId,
    status: {
      $nin: [
        DEAL_STATUS.DECLINED,
        DEAL_STATUS.CANCELLED,
        DEAL_STATUS.EXPIRED,
      ],
    },
  });

  if (existingActiveDeal) {
    return existingActiveDeal;
  }

  const startStatus = initialStatus && Object.values(DEAL_STATUS).includes(initialStatus)
    ? initialStatus
    : DEAL_STATUS.INTERESTED;

  const dealPayload = {
    eventId,
    companyId,
    committeeId,
    applicationId: applicationId || null,
    invitationId: invitationId || null,
    status: startStatus,
  };

  if (data.contributions) {
    dealPayload.contributions = normalizeContributions(data.contributions);
  }
  if (data.benefits) dealPayload.benefits = data.benefits;
  if (data.obligations) dealPayload.obligations = data.obligations;
  if (data.terms) dealPayload.terms = data.terms;

  const deal = await Deal.create(dealPayload);

  return deal;
}

/**
 * List deals for authenticated participant with pagination and filters.
 */
async function getDeals({ userId, role, query = {} }) {
  const filter = {};

  if (role === ROLES.COMPANY) {
    const company = await Company.findOne({ userId });
    if (company) {
      filter.$or = [{ companyId: company._id }, { companyId: userId }];
    } else {
      filter.companyId = userId;
    }
  } else if (role === ROLES.COMMITTEE) {
    const committee = await Committee.findOne({ userId });
    if (committee) {
      filter.$or = [{ committeeId: committee._id }, { committeeId: userId }];
    } else {
      filter.committeeId = userId;
    }
  } else if (role === ROLES.ADMIN) {
    if (query.companyId) filter.companyId = query.companyId;
    if (query.committeeId) filter.committeeId = query.committeeId;
  }

  if (query.status) {
    filter.status = query.status;
  }
  if (query.eventId) {
    filter.eventId = query.eventId;
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [deals, total] = await Promise.all([
    Deal.find(filter)
      .populate('eventId', 'title slug eventDate category location')
      .populate('companyId', 'name legalName industry location')
      .populate('committeeId', 'name college')
      .populate('currentProposalId')
      .populate('mouId')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Deal.countDocuments(filter),
  ]);

  return {
    deals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Retrieve deal by ID with participant authorization.
 */
async function getDealById(arg1, user = null) {
  let dealId;
  let userId;
  let role;

  if (typeof arg1 === 'object' && arg1 !== null && arg1.dealId) {
    dealId = arg1.dealId;
    userId = arg1.userId;
    role = arg1.role;
  } else {
    dealId = arg1;
    if (user) {
      userId = user._id || user.id;
      role = user.role;
    }
  }

  if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
    throw ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID');
  }

  if (userId && role) {
    await verifyDealParticipant(dealId, userId, role);
  } else {
    const deal = await Deal.findById(dealId);
    if (!deal) {
      throw ApiError.notFound('Deal not found', null, 'DEAL_NOT_FOUND');
    }
  }

  const populatedDeal = await Deal.findById(dealId)
    .populate('eventId')
    .populate('companyId')
    .populate('committeeId')
    .populate('currentProposalId')
    .populate('agreedTermsId')
    .populate('mouId');

  if (!populatedDeal) {
    throw ApiError.notFound('Deal not found', null, 'DEAL_NOT_FOUND');
  }

  return populatedDeal;
}

/**
 * Update deal status strictly checking the state machine transition graph.
 */
async function updateDeal({ dealId, userId, role, updates = {} }) {
  const { deal } = await verifyDealParticipant(dealId, userId, role);

  const { status: targetStatus, cancellationReason, contributions, benefits, obligations, terms } = updates;

  if (targetStatus && targetStatus !== deal.status) {
    const isValid = Deal.isValidTransition(deal.status, targetStatus);
    if (!isValid) {
      const allowed = require('../utils/constants').DEAL_TRANSITIONS[deal.status] || [];
      throw ApiError.conflict(
        `Invalid deal state transition from "${deal.status}" to "${targetStatus}". Allowed transitions: [${allowed.join(', ')}]`,
        { from: deal.status, to: targetStatus, allowed },
        'INVALID_STATE_TRANSITION'
      );
    }
    deal.status = targetStatus;

    if (targetStatus === DEAL_STATUS.CANCELLED) {
      deal.cancelledAt = new Date();
      deal.cancellationReason = cancellationReason || 'Cancelled by participant';
    }
  }

  if (contributions !== undefined) {
    deal.contributions = normalizeContributions(contributions);
  }
  if (benefits !== undefined) deal.benefits = benefits;
  if (obligations !== undefined) deal.obligations = obligations;
  if (terms !== undefined) deal.terms = terms;

  await deal.save();
  return deal;
}

/**
 * Cancel a deal with required reason.
 */
async function cancelDeal({ dealId, userId, role, reason }) {
  return updateDeal({
    dealId,
    userId,
    role,
    updates: {
      status: DEAL_STATUS.CANCELLED,
      cancellationReason: reason,
    },
  });
}

/**
 * Formally agree on commercial terms for a deal (DealAgreement snapshot).
 * Transitions Deal status to AGREED.
 */
async function agreeDeal({ dealId, userId, role, data = {} }) {
  const { deal, userRole, company, committee } = await verifyDealParticipant(dealId, userId, role);

  // Deal must be in a state that permits transition to AGREED
  if (!Deal.isValidTransition(deal.status, DEAL_STATUS.AGREED)) {
    throw ApiError.conflict(
      `Cannot agree on deal in state "${deal.status}". Must be in PROPOSAL or COUNTER_PROPOSAL.`,
      { currentStatus: deal.status },
      'INVALID_DEAL_STATE'
    );
  }

  // Find latest accepted or current proposal
  let proposal = null;
  if (deal.currentProposalId) {
    proposal = await Proposal.findById(deal.currentProposalId);
  }
  if (!proposal) {
    proposal = await Proposal.findOne({ dealId: deal._id }).sort({ version: -1 });
  }

  if (!proposal) {
    throw ApiError.badRequest(
      'Cannot establish deal agreement without an active negotiation proposal.',
      null,
      'PROPOSAL_REQUIRED'
    );
  }

  // Ensure proposal is marked ACCEPTED
  if (proposal.status !== PROPOSAL_STATUS.ACCEPTED) {
    proposal.status = PROPOSAL_STATUS.ACCEPTED;
    proposal.respondedAt = new Date();
    await proposal.save();
  }

  // Build snapshot from accepted proposal, event, and parties
  const [dealEvent, fullCompany, fullCommittee] = await Promise.all([
    Event.findById(deal.eventId),
    Company.findById(deal.companyId),
    Committee.findById(deal.committeeId),
  ]);

  const agreedSnapshot = {
    contributions: proposal.contribution,
    benefits: proposal.benefits || [],
    deliverables: proposal.deliverables || [],
    deliveryRequirements: data.deliveryRequirements || null,
    terms: proposal.terms || '',
    paymentDetails: {
      beneficiaryName: data.paymentDetails?.beneficiaryName || fullCommittee?.name || '',
      accountNumber: data.paymentDetails?.accountNumber || '',
      bankName: data.paymentDetails?.bankName || '',
      branch: data.paymentDetails?.branch || '',
      ifscCode: data.paymentDetails?.ifscCode || '',
      pan: data.paymentDetails?.pan || fullCommittee?.pan || '',
      gstin: data.paymentDetails?.gstin || fullCommittee?.gstin || '',
      accountsEmail: data.paymentDetails?.accountsEmail || fullCommittee?.contact?.email || '',
      paymentSchedule: data.paymentDetails?.paymentSchedule || [],
      gstRate: data.paymentDetails?.gstRate !== undefined ? Number(data.paymentDetails.gstRate) : 18,
      currency: 'INR',
    },
    parties: {
      company: {
        name: fullCompany?.name || '',
        legalName: fullCompany?.legalName || fullCompany?.name || '',
        industry: fullCompany?.industry || '',
        location: fullCompany?.location || {},
        contact: fullCompany?.contact || {},
      },
      committee: {
        name: fullCommittee?.name || '',
        college: fullCommittee?.college || {},
        contact: fullCommittee?.contact || {},
      },
    },
    eventDetails: {
      title: dealEvent?.title || '',
      category: dealEvent?.category || '',
      eventDate: dealEvent?.eventDate || null,
      endDate: dealEvent?.endDate || null,
      location: dealEvent?.location || {},
    },
  };

  const signerRole = userRole === ROLES.COMPANY ? SIGNER_ROLE.COMPANY : SIGNER_ROLE.COMMITTEE;

  const agreement = await DealAgreement.create({
    dealId: deal._id,
    acceptedProposalId: proposal._id,
    snapshot: agreedSnapshot,
    agreedBy: [
      {
        userId,
        role: signerRole,
        agreedAt: new Date(),
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    ],
  });

  deal.status = DEAL_STATUS.AGREED;
  deal.agreedTermsId = agreement._id;
  deal.agreedAt = new Date();
  deal.contributions = agreedSnapshot.contributions;
  deal.benefits = agreedSnapshot.benefits;
  deal.obligations = agreedSnapshot.deliverables;
  deal.terms = agreedSnapshot.terms;

  await deal.save();

  return { deal, agreement };
}

/**
 * Get active commercial DealAgreement snapshot for a deal.
 */
async function getDealAgreement({ dealId, userId, role }) {
  const { deal } = await verifyDealParticipant(dealId, userId, role);

  const agreement = await DealAgreement.findOne({ dealId: deal._id })
    .populate('acceptedProposalId')
    .sort({ createdAt: -1 });

  if (!agreement) {
    throw ApiError.notFound('No agreement snapshot established for this deal yet.', null, 'AGREEMENT_NOT_FOUND');
  }

  return agreement;
}

/**
 * Generate a complete chronological deal timeline.
 */
async function getDealTimeline({ dealId, userId, role }) {
  const { deal } = await verifyDealParticipant(dealId, userId, role);

  const timeline = [];

  // Deal creation
  timeline.push({
    id: `deal_create_${deal._id}`,
    type: 'DEAL_CREATED',
    timestamp: deal.createdAt,
    title: 'Deal Initiated',
    description: `Deal created in initial status "${deal.status}".`,
    details: { status: deal.status },
  });

  // Proposals
  const proposals = await Proposal.find({ dealId: deal._id }).sort({ version: 1 });
  for (const p of proposals) {
    timeline.push({
      id: `proposal_${p._id}`,
      type: p.version === 1 ? 'PROPOSAL_CREATED' : 'COUNTER_PROPOSAL_CREATED',
      timestamp: p.createdAt,
      title: `Proposal v${p.version} Submitted`,
      description: `Version ${p.version} created with status "${p.status}".`,
      details: {
        proposalId: p._id,
        version: p.version,
        status: p.status,
        createdByUserId: p.createdByUserId,
      },
    });

    if (p.respondedAt && p.status === PROPOSAL_STATUS.ACCEPTED) {
      timeline.push({
        id: `proposal_accept_${p._id}`,
        type: 'PROPOSAL_ACCEPTED',
        timestamp: p.respondedAt,
        title: `Proposal v${p.version} Accepted`,
        description: `Commercial terms in Proposal v${p.version} accepted by counterparty.`,
        details: { proposalId: p._id, version: p.version },
      });
    } else if (p.respondedAt && p.status === PROPOSAL_STATUS.REJECTED) {
      timeline.push({
        id: `proposal_reject_${p._id}`,
        type: 'PROPOSAL_DECLINED',
        timestamp: p.respondedAt,
        title: `Proposal v${p.version} Declined`,
        description: `Proposal v${p.version} was declined.`,
        details: { proposalId: p._id, version: p.version },
      });
    }
  }

  // Agreement
  const agreements = await DealAgreement.find({ dealId: deal._id });
  for (const a of agreements) {
    timeline.push({
      id: `agreement_${a._id}`,
      type: 'COMMERCIAL_TERMS_AGREED',
      timestamp: a.createdAt,
      title: 'Commercial Terms Agreed & Locked',
      description: 'Immutable commercial agreement snapshot established.',
      details: { agreementId: a._id, agreedBy: a.agreedBy },
    });
  }

  // MoU & Versions
  const mou = await Mou.findOne({ dealId: deal._id });
  if (mou) {
    timeline.push({
      id: `mou_${mou._id}`,
      type: 'MOU_CONTAINER_INITIALIZED',
      timestamp: mou.createdAt,
      title: 'MoU Initialized',
      description: `MoU generated under template identifier PITCH_MOU_V1.`,
      details: { mouId: mou._id, status: mou.status },
    });

    const versions = await MouVersion.find({ mouId: mou._id }).sort({ versionNumber: 1 });
    for (const v of versions) {
      timeline.push({
        id: `mou_version_${v._id}`,
        type: 'MOU_VERSION_GENERATED',
        timestamp: v.generatedAt || v.createdAt,
        title: `MoU Version ${v.versionNumber} Generated`,
        description: `PDF generated and SHA-256 hashed.`,
        details: {
          versionId: v._id,
          versionNumber: v.versionNumber,
          documentHash: v.documentHash,
          status: v.status,
        },
      });
    }

    // Signatures
    const signatures = await Signature.find({ mouId: mou._id }).sort({ signedAt: 1 });
    for (const s of signatures) {
      timeline.push({
        id: `signature_${s._id}`,
        type: 'DIGITALLY_SIGNED',
        timestamp: s.signedAt,
        title: `Digitally Signed by ${s.signerRole}`,
        description: `Signed by ${s.fullName} (${s.designation}) with hash ${s.documentHashAtSigning.substring(0, 16)}...`,
        details: {
          signatureId: s._id,
          signerUserId: s.signerUserId,
          signerRole: s.signerRole,
          documentHash: s.documentHashAtSigning,
        },
      });
    }
  }

  if (deal.executedAt) {
    timeline.push({
      id: `deal_executed_${deal._id}`,
      type: 'DEAL_EXECUTED',
      timestamp: deal.executedAt,
      title: 'Deal Formally Executed',
      description: 'Both required signatures verified. Deal is legally closed and ready for fulfillment.',
      details: { executedAt: deal.executedAt },
    });
  }

  if (deal.cancelledAt) {
    timeline.push({
      id: `deal_cancelled_${deal._id}`,
      type: 'DEAL_CANCELLED',
      timestamp: deal.cancelledAt,
      title: 'Deal Cancelled',
      description: `Deal cancelled. Reason: ${deal.cancellationReason || 'No reason provided'}`,
      details: { reason: deal.cancellationReason },
    });
  }

  // Sort by timestamp
  timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return timeline;
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
  if (user) {
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
  }

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
  if (user) {
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
  }

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
  verifyDealParticipant,
  createDeal,
  getDeals,
  listDeals,
  getDealById,
  updateDeal,
  cancelDeal,
  agreeDeal,
  getDealAgreement,
  getDealTimeline,
  getCompletionStatus,
  completeDeal,
  createDealDispute,
  getDealDisputes,
};
