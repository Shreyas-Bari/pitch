const mongoose = require('mongoose');
const { Proposal, Deal } = require('../models');
const { PROPOSAL_STATUS, DEAL_STATUS, ROLES } = require('../utils/constants');
const ApiError = require('../utils/apiError');
const { normalizeContributions } = require('../validators/dealValidator');
const { verifyDealParticipant, agreeDeal } = require('./dealService');

/**
 * Proposal Negotiation Service
 * Source of Truth: docs/PITCH_DATABASE_FINAL.md Section 17, docs/PITCH_API_FINAL.md Section 13,
 * and docs/PITCH_FINAL_BUILD_SPEC.md Section 23 & Step 18.
 *
 * Rules:
 * - Proposals are immutable negotiation records. Never overwrite historical proposals.
 * - Counter-proposals increment version and link basedOnProposalId.
 * - Accepting a proposal locks commercial terms and transitions Deal to AGREED.
 * - Only the counterparty can accept or decline a pending proposal.
 * - Only the creator can withdraw their pending proposal.
 */

/**
 * Create initial proposal or next proposal for a deal in negotiation.
 */
async function createProposal({ dealId, userId, role, data = {} }) {
  const { deal } = await verifyDealParticipant(dealId, userId, role);

  const allowedDealStatuses = [
    DEAL_STATUS.INTERESTED,
    DEAL_STATUS.DISCUSSION,
    DEAL_STATUS.NEGOTIATING,
    DEAL_STATUS.PROPOSAL,
    DEAL_STATUS.COUNTER_PROPOSAL,
  ];

  if (!allowedDealStatuses.includes(deal.status)) {
    throw ApiError.conflict(
      `Cannot create proposal when deal is in status "${deal.status}".`,
      { currentStatus: deal.status, allowedDealStatuses },
      'INVALID_DEAL_STATE'
    );
  }

  // Find latest proposal version for this deal
  const latestProposal = await Proposal.findOne({ dealId: deal._id }).sort({ version: -1 });
  const nextVersion = latestProposal ? latestProposal.version + 1 : 1;

  // Normalize contributions to strictly maintain the 11 types
  const normalizedContribution = normalizeContributions(data.contributions || data.contribution);

  const proposal = await Proposal.create({
    dealId: deal._id,
    createdByUserId: userId,
    version: nextVersion,
    basedOnProposalId: data.basedOnProposalId || (latestProposal ? latestProposal._id : null),
    contribution: normalizedContribution,
    benefits: Array.isArray(data.benefits) ? data.benefits : [],
    deliverables: Array.isArray(data.deliverables) ? data.deliverables : [],
    terms: typeof data.terms === 'string' ? data.terms : '',
    status: PROPOSAL_STATUS.PENDING,
  });

  // Update deal state
  deal.currentProposalId = proposal._id;

  // Transition deal status if applicable
  const targetDealStatus = nextVersion === 1 ? DEAL_STATUS.PROPOSAL : DEAL_STATUS.COUNTER_PROPOSAL;
  if (deal.status !== targetDealStatus && Deal.isValidTransition(deal.status, targetDealStatus)) {
    deal.status = targetDealStatus;
  } else if (deal.status === DEAL_STATUS.INTERESTED && Deal.isValidTransition(deal.status, DEAL_STATUS.DISCUSSION)) {
    deal.status = DEAL_STATUS.DISCUSSION;
  } else if (deal.status === DEAL_STATUS.DISCUSSION && Deal.isValidTransition(deal.status, DEAL_STATUS.NEGOTIATING)) {
    deal.status = DEAL_STATUS.NEGOTIATING;
  }

  await deal.save();

  return proposal;
}

/**
 * Retrieve all proposals for a deal (chronological version history).
 */
async function getProposalsForDeal({ dealId, userId, role }) {
  const { deal } = await verifyDealParticipant(dealId, userId, role);

  const proposals = await Proposal.find({ dealId: deal._id })
    .populate('createdByUserId', 'fullName email role')
    .sort({ version: 1 });

  return proposals;
}

/**
 * Retrieve a specific proposal by ID.
 */
async function getProposalById({ proposalId, userId, role }) {
  const proposal = await Proposal.findById(proposalId).populate('createdByUserId', 'fullName email role');
  if (!proposal) {
    throw ApiError.notFound('Proposal not found', null, 'PROPOSAL_NOT_FOUND');
  }

  // Verify participant access to the underlying deal
  await verifyDealParticipant(proposal.dealId, userId, role);

  return proposal;
}

/**
 * Counter an existing proposal, creating an immutable next version.
 */
async function counterProposal({ proposalId, userId, role, data = {} }) {
  const proposal = await Proposal.findById(proposalId);
  if (!proposal) {
    throw ApiError.notFound('Proposal not found', null, 'PROPOSAL_NOT_FOUND');
  }

  const { deal } = await verifyDealParticipant(proposal.dealId, userId, role);

  if (proposal.status !== PROPOSAL_STATUS.PENDING) {
    throw ApiError.conflict(
      `Cannot counter proposal with status "${proposal.status}". Must be in PENDING status.`,
      { currentStatus: proposal.status },
      'INVALID_PROPOSAL_STATUS'
    );
  }

  // Mark parent proposal as SUPERSEDED
  proposal.status = PROPOSAL_STATUS.SUPERSEDED;
  proposal.respondedAt = new Date();
  await proposal.save();

  // Create new counter-proposal version
  const nextVersion = proposal.version + 1;
  const normalizedContribution = normalizeContributions(
    data.contributions || data.contribution || proposal.contribution
  );

  const counter = await Proposal.create({
    dealId: deal._id,
    createdByUserId: userId,
    version: nextVersion,
    basedOnProposalId: proposal._id,
    contribution: normalizedContribution,
    benefits: data.benefits !== undefined ? data.benefits : proposal.benefits,
    deliverables: data.deliverables !== undefined ? data.deliverables : proposal.deliverables,
    terms: data.terms !== undefined ? data.terms : proposal.terms,
    status: PROPOSAL_STATUS.PENDING,
  });

  // Update deal state to COUNTER_PROPOSAL
  deal.currentProposalId = counter._id;
  if (deal.status !== DEAL_STATUS.COUNTER_PROPOSAL && Deal.isValidTransition(deal.status, DEAL_STATUS.COUNTER_PROPOSAL)) {
    deal.status = DEAL_STATUS.COUNTER_PROPOSAL;
  }
  await deal.save();

  return counter;
}

