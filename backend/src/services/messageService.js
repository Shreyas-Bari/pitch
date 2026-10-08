const mongoose = require('mongoose');
const { Message, Conversation, Company, Committee, File } = require('../models');
const ApiError = require('../utils/apiError');
const { MESSAGE_TYPE, ROLES, NOTIFICATION_TYPE } = require('../utils/constants');
const notificationService = require('./notificationService');

let socketIoInstance = null;

function setSocketIo(io) {
  socketIoInstance = io;
}

async function verifyConversationAccess(conversationId, userId, userRole) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw ApiError.badRequest('Invalid conversation ID format', null, 'INVALID_ID');
  }

  const conversation = await Conversation.findById(conversationId)
    .populate('participantCompanyId')
    .populate('participantCommitteeId');

  if (!conversation) {
    throw ApiError.notFound('Conversation not found', null, 'CONVERSATION_NOT_FOUND');
  }

  if (userRole === ROLES.ADMIN) {
    return { conversation, role: 'ADMIN' };
  }

  let userCompany = null;
  let userCommittee = null;

  if (userRole === ROLES.COMPANY) {
    userCompany = await Company.findOne({ userId });
    if (userCompany && String(userCompany._id) === String(conversation.participantCompanyId._id || conversation.participantCompanyId)) {
      return { conversation, role: 'COMPANY', entity: userCompany };
    }
  } else if (userRole === ROLES.COMMITTEE) {
    userCommittee = await Committee.findOne({ userId });
    if (userCommittee && String(userCommittee._id) === String(conversation.participantCommitteeId._id || conversation.participantCommitteeId)) {
      return { conversation, role: 'COMMITTEE', entity: userCommittee };
    }
  }

  throw ApiError.forbidden('You are not a participant in this conversation', null, 'FORBIDDEN');
}

async function sendMessage({ conversationId, senderUserId, userRole, data }) {
  const { conversation, role, entity } = await verifyConversationAccess(conversationId, senderUserId, userRole);

  const type = data.type || MESSAGE_TYPE.TEXT;
  if (!Object.values(MESSAGE_TYPE).includes(type)) {
    throw ApiError.badRequest('Invalid message type', null, 'INVALID_TYPE');
  }

  if (type === MESSAGE_TYPE.TEXT && (!data.text || !data.text.trim())) {
    throw ApiError.badRequest('Message text is required', null, 'VALIDATION_ERROR');
  }

  let fileId = null;
  if (data.fileId) {
    if (!mongoose.Types.ObjectId.isValid(data.fileId)) {
      throw ApiError.badRequest('Invalid file ID format', null, 'INVALID_ID');
    }
    const file = await File.findById(data.fileId);
    if (!file) throw ApiError.badRequest('File not found', null, 'INVALID_FILE');
    fileId = file._id;
  }

  let replyToMessageId = null;
  if (data.replyToMessageId) {
    if (!mongoose.Types.ObjectId.isValid(data.replyToMessageId)) {
      throw ApiError.badRequest('Invalid reply message ID format', null, 'INVALID_ID');
    }
    const replyMsg = await Message.findById(data.replyToMessageId);
    if (replyMsg && String(replyMsg.conversationId) === String(conversation._id)) {
      replyToMessageId = replyMsg._id;
    }
  }

  // Validate optional card references if provided
  let eventId = null;
  if (data.eventId) {
    if (!mongoose.Types.ObjectId.isValid(data.eventId)) {
      throw ApiError.badRequest('Invalid event ID format', null, 'INVALID_ID');
    }
    eventId = data.eventId;
  }

  let packageId = null;
  if (data.packageId) {
    if (!mongoose.Types.ObjectId.isValid(data.packageId)) {
      throw ApiError.badRequest('Invalid package ID format', null, 'INVALID_ID');
    }
    packageId = data.packageId;
  }

  let contactShareId = null;
  if (data.contactShareId) {
    if (!mongoose.Types.ObjectId.isValid(data.contactShareId)) {
      throw ApiError.badRequest('Invalid contact share ID format', null, 'INVALID_ID');
    }
    contactShareId = data.contactShareId;
  }

  let proposalId = null;
  if (data.proposalId) {
    if (!mongoose.Types.ObjectId.isValid(data.proposalId)) {
      throw ApiError.badRequest('Invalid proposal ID format', null, 'INVALID_ID');
    }
    proposalId = data.proposalId;
  }

  let dealId = null;
  if (data.dealId) {
    if (!mongoose.Types.ObjectId.isValid(data.dealId)) {
      throw ApiError.badRequest('Invalid deal ID format', null, 'INVALID_ID');
    }
    dealId = data.dealId;
  }

  let mouId = null;
  if (data.mouId) {
    if (!mongoose.Types.ObjectId.isValid(data.mouId)) {
      throw ApiError.badRequest('Invalid MoU ID format', null, 'INVALID_ID');
    }
    mouId = data.mouId;
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderUserId,
    type,
    text: data.text ? data.text.trim() : '',
    fileId,
    replyToMessageId,
    eventId,
    packageId,
    contactShareId,
    proposalId,
    dealId,
    mouId,
    metadata: data.metadata || null,
    readBy: [{ userId: senderUserId, readAt: new Date() }],
  });

  // Update conversation last message
  conversation.lastMessageId = message._id;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  // Populate message for socket/return
  await message.populate('senderUserId', 'name email role');
  if (fileId) await message.populate('fileId');
  if (eventId) await message.populate('eventId');
  if (packageId) await message.populate('packageId');
  if (contactShareId) await message.populate('contactShareId');

  // Push via Socket.IO to standard and underscore room names
  if (socketIoInstance) {
    socketIoInstance.to(`conversation:${conversation._id}`).to(`conversation_${conversation._id}`).emit('message:new', message);
  }

  // Push notification to recipient
  let recipientUserId = null;
  let senderName = 'Someone';

  if (role === 'COMPANY') {
    senderName = entity ? entity.name : 'Company';
    const committee = await Committee.findById(conversation.participantCommitteeId);
    if (committee) recipientUserId = committee.userId;
  } else if (role === 'COMMITTEE') {
    senderName = entity ? entity.name : 'Committee';
    const company = await Company.findById(conversation.participantCompanyId);
    if (company) recipientUserId = company.userId;
  }

  if (recipientUserId && String(recipientUserId) !== String(senderUserId)) {
    let previewText = message.text;
    if (!previewText) {
      if (type === MESSAGE_TYPE.EVENT_CARD) previewText = 'Shared an event';
      else if (type === MESSAGE_TYPE.PACKAGE_CARD) previewText = 'Shared a sponsorship package';
      else if (type === MESSAGE_TYPE.CONTACT) previewText = 'Shared contact details';
      else if (type === MESSAGE_TYPE.MOU_CARD) previewText = 'Shared an MoU';
      else if (type === MESSAGE_TYPE.PROPOSAL || type === MESSAGE_TYPE.COUNTER_PROPOSAL) previewText = 'Sent a proposal';
      else previewText = 'Sent an attachment';
    }

    await notificationService.createNotification({
      recipientUserId,
      type: NOTIFICATION_TYPE.NEW_MESSAGE,
      title: `Message from ${senderName}`,
      message: previewText.length > 60 ? `${previewText.slice(0, 57)}...` : previewText,
      entityType: 'CONVERSATION',
      entityId: conversation._id,
    });
  }

  return message;
}

