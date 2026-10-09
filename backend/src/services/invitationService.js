const mongoose = require('mongoose');
const { Invitation, Event, Company, Committee, SponsorshipPackage, Deal } = require('../models');
const ApiError = require('../utils/apiError');
const { INVITATION_STATUS, ROLES, NOTIFICATION_TYPE, DEAL_STATUS } = require('../utils/constants');
const notificationService = require('./notificationService');
const conversationService = require('./conversationService');

/**
 * Invitation Service
 * Sources: docs/PITCH_API_FINAL.md Section 9 & docs/PITCH_FINAL_BUILD_SPEC.md Section 18, 49, Step 11
 */

async function sendInvitation(committeeUserId, eventId, data) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw ApiError.badRequest('Invalid event ID format', null, 'INVALID_ID');
  }

  const committee = await Committee.findOne({ userId: committeeUserId });
  if (!committee) {
    throw ApiError.badRequest('Committee profile required', null, 'PROFILE_REQUIRED');
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND');
  }

  if (String(event.committeeId) !== String(committee._id)) {
    throw ApiError.forbidden('You do not own this event', null, 'FORBIDDEN');
  }

  const company = await Company.findById(data.companyId);
  if (!company) {
    throw ApiError.notFound('Company not found', null, 'COMPANY_NOT_FOUND');
  }

  // Prevent duplicate active invitation
  const existingPending = await Invitation.findOne({
    eventId,
    companyId: company._id,
    status: INVITATION_STATUS.PENDING,
  });

  if (existingPending) {
    throw ApiError.conflict('An active invitation is already pending for this company and event', null, 'DUPLICATE_INVITATION');
  }

  let packageId = null;
  if (data.packageId) {
    if (!mongoose.Types.ObjectId.isValid(data.packageId)) {
      throw ApiError.badRequest('Invalid package ID format', null, 'INVALID_ID');
    }
    const pkg = await SponsorshipPackage.findOne({ _id: data.packageId, eventId });
    if (!pkg) {
      throw ApiError.badRequest('Sponsorship package not found for this event', null, 'PACKAGE_NOT_FOUND');
    }
    packageId = pkg._id;
  }

  const invitation = await Invitation.create({
    eventId: event._id,
    committeeId: committee._id,
    companyId: company._id,
    packageId,
    message: data.message ? data.message.trim() : '',
    status: INVITATION_STATUS.PENDING,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
  });

  // Notify company user
  if (company.userId) {
    await notificationService.createNotification({
      recipientUserId: company.userId,
      type: NOTIFICATION_TYPE.INVITATION_RECEIVED,
      title: 'New Sponsorship Invitation',
      message: `${committee.name} invited your company to sponsor "${event.title}"`,
      entityType: 'INVITATION',
      entityId: invitation._id,
    });
  }

  return invitation;
}