/**
 * Accept a proposal: locks commercial terms and transitions Deal to AGREED.
 */
async function acceptProposal({ proposalId, userId, role, data = {} }) {
  const proposal = await Proposal.findById(proposalId);
  if (!proposal) {
    throw ApiError.notFound('Proposal not found', null, 'PROPOSAL_NOT_FOUND');
  }

  const { deal } = await verifyDealParticipant(proposal.dealId, userId, role);

  // Counterparty rule: Creator cannot accept their own proposal
  if (role !== ROLES.ADMIN && proposal.createdByUserId.equals(userId)) {
    throw ApiError.forbidden(
      'You cannot accept your own proposal. Only the counterparty can accept.',
      null,
      'CANNOT_ACCEPT_OWN_PROPOSAL'
    );
  }

  if (proposal.status !== PROPOSAL_STATUS.PENDING) {
    throw ApiError.conflict(
      `Cannot accept proposal with status "${proposal.status}". Must be PENDING.`,
      { currentStatus: proposal.status },
      'INVALID_PROPOSAL_STATUS'
    );
  }

  // Transition proposal to ACCEPTED
  proposal.status = PROPOSAL_STATUS.ACCEPTED;
  proposal.respondedAt = new Date();
  await proposal.save();

  // Link as current proposal on deal
  deal.currentProposalId = proposal._id;
  await deal.save();

  // Establish DealAgreement commercial snapshot and transition deal to AGREED
  const { agreement } = await agreeDeal({
    dealId: deal._id,
    userId,
    role,
    data,
  });

  return {
    proposal,
    agreement,
    dealStatus: DEAL_STATUS.AGREED,
  };
}

/**
 * Decline a proposal.
 */
async function declineProposal({ proposalId, userId, role, reason = '' }) {
  const proposal = await Proposal.findById(proposalId);
  if (!proposal) {
    throw ApiError.notFound('Proposal not found', null, 'PROPOSAL_NOT_FOUND');
  }

  const { deal } = await verifyDealParticipant(proposal.dealId, userId, role);

  // Creator cannot decline own proposal (must withdraw instead)
  if (role !== ROLES.ADMIN && proposal.createdByUserId.equals(userId)) {
    throw ApiError.forbidden(
      'You cannot decline your own proposal. Use withdraw instead.',
      null,
      'CANNOT_DECLINE_OWN_PROPOSAL'
    );
  }

  if (proposal.status !== PROPOSAL_STATUS.PENDING) {
    throw ApiError.conflict(
      `Cannot decline proposal with status "${proposal.status}". Must be PENDING.`,
      { currentStatus: proposal.status },
      'INVALID_PROPOSAL_STATUS'
    );
  }

  proposal.status = PROPOSAL_STATUS.REJECTED;
  proposal.respondedAt = new Date();
  await proposal.save();

  // Deal can remain in or transition back to NEGOTIATING
  if (Deal.isValidTransition(deal.status, DEAL_STATUS.NEGOTIATING)) {
    deal.status = DEAL_STATUS.NEGOTIATING;
    await deal.save();
  }

  return proposal;
}

/**
 * Withdraw a proposal (by creator).
 */
async function withdrawProposal({ proposalId, userId, role }) {
  const proposal = await Proposal.findById(proposalId);
  if (!proposal) {
    throw ApiError.notFound('Proposal not found', null, 'PROPOSAL_NOT_FOUND');
  }

  const { deal } = await verifyDealParticipant(proposal.dealId, userId, role);

  // Only creator can withdraw
  if (role !== ROLES.ADMIN && !proposal.createdByUserId.equals(userId)) {
    throw ApiError.forbidden(
      'Only the creator can withdraw this proposal.',
      null,
      'ONLY_CREATOR_CAN_WITHDRAW'
    );
  }

  if (proposal.status !== PROPOSAL_STATUS.PENDING) {
    throw ApiError.conflict(
      `Cannot withdraw proposal with status "${proposal.status}". Must be PENDING.`,
      { currentStatus: proposal.status },
      'INVALID_PROPOSAL_STATUS'
    );
  }

  proposal.status = PROPOSAL_STATUS.WITHDRAWN;
  proposal.respondedAt = new Date();
  await proposal.save();

  // If deal was in PROPOSAL or COUNTER_PROPOSAL, transition to NEGOTIATING if valid
  if (Deal.isValidTransition(deal.status, DEAL_STATUS.NEGOTIATING)) {
    deal.status = DEAL_STATUS.NEGOTIATING;
    await deal.save();
  }

  return proposal;
}

module.exports = {
  createProposal,
  getProposalsForDeal,
  getProposalById,
  counterProposal,
  acceptProposal,
  declineProposal,
  withdrawProposal,
};
