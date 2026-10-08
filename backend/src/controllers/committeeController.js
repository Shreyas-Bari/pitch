const committeeService = require('../services/committeeService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');

/**
 * Committee Controller
 * Handles incoming HTTP requests for public discovery, private owner/admin
 * profile operations, completeness details, and self-reported history.
 * Source: docs/PITCH_API_FINAL.md Section 3 & docs/PITCH_FINAL_BUILD_SPEC.md Section 35
 */

/**
 * GET /api/v1/committees/:committeeId
 * Public marketplace profile lookup
 */
async function getCommittee(req, res, next) {
  try {
    const committee = await committeeService.getPublicCommittee(req.params.committeeId);
    return sendSuccess(res, { committee }, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/committees
 * Public marketplace search, filtering, and pagination
 */
async function listCommittees(req, res, next) {
  try {
    const result = await committeeService.listCommittees(req.query);
    return sendPaginated(res, result.committees, result.pagination, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/committees/me
 * Private owner profile lookup
 */
async function getMyCommittee(req, res, next) {
  try {
    const result = await committeeService.getCommitteeByUserId(req.user._id);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/committees/:committeeId/private
 * Private full profile lookup (Owner or Admin only)
 */
async function getPrivateCommittee(req, res, next) {
  try {
    const result = await committeeService.getPrivateCommittee(req.params.committeeId, req.user);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH/PUT /api/v1/committees/me
 * Private owner profile update
 */
async function updateMyCommittee(req, res, next) {
  try {
    const result = await committeeService.updateMyCommittee(req.user._id, req.body);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT/PATCH /api/v1/committees/:committeeId
 * Private profile update (Owner or Admin only)
 */
async function updateCommittee(req, res, next) {
  try {
    const result = await committeeService.updateCommittee(req.params.committeeId, req.body, req.user);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/committees/:committeeId/history
 * Public lookup of self-reported committee history
 */
async function getCommitteeHistory(req, res, next) {
  try {
    const history = await committeeService.getCommitteeHistory(req.params.committeeId);
    return sendSuccess(res, { history }, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/committees/me/history
 * Owner lookup of self-reported history
 */
async function getMyHistory(req, res, next) {
  try {
    const history = await committeeService.getMyHistory(req.user._id);
    return sendSuccess(res, { history }, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/committees/me/history
 * Owner creates self-reported history entry
 */
async function createMyHistory(req, res, next) {
  try {
    const history = await committeeService.createMyHistory(req.user._id, req.body);
    return sendSuccess(res, { history }, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH/PUT /api/v1/committees/me/history/:historyId
 * Owner updates self-reported history entry
 */
async function updateMyHistory(req, res, next) {
  try {
    const history = await committeeService.updateMyHistory(
      req.user._id,
      req.params.historyId,
      req.body
    );
    return sendSuccess(res, { history }, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/committees/me/history/:historyId
 * Owner deletes self-reported history entry
 */
async function deleteMyHistory(req, res, next) {
  try {
    await committeeService.deleteMyHistory(req.user._id, req.params.historyId);
    return sendSuccess(res, { message: 'History entry deleted successfully' }, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCommittee,
  getPublicCommittee: getCommittee,
  getPrivateCommittee,
  getMyCommittee,
  updateCommittee,
  updateMyCommittee,
  listCommittees,
  getCommitteeHistory,
  getMyHistory,
  createMyHistory,
  updateMyHistory,
  deleteMyHistory,
  toPublicCommitteeDTO: committeeService.toPublicCommitteeDTO,
};
