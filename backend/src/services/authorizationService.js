const { ROLES } = require('../utils/constants');
const ApiError = require('../utils/apiError');
const { Company, Committee, Event, Deal } = require('../models');

/**
 * Authorization Service
 * Centralized business logic for role and resource ownership verification.
 * Source: docs/PITCH_FINAL_BUILD_SPEC.md Section 35
 */

/**
 * Assert that the user has one of the allowed roles.
 * Throws 403 ApiError if unauthorized.
 * @param {Object} user
 * @param {...string|string[]} roles
 */
function assertRole(user, ...roles) {
  if (!user) {
    throw ApiError.unauthorized('Authentication required.', null, 'UNAUTHORIZED');
  }
  const allowed = roles.flat();
  if (!allowed.includes(user.role)) {
    throw ApiError.forbidden(
      `Access denied. Insufficient permissions for role: ${user.role}`,
      { allowedRoles: allowed, currentRole: user.role },
      'FORBIDDEN'
    );
  }
}

/**
 * Assert that a condition is true, otherwise throw 403 Forbidden.
 * @param {boolean} condition
 * @param {string} [message='Access denied. You do not own this resource.']
 */
function assertOwnership(condition, message = 'Access denied. You do not own this resource.') {
  if (!condition) {
    throw ApiError.forbidden(message, null, 'FORBIDDEN');
  }
}

/**
 * Check whether a user can access/modify a company resource.
 * @param {Object} user
 * @param {Object} company
 * @returns {boolean}
 */
function canAccessCompany(user, company) {
  if (!user || !company) return false;
  if (user.role === ROLES.ADMIN) return true;
  return company.userId && company.userId.equals
    ? company.userId.equals(user._id)
    : company.userId.toString() === user._id.toString();
}

/**
 * Check whether a user can access/modify a committee resource.
 * @param {Object} user
 * @param {Object} committee
 * @returns {boolean}
 */
function canAccessCommittee(user, committee) {
  if (!user || !committee) return false;
  if (user.role === ROLES.ADMIN) return true;
  return committee.userId && committee.userId.equals
    ? committee.userId.equals(user._id)
    : committee.userId.toString() === user._id.toString();
}

/**
 * Check whether a user can access/modify an event resource.
 * @param {Object} user
 * @param {Object} event
 * @param {Object} [userCommittee]
 * @returns {boolean}
 */
function canAccessEvent(user, event, userCommittee = null) {
  if (!user || !event) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.role !== ROLES.COMMITTEE || !userCommittee) return false;
  return event.committeeId && event.committeeId.equals
    ? event.committeeId.equals(userCommittee._id)
    : event.committeeId.toString() === userCommittee._id.toString();
}

/**
 * Programmatic verification of company ownership.
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} companyId
 * @returns {Promise<{ isOwner: boolean, company: Object }>}
 */
async function verifyCompanyOwnership(userId, companyId) {
  const company = await Company.findById(companyId);
  if (!company) {
    throw ApiError.notFound('Company not found', null, 'COMPANY_NOT_FOUND');
  }
  const isOwner = company.userId.equals
    ? company.userId.equals(userId)
    : company.userId.toString() === userId.toString();
  return { isOwner, company };
}

/**
 * Programmatic verification of committee ownership.
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} committeeId
 * @returns {Promise<{ isOwner: boolean, committee: Object }>}
 */
async function verifyCommitteeOwnership(userId, committeeId) {
  const committee = await Committee.findById(committeeId);
  if (!committee) {
    throw ApiError.notFound('Committee not found', null, 'COMMITTEE_NOT_FOUND');
  }
  const isOwner = committee.userId.equals
    ? committee.userId.equals(userId)
    : committee.userId.toString() === userId.toString();
  return { isOwner, committee };
}

/**
 * Programmatic verification of event ownership through committeeId.
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} eventId
 * @returns {Promise<{ isOwner: boolean, event: Object, committee: Object }>}
 */
async function verifyEventOwnership(userId, eventId) {
  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND');
  }
  const committee = await Committee.findOne({ userId });
  if (!committee) {
    return { isOwner: false, event, committee: null };
  }
  const isOwner = event.committeeId.equals
    ? event.committeeId.equals(committee._id)
    : event.committeeId.toString() === committee._id.toString();
  return { isOwner, event, committee };
}

/**
 * Programmatic verification of deal participation.
 * Allows deal participants (Company owner or Committee owner) and Admin.
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} dealId
 * @param {string} role - user's role
 * @returns {Promise<{ isParticipant: boolean, participantRole: string, deal: Object, company: Object, committee: Object }>}
 */
async function verifyDealParticipation(userId, dealId, role) {
  const deal = await Deal.findById(dealId);
  if (!deal) {
    throw ApiError.notFound('Deal not found', null, 'DEAL_NOT_FOUND');
  }

  if (role === ROLES.ADMIN) {
    return { isParticipant: true, participantRole: ROLES.ADMIN, deal, company: null, committee: null };
  }

  if (role === ROLES.COMPANY) {
    const company = await Company.findOne({ userId });
    if (company && deal.companyId.equals(company._id)) {
      return { isParticipant: true, participantRole: ROLES.COMPANY, deal, company, committee: null };
    }
  } else if (role === ROLES.COMMITTEE) {
    const committee = await Committee.findOne({ userId });
    if (committee && deal.committeeId.equals(committee._id)) {
      return { isParticipant: true, participantRole: ROLES.COMMITTEE, deal, company: null, committee };
    }
  }

  return { isParticipant: false, participantRole: null, deal, company: null, committee: null };
}

module.exports = {
  assertRole,
  assertOwnership,
  canAccessCompany,
  canAccessCommittee,
  canAccessEvent,
  verifyCompanyOwnership,
  verifyCommitteeOwnership,
  verifyEventOwnership,
  verifyDealParticipation,
};

