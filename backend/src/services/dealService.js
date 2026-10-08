const mongoose = require('mongoose');
const { Deal, Proposal, DealAgreement, Mou, MouVersion, Signature, Event, Company, Committee } = require('../models');
const { DEAL_STATUS, ROLES, SIGNER_ROLE, PROPOSAL_STATUS } = require('../utils/constants');
const ApiError = require('../utils/apiError');
const { normalizeContributions } = require('../validators/dealValidator');

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
    if (
      company &&
      deal.companyId &&
      (deal.companyId.equals
        ? deal.companyId.equals(company._id)
        : deal.companyId.toString() === company._id.toString())
    ) {
      userRole = ROLES.COMPANY;
      return { deal, userRole, company, committee: null };
    }
  } else if (role === ROLES.COMMITTEE) {
    committee = await Committee.findOne({ userId });
    if (
      committee &&
      deal.committeeId &&
      (deal.committeeId.equals
        ? deal.committeeId.equals(committee._id)
        : deal.committeeId.toString() === committee._id.toString())
    ) {
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
    if (!company) {
      return { deals: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }
    filter.companyId = company._id;
  } else if (role === ROLES.COMMITTEE) {
    const committee = await Committee.findOne({ userId });
    if (!committee) {
      return { deals: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }
    filter.committeeId = committee._id;
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
async function getDealById({ dealId, userId, role }) {
  const { deal } = await verifyDealParticipant(dealId, userId, role);

  const populatedDeal = await Deal.findById(deal._id)
    .populate('eventId')
    .populate('companyId')
    .populate('committeeId')
    .populate('currentProposalId')
    .populate('agreedTermsId')
    .populate('mouId');

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

module.exports = {
  verifyDealParticipant,
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  cancelDeal,
  agreeDeal,
  getDealAgreement,
  getDealTimeline,
};
