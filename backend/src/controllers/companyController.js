const companyService = require('../services/companyService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');

/**
 * Company Controller
 * Handles incoming HTTP requests for public discovery, private owner/admin
 * profile operations, completeness details, and self-reported history.
 * Source: docs/PITCH_API_FINAL.md Section 3 & docs/PITCH_FINAL_BUILD_SPEC.md Section 35
 */

/**
 * GET /api/v1/companies/:companyId
 * Public marketplace profile lookup
 */
async function getCompany(req, res, next) {
  try {
    const company = await companyService.getPublicCompany(req.params.companyId);
    return sendSuccess(res, { company }, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/companies
 * Public marketplace search, filtering, and pagination
 */
async function listCompanies(req, res, next) {
  try {
    const result = await companyService.listCompanies(req.query);
    return sendPaginated(res, result.companies, result.pagination, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/companies/me
 * Private owner profile lookup
 */
async function getMyCompany(req, res, next) {
  try {
    const result = await companyService.getCompanyByUserId(req.user._id);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/companies/:companyId/private
 * Private full profile lookup (Owner or Admin only)
 */
async function getPrivateCompany(req, res, next) {
  try {
    const result = await companyService.getPrivateCompany(req.params.companyId, req.user);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH/PUT /api/v1/companies/me
 * Private owner profile update
 */
async function updateMyCompany(req, res, next) {
  try {
    const result = await companyService.updateMyCompany(req.user._id, req.body);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT/PATCH /api/v1/companies/:companyId
 * Private profile update (Owner or Admin only)
 */
async function updateCompany(req, res, next) {
  try {
    const result = await companyService.updateCompany(req.params.companyId, req.body, req.user);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/companies/:companyId/history
 * Public lookup of self-reported company history
 */
async function getCompanyHistory(req, res, next) {
  try {
    const history = await companyService.getCompanyHistory(req.params.companyId);
    return sendSuccess(res, { history }, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/companies/me/history
 * Owner lookup of self-reported history
 */
async function getMyHistory(req, res, next) {
  try {
    const history = await companyService.getMyHistory(req.user._id);
    return sendSuccess(res, { history }, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/companies/me/history
 * Owner creates self-reported history entry
 */
async function createMyHistory(req, res, next) {
  try {
    const history = await companyService.createMyHistory(req.user._id, req.body);
    return sendSuccess(res, { history }, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH/PUT /api/v1/companies/me/history/:historyId
 * Owner updates self-reported history entry
 */
async function updateMyHistory(req, res, next) {
  try {
    const history = await companyService.updateMyHistory(
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
 * DELETE /api/v1/companies/me/history/:historyId
 * Owner deletes self-reported history entry
 */
async function deleteMyHistory(req, res, next) {
  try {
    await companyService.deleteMyHistory(req.user._id, req.params.historyId);
    return sendSuccess(res, { message: 'History entry deleted successfully' }, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCompany,
  getPublicCompany: getCompany,
  getPrivateCompany,
  getMyCompany,
  updateCompany,
  updateMyCompany,
  listCompanies,
  getCompanyHistory,
  getMyHistory,
  createMyHistory,
  updateMyHistory,
  deleteMyHistory,
  toPublicCompanyDTO: companyService.toPublicCompanyDTO,
};
