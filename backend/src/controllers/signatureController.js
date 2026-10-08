const signatureService = require('../services/signatureService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Signature Controller
 * Source of Truth: docs/PITCH_API_FINAL.md Section 15
 */

async function getSigningStatus(req, res, next) {
  try {
    const mouId = req.params.mouId || req.params.id;
    const status = await signatureService.getSigningStatus({
      mouId,
      userId: req.user._id,
      role: req.user.role,
    });
    return sendSuccess(res, status, 200);
  } catch (err) {
    next(err);
  }
}

async function signMou(req, res, next) {
  try {
    const mouId = req.params.mouId || req.params.id;
    const reqMeta = {
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    const result = await signatureService.signMou({
      mouId,
      userId: req.user._id,
      role: req.user.role,
      data: req.body,
      reqMeta,
    });
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function getSignatures(req, res, next) {
  try {
    const mouId = req.params.mouId || req.params.id;
    const signatures = await signatureService.getSignatures({
      mouId,
      userId: req.user._id,
      role: req.user.role,
    });
    return sendSuccess(res, signatures, 200);
  } catch (err) {
    next(err);
  }
}

async function getExecutedDocument(req, res, next) {
  try {
    const mouId = req.params.mouId || req.params.id;
    const executedDoc = await signatureService.getExecutedDocument({
      mouId,
      userId: req.user._id,
      role: req.user.role,
    });
    return sendSuccess(res, executedDoc, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSigningStatus,
  signMou,
  getSignatures,
  getExecutedDocument,
};