async function listInvitations(userId, userRole, query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.status) {
    filter.status = query.status;
  }

  if (userRole === ROLES.COMPANY) {
    const company = await Company.findOne({ userId });
    if (!company) throw ApiError.badRequest('Company profile required', null, 'PROFILE_REQUIRED');
    filter.companyId = company._id;
  } else if (userRole === ROLES.COMMITTEE) {
    const committee = await Committee.findOne({ userId });
    if (!committee) throw ApiError.badRequest('Committee profile required', null, 'PROFILE_REQUIRED');
    filter.committeeId = committee._id;
  } else if (userRole !== ROLES.ADMIN) {
    throw ApiError.forbidden('Unauthorized to list invitations', null, 'FORBIDDEN');
  }

  const [total, invitations] = await Promise.all([
    Invitation.countDocuments(filter),
    Invitation.find(filter)
      .populate('eventId', 'title eventDate status location bannerFileId')
      .populate('committeeId', 'name college logoFileId verificationStatus')
      .populate('companyId', 'name industry logoFileId location')
      .populate('packageId', 'title cashRequirement nonCashRequirements')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    invitations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getInvitationById(invitationId, userId, userRole) {
  if (!mongoose.Types.ObjectId.isValid(invitationId)) {
    throw ApiError.badRequest('Invalid invitation ID format', null, 'INVALID_ID');
  }

  const invitation = await Invitation.findById(invitationId)
    .populate('eventId')
    .populate('committeeId')
    .populate('companyId')
    .populate('packageId');

  if (!invitation) {
    throw ApiError.notFound('Invitation not found', null, 'INVITATION_NOT_FOUND');
  }

  if (userRole !== ROLES.ADMIN) {
    let hasAccess = false;
    if (userRole === ROLES.COMPANY) {
      const company = await Company.findOne({ userId });
      if (company && String(company._id) === String(invitation.companyId._id)) {
        hasAccess = true;
      }
    } else if (userRole === ROLES.COMMITTEE) {
      const committee = await Committee.findOne({ userId });
      if (committee && String(committee._id) === String(invitation.committeeId._id)) {
        hasAccess = true;
      }
    }
    if (!hasAccess) {
      throw ApiError.forbidden('Unauthorized access to invitation', null, 'FORBIDDEN');
    }
  }

  return invitation;
}

async function acceptInvitation(invitationId, companyUserId) {
  if (!mongoose.Types.ObjectId.isValid(invitationId)) {
    throw ApiError.badRequest('Invalid invitation ID format', null, 'INVALID_ID');
  }

  const company = await Company.findOne({ userId: companyUserId });
  if (!company) throw ApiError.badRequest('Company profile required', null, 'PROFILE_REQUIRED');

  const invitation = await Invitation.findById(invitationId)
    .populate('eventId')
    .populate('committeeId');

  if (!invitation) throw ApiError.notFound('Invitation not found', null, 'INVITATION_NOT_FOUND');

  if (String(invitation.companyId) !== String(company._id)) {
    throw ApiError.forbidden('You are not the recipient of this invitation', null, 'FORBIDDEN');
  }

  if (invitation.status !== INVITATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Cannot accept invitation with status ${invitation.status}`, null, 'INVALID_STATE');
  }

  invitation.status = INVITATION_STATUS.ACCEPTED;
  invitation.respondedAt = new Date();
  await invitation.save();

  // Establish Conversation between company and committee
  const conversation = await conversationService.getOrCreateConversation({
    companyId: invitation.companyId,
    committeeId: invitation.committeeId._id,
    eventId: invitation.eventId._id,
  });

  // Ensure an active Deal exists and is linked for this accepted invitation
  let deal = await Deal.findOne({
    eventId: invitation.eventId._id,
    companyId: invitation.companyId,
    committeeId: invitation.committeeId._id,
    status: {
      $nin: [
        DEAL_STATUS.DECLINED,
        DEAL_STATUS.CANCELLED,
        DEAL_STATUS.EXPIRED,
      ],
    },
  });

  if (!deal) {
    deal = await Deal.create({
      eventId: invitation.eventId._id,
      companyId: invitation.companyId,
      committeeId: invitation.committeeId._id,
      invitationId: invitation._id,
      conversationId: conversation._id,
      status: DEAL_STATUS.INTERESTED,
    });
  } else {
    let modified = false;
    if (!deal.invitationId) {
      deal.invitationId = invitation._id;
      modified = true;
    }
    if (!deal.conversationId) {
      deal.conversationId = conversation._id;
      modified = true;
    }
    if (modified) await deal.save();
  }

  if (!conversation.dealId) {
    conversation.dealId = deal._id;
    await conversation.save();
  }

  // Notify committee
  if (invitation.committeeId && invitation.committeeId.userId) {
    await notificationService.createNotification({
      recipientUserId: invitation.committeeId.userId,
      type: NOTIFICATION_TYPE.INVITATION_ACCEPTED,
      title: 'Invitation Accepted!',
      message: `${company.name} accepted your invitation to sponsor "${invitation.eventId.title}"`,
      entityType: 'INVITATION',
      entityId: invitation._id,
    });
  }

  return { invitation, conversation, deal };
}

async function declineInvitation(invitationId, companyUserId) {
  if (!mongoose.Types.ObjectId.isValid(invitationId)) {
    throw ApiError.badRequest('Invalid invitation ID format', null, 'INVALID_ID');
  }

  const company = await Company.findOne({ userId: companyUserId });
  if (!company) throw ApiError.badRequest('Company profile required', null, 'PROFILE_REQUIRED');

  const invitation = await Invitation.findById(invitationId);
  if (!invitation) throw ApiError.notFound('Invitation not found', null, 'INVITATION_NOT_FOUND');

  if (String(invitation.companyId) !== String(company._id)) {
    throw ApiError.forbidden('You are not the recipient of this invitation', null, 'FORBIDDEN');
  }

  if (invitation.status !== INVITATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Cannot decline invitation with status ${invitation.status}`, null, 'INVALID_STATE');
  }

  invitation.status = INVITATION_STATUS.DECLINED;
  invitation.respondedAt = new Date();
  await invitation.save();

  return invitation;
}

async function cancelInvitation(invitationId, committeeUserId, userRole) {
  if (!mongoose.Types.ObjectId.isValid(invitationId)) {
    throw ApiError.badRequest('Invalid invitation ID format', null, 'INVALID_ID');
  }

  const invitation = await Invitation.findById(invitationId);
  if (!invitation) throw ApiError.notFound('Invitation not found', null, 'INVITATION_NOT_FOUND');

  if (userRole !== ROLES.ADMIN) {
    const committee = await Committee.findOne({ userId: committeeUserId });
    if (!committee || String(committee._id) !== String(invitation.committeeId)) {
      throw ApiError.forbidden('You do not own this invitation', null, 'FORBIDDEN');
    }
  }

  if (invitation.status !== INVITATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Cannot cancel invitation with status ${invitation.status}`, null, 'INVALID_STATE');
  }

  invitation.status = INVITATION_STATUS.CANCELLED;
  invitation.respondedAt = new Date();
  await invitation.save();

  return invitation;
}

module.exports = {
  sendInvitation,
  listInvitations,
  getInvitationById,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
};
