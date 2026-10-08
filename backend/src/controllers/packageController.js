const packageService = require('../services/packageService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Package Controller
 * Sources: docs/PITCH_API_FINAL.md Section 5 & docs/PITCH_FINAL_BUILD_SPEC.md Section 16, Step 8
 */

async function createPackage(req, res, next) {
  try {
    const packageDoc = await packageService.createPackage(
      req.params.eventId,
      req.user._id,
      req.user.role,
      req.body
    );
    return sendSuccess(res, { package: packageDoc }, 201);
  } catch (err) {
    next(err);
  }
}

async function getPackagesByEvent(req, res, next) {
  try {
    const packages = await packageService.getPackagesByEvent(req.params.eventId, req.user);
    return sendSuccess(res, { packages }, 200);
  } catch (err) {
    next(err);
  }
}

async function getPackage(req, res, next) {
  try {
    const packageDoc = await packageService.getPackageById(req.params.packageId);
    return sendSuccess(res, { package: packageDoc }, 200);
  } catch (err) {
    next(err);
  }
}

async function updatePackage(req, res, next) {
  try {
    const packageDoc = await packageService.updatePackage(
      req.params.packageId,
      req.user._id,
      req.user.role,
      req.body
    );
    return sendSuccess(res, { package: packageDoc }, 200);
  } catch (err) {
    next(err);
  }
}

async function deletePackage(req, res, next) {
  try {
    const result = await packageService.deletePackage(
      req.params.packageId,
      req.user._id,
      req.user.role
    );
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPackage,
  getPackagesByEvent,
  getPackage,
  updatePackage,
  deletePackage,
};
