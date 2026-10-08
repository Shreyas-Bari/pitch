const conversationService = require('../services/conversationService');
const messageService = require('../services/messageService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');

/**
 * Conversation Controller
 * Sources: docs/PITCH_API_FINAL.md Section 10 & docs/PITCH_FINAL_BUILD_SPEC.md Section 19, Step 13
 */

async function listConversations(req, res, next) {
  try {
    const result = await conversationService.listConversations(
      req.user._id,
      req.user.role,
      req.query
    );
    return sendPaginated(res, result.conversations, result.pagination);
  } catch (err) {
    next(err);
  }
}

async function createConversation(req, res, next) {
  try {
    const conversation = await conversationService.getOrCreateConversation(req.body);
    return sendSuccess(res, { conversation }, 201);
  } catch (err) {
    next(err);
  }
}

async function getConversation(req, res, next) {
  try {
    const conversation = await conversationService.getConversationById(
      req.params.conversationId,
      req.user._id,
      req.user.role
    );
    return sendSuccess(res, { conversation }, 200);
  } catch (err) {
    next(err);
  }
}

async function archiveConversation(req, res, next) {
  try {
    const conversation = await conversationService.archiveConversation(
      req.params.conversationId,
      req.user._id,
      req.user.role
    );
    return sendSuccess(res, { conversation }, 200);
  } catch (err) {
    next(err);
  }
}

async function getMessages(req, res, next) {
  try {
    const result = await messageService.getConversationMessages(
      req.params.conversationId,
      req.user._id,
      req.user.role,
      req.query
    );
    return sendPaginated(res, result.messages, result.pagination);
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const message = await messageService.sendMessage({
      conversationId: req.params.conversationId,
      senderUserId: req.user._id,
      userRole: req.user.role,
      data: req.body,
    });
    return sendSuccess(res, { message }, 201);
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const result = await messageService.markConversationAsRead(
      req.params.conversationId,
      req.user._id,
      req.user.role
    );
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function shareContact(req, res, next) {
  try {
    const contactShareService = require('../services/contactShareService');
    const contactShare = await contactShareService.shareContact(
      req.params.conversationId,
      req.user._id,
      req.user.role,
      req.body
    );
    return sendSuccess(res, { contactShare }, 201);
  } catch (err) {
    next(err);
  }
}

async function getContactShares(req, res, next) {
  try {
    const contactShareService = require('../services/contactShareService');
    const contactShares = await contactShareService.getContactShares(
      req.params.conversationId,
      req.user._id,
      req.user.role
    );
    return sendSuccess(res, { contactShares }, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listConversations,
  createConversation,
  getConversation,
  archiveConversation,
  getMessages,
  sendMessage,
  markAsRead,
  shareContact,
  getContactShares,
};