async function getConversationMessages(conversationId, userId, userRole, query = {}) {
  await verifyConversationAccess(conversationId, userId, userRole);

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 50));
  const skip = (page - 1) * limit;

  const filter = { conversationId, deletedAt: null };

  const [total, messages] = await Promise.all([
    Message.countDocuments(filter),
    Message.find(filter)
      .populate('senderUserId', 'name email role')
      .populate('fileId')
      .populate('replyToMessageId')
      .populate('eventId')
      .populate('packageId')
      .populate('contactShareId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    messages: messages.reverse(), // return in chronological order
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function editMessage(messageId, userId, data) {
  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw ApiError.badRequest('Invalid message ID format', null, 'INVALID_ID');
  }

  const message = await Message.findById(messageId);
  if (!message) throw ApiError.notFound('Message not found', null, 'MESSAGE_NOT_FOUND');

  if (String(message.senderUserId) !== String(userId)) {
    throw ApiError.forbidden('You can only edit your own messages', null, 'FORBIDDEN');
  }

  if (message.deletedAt) {
    throw ApiError.badRequest('Cannot edit a deleted message', null, 'MESSAGE_DELETED');
  }

  if (!data.text || !data.text.trim()) {
    throw ApiError.badRequest('Message text is required', null, 'VALIDATION_ERROR');
  }

  message.text = data.text.trim();
  message.editedAt = new Date();
  await message.save();

  if (socketIoInstance) {
    socketIoInstance.to(`conversation_${message.conversationId}`).emit('message:edited', message);
  }

  return message;
}

async function deleteMessage(messageId, userId, userRole) {
  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw ApiError.badRequest('Invalid message ID format', null, 'INVALID_ID');
  }

  const message = await Message.findById(messageId);
  if (!message) throw ApiError.notFound('Message not found', null, 'MESSAGE_NOT_FOUND');

  if (userRole !== ROLES.ADMIN && String(message.senderUserId) !== String(userId)) {
    throw ApiError.forbidden('You can only delete your own messages', null, 'FORBIDDEN');
  }

  message.deletedAt = new Date();
  await message.save();

  if (socketIoInstance) {
    socketIoInstance.to(`conversation_${message.conversationId}`).emit('message:deleted', { messageId });
  }

  return { message: 'Message deleted successfully' };
}

async function markConversationAsRead(conversationId, userId, userRole) {
  await verifyConversationAccess(conversationId, userId, userRole);

  await Message.updateMany(
    {
      conversationId,
      'readBy.userId': { $ne: userId },
    },
    {
      $push: { readBy: { userId, readAt: new Date() } },
    }
  );

  if (socketIoInstance) {
    socketIoInstance.to(`conversation_${conversationId}`).emit('message:read', { conversationId, userId });
  }

  return { message: 'Conversation marked as read' };
}

module.exports = {
  sendMessage,
  getConversationMessages,
  editMessage,
  deleteMessage,
  markConversationAsRead,
  verifyConversationAccess,
  setSocketIo,
};
