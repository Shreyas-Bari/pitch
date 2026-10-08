const invitationService = require('../services/invitationService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');

/**
 * Invitation Controller
 * Sources: docs/PITCH_API_FINAL.md Section 9 & docs/PITCH_FINAL_BUILD_SPEC.md Section 18, 49, Step 11
 */

async function sendInvitation(req, res, next) {
  try {
    const invitation = await invitationService.sendInvitation(
      req.user._id,
      req.params.eventId,
      req.body
    );
    return sendSuccess(res, { invitation }, 201);
  } catch (err) {
    next(err);
  }
}

async function listInvitations(req, res, next) {
  try {
    const result = await invitationService.listInvitations(
      req.user._id,
      req.user.role,
      req.query
    );
    return sendPaginated(res, result.invitations, result.pagination);
  } catch (err) {
    next(err);
  }
}

async function getInvitation(req, res, next) {
  try {
    const invitation = await invitationService.getInvitationById(
      req.params.invitationId,
      req.user._id,
      req.user.role
    );
    return sendSuccess(res, { invitation }, 200);
  } catch (err) {
    next(err);
  }
}

async function acceptInvitation(req, res, next) {
  try {
    const result = await invitationService.acceptInvitation(
      req.params.invitationId,
      req.user._id
    );
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function declineInvitation(req, res, next) {
  try {
    const invitation = await invitationService.declineInvitation(
      req.params.invitationId,
      req.user._id
    );
    return sendSuccess(res, { invitation }, 200);
  } catch (err) {
    next(err);
  }
}

async function cancelInvitation(req, res, next) {
  try {
    const invitation = await invitationService.cancelInvitation(
      req.params.invitationId,
      req.user._id,
      req.user.role
    );
    return sendSuccess(res, { invitation }, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  sendInvitation,
  listInvitations,
  getInvitation,
  acceptInvitation,
  declineInvitation,
  cancelInvitation,
};
