const applicationService = require('../services/applicationService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');

/**
 * Application Controller
 * Sources: docs/PITCH_API_FINAL.md Section 8 & docs/PITCH_FINAL_BUILD_SPEC.md Section 17, 48, Step 10
 */

async function applyToEvent(req, res, next) {
  try {
    const application = await applicationService.applyToEvent(
      req.user._id,
      req.params.eventId,
      req.body
    );
    return sendSuccess(res, { application }, 201);
  } catch (err) {
    next(err);
  }
}

async function getEventApplications(req, res, next) {
  try {
    const result = await applicationService.getApplicationsForEvent(
      req.user._id,
      req.params.eventId,
      req.query
    );
    return sendPaginated(res, result.applications, result.pagination);
  } catch (err) {
    next(err);
  }
}

async function listApplications(req, res, next) {
  try {
    const result = await applicationService.listApplications(
      req.user._id,
      req.user.role,
      req.query
    );
    return sendPaginated(res, result.applications, result.pagination);
  } catch (err) {
    next(err);
  }
}

async function getApplication(req, res, next) {
  try {
    const application = await applicationService.getApplicationById(
      req.params.applicationId,
      req.user._id,
      req.user.role
    );
    return sendSuccess(res, { application }, 200);
  } catch (err) {
    next(err);
  }
}

async function updateApplication(req, res, next) {
  try {
    const application = await applicationService.updateApplication(
      req.params.applicationId,
      req.user._id,
      req.body
    );
    return sendSuccess(res, { application }, 200);
  } catch (err) {
    next(err);
  }
}

async function acceptApplication(req, res, next) {
  try {
    const result = await applicationService.acceptApplication(
      req.params.applicationId,
      req.user._id,
      req.user.role
    );
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function rejectApplication(req, res, next) {
  try {
    const application = await applicationService.rejectApplication(
      req.params.applicationId,
      req.user._id,
      req.user.role
    );
    return sendSuccess(res, { application }, 200);
  } catch (err) {
    next(err);
  }
}

async function withdrawApplication(req, res, next) {
  try {
    const application = await applicationService.withdrawApplication(
      req.params.applicationId,
      req.user._id
    );
    return sendSuccess(res, { application }, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  applyToEvent,
  getEventApplications,
  listApplications,
  getApplication,
  updateApplication,
  acceptApplication,
  rejectApplication,
  withdrawApplication,
};
