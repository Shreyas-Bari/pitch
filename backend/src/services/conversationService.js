const mongoose = require('mongoose');
const { Conversation, Company, Committee, Event, Deal, User } = require('../models');
const ApiError = require('../utils/apiError');
const { ROLES, CONVERSATION_STATUS } = require('../utils/constants');

/**
 * Conversation Service
 * Sources: docs/PITCH_API_FINAL.md Section 10 & docs/PITCH_FINAL_BUILD_SPEC.md Section 19, Step 13
 */

async function getOrCreateConversation({ companyId, committeeId, eventId = null, dealId = null }) {
  if (!mongoose.Types.ObjectId.isValid(companyId) || !mongoose.Types.ObjectId.isValid(committeeId)) {
    throw ApiError.badRequest('Invalid participant ID format', null, 'INVALID_ID');
  }

  const query = {
    participantCompanyId: companyId,
    participantCommitteeId: committeeId,
  };
  if (eventId) {
    query.eventId = eventId;
  }

  let conversation = await Conversation.findOne(query);

  if (!conversation) {
    conversation = await Conversation.create({
      participantCompanyId: companyId,
      participantCommitteeId: committeeId,
      eventId: eventId || null,
      dealId: dealId || null,
      status: CONVERSATION_STATUS.ACTIVE,
      lastMessageAt: new Date(),
    });
  } else {
    if (conversation.status === CONVERSATION_STATUS.ARCHIVED) {
      conversation.status = CONVERSATION_STATUS.ACTIVE;
      await conversation.save();
    }
    if (dealId && !conversation.dealId) {
      conversation.dealId = dealId;
      await conversation.save();
    }
  }

  return conversation;
}

async function listConversations(userId, userRole, query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};

  if (userRole === ROLES.COMPANY) {
    const company = await Company.findOne({ userId });
    if (!company) throw ApiError.badRequest('Company profile required', null, 'PROFILE_REQUIRED');
    filter.participantCompanyId = company._id;
  } else if (userRole === ROLES.COMMITTEE) {
    const committee = await Committee.findOne({ userId });
    if (!committee) throw ApiError.badRequest('Committee profile required', null, 'PROFILE_REQUIRED');
    filter.participantCommitteeId = committee._id;
  } else if (userRole !== ROLES.ADMIN) {
    throw ApiError.forbidden('Unauthorized to list conversations', null, 'FORBIDDEN');
  }

  if (query.status) {
    filter.status = query.status;
  }

  const [total, conversations] = await Promise.all([
    Conversation.countDocuments(filter),
    Conversation.find(filter)
      .populate('participantCompanyId', 'name industry logoFileId location isProfileComplete')
      .populate('participantCommitteeId', 'name college logoFileId verificationStatus')
      .populate('eventId', 'title eventDate status')
      .populate('lastMessageId')
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    conversations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getConversationById(conversationId, userId, userRole) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw ApiError.badRequest('Invalid conversation ID format', null, 'INVALID_ID');
  }

  const conversation = await Conversation.findById(conversationId)
    .populate('participantCompanyId', 'name industry logoFileId location contact')
    .populate('participantCommitteeId', 'name college logoFileId verificationStatus contact')
    .populate('eventId', 'title eventDate status bannerFileId')
    .populate('dealId', 'status agreedCommercials');

  if (!conversation) {
    throw ApiError.notFound('Conversation not found', null, 'CONVERSATION_NOT_FOUND');
  }

  if (userRole !== ROLES.ADMIN) {
    let hasAccess = false;
    if (userRole === ROLES.COMPANY) {
      const company = await Company.findOne({ userId });
      if (company && String(company._id) === String(conversation.participantCompanyId._id)) {
        hasAccess = true;
      }
    } else if (userRole === ROLES.COMMITTEE) {
      const committee = await Committee.findOne({ userId });
      if (committee && String(committee._id) === String(conversation.participantCommitteeId._id)) {
        hasAccess = true;
      }
    }
    if (!hasAccess) {
      throw ApiError.forbidden('You are not a participant in this conversation', null, 'FORBIDDEN');
    }
  }

  return conversation;
}

async function archiveConversation(conversationId, userId, userRole) {
  const conversation = await getConversationById(conversationId, userId, userRole);
  conversation.status = CONVERSATION_STATUS.ARCHIVED;
  await conversation.save();
  return conversation;
}

module.exports = {
  getOrCreateConversation,
  listConversations,
  getConversationById,
  archiveConversation,
};
