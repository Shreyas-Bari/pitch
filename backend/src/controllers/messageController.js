const messageService = require('../services/messageService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Message Controller
 * Sources: docs/PITCH_API_FINAL.md Section 10 & docs/PITCH_FINAL_BUILD_SPEC.md Section 20, Step 13
 */

async function editMessage(req, res, next) {
  try {
    const message = await messageService.editMessage(
      req.params.messageId,
      req.user._id,
      req.body
    );
    return sendSuccess(res, { message }, 200);
  } catch (err) {
    next(err);
  }
}

async function deleteMessage(req, res, next) {
  try {
    const result = await messageService.deleteMessage(
      req.params.messageId,
      req.user._id,
      req.user.role
    );
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  editMessage,
  deleteMessage,
};
