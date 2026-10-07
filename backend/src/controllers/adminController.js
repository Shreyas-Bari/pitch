const { User, AuditLog } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Admin Controller
 * Source: docs/PITCH_API_FINAL.md Section 20
 */

async function listUsers(req, res, next) {
  try {
    const users = await User.find().select('-refreshSessions').limit(50);
    return sendSuccess(res, { users }, 200);
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.userId).select('-refreshSessions');
    if (!user) {
      throw ApiError.notFound('User not found', null, 'USER_NOT_FOUND');
    }
    return sendSuccess(res, { user }, 200);
  } catch (err) {
    next(err);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { status },
      { new: true, runValidators: true }
    ).select('-refreshSessions');

    if (!user) {
      throw ApiError.notFound('User not found', null, 'USER_NOT_FOUND');
    }
    return sendSuccess(res, { user }, 200);
  } catch (err) {
    next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(50);
    return sendSuccess(res, { logs }, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  getUser,
  updateUserStatus,
  getAuditLogs,
};
