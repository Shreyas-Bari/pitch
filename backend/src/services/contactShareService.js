const mongoose = require('mongoose');
const { ContactShare, Conversation, Message, Company, Committee } = require('../models');
const ApiError = require('../utils/apiError');
const { MESSAGE_TYPE, ROLES, NOTIFICATION_TYPE } = require('../utils/constants');
const { verifyConversationAccess } = require('./messageService');
const notificationService = require('./notificationService');

/**
 * Contact Sharing Service
 * Sources: docs/PITCH_API_FINAL.md Section 11 & docs/PITCH_FINAL_BUILD_SPEC.md Section 37, Step 15
 */

async function shareContact(conversationId, userId, userRole, contactData) {
  const { conversation, role, entity } = await verifyConversationAccess(conversationId, userId, userRole);

  const contact = {
    email: contactData.email ? String(contactData.email).trim() : '',
    phone: contactData.phone ? String(contactData.phone).trim() : '',
    whatsapp: contactData.whatsapp ? String(contactData.whatsapp).trim() : (contactData.phone ? String(contactData.phone).trim() : ''),
    other: contactData.other ? String(contactData.other).trim() : '',
  };

  if (!contact.email && !contact.phone && !contact.whatsapp) {
    throw ApiError.badRequest('At least one contact method (email, phone, or whatsapp) is required', null, 'VALIDATION_ERROR');
  }

  const contactShare = await ContactShare.create({
    conversationId: conversation._id,
    sharedByUserId: userId,
    contact,
  });

  // Also post a CONTACT card message in the chat
  const senderName = entity ? entity.name : 'Participant';
  const contactMsg = await Message.create({
    conversationId: conversation._id,
    senderUserId: userId,
    type: MESSAGE_TYPE.CONTACT,
    text: `${senderName} shared direct contact details (${contact.email || contact.phone || contact.whatsapp})`,
    contactShareId: contactShare._id,
    metadata: { contact },
    readBy: [{ userId, readAt: new Date() }],
  });

  conversation.lastMessageId = contactMsg._id;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  // Notify recipient
  let recipientUserId = null;
  if (role === 'COMPANY') {
    const committee = await Committee.findById(conversation.participantCommitteeId);
    if (committee) recipientUserId = committee.userId;
  } else if (role === 'COMMITTEE') {
    const company = await Company.findById(conversation.participantCompanyId);
    if (company) recipientUserId = company.userId;
  }

  if (recipientUserId && String(recipientUserId) !== String(userId)) {
    await notificationService.createNotification({
      recipientUserId,
      type: NOTIFICATION_TYPE.NEW_MESSAGE,
      title: 'Contact Details Shared',
      message: `${senderName} shared direct contact details with you.`,
      entityType: 'CONVERSATION',
      entityId: conversation._id,
    });
  }

  return contactShare;
}

async function getContactShares(conversationId, userId, userRole) {
  await verifyConversationAccess(conversationId, userId, userRole);

  const contactShares = await ContactShare.find({ conversationId })
    .populate('sharedByUserId', 'name email role')
    .sort({ createdAt: 1 });

  return contactShares;
}

module.exports = {
  shareContact,
  getContactShares,
};
