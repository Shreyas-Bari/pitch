const mongoose = require('mongoose');
const { Company } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Public Company Profile DTO
 * Strips sensitive/internal fields: userId, legalName, contact (phone/email), __v
 * Source: docs/PITCH_API_FINAL.md Section 3 & docs/PITCH_FINAL_BUILD_SPEC.md Section 35
 */
function toPublicCompanyDTO(company) {
  if (!company) return null;
  const doc = company.toObject ? company.toObject() : { ...company };

  return {
    _id: doc._id,
    name: doc.name,
    logoFileId: doc.logoFileId || null,
    coverFileId: doc.coverFileId || null,
    description: doc.description || '',
    industry: doc.industry || '',
    website: doc.website || '',
    location: {
      city: doc.location?.city || '',
      state: doc.location?.state || '',
      country: doc.location?.country || 'India',
    },
    socialLinks: doc.socialLinks || {},
    sponsorshipPreferences: doc.sponsorshipPreferences || {},
    isProfileComplete: Boolean(doc.isProfileComplete),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * GET /api/v1/companies/:companyId
 * Public marketplace profile lookup
 */
async function getCompany(req, res, next) {
  try {
    const { companyId } = req.params;
    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      throw ApiError.badRequest('Invalid company ID format', null, 'INVALID_ID');
    }

    const company = await Company.findById(companyId);
    if (!company) {
      throw ApiError.notFound('Company not found', null, 'COMPANY_NOT_FOUND');
    }

    return sendSuccess(res, { company: toPublicCompanyDTO(company) }, 200);
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
    const company = req.company || (await Company.findById(req.params.companyId));
    if (!company) {
      throw ApiError.notFound('Company not found', null, 'COMPANY_NOT_FOUND');
    }
    return sendSuccess(res, { company }, 200);
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
    const company = req.company || (await Company.findById(req.params.companyId));
    if (!company) {
      throw ApiError.notFound('Company not found', null, 'COMPANY_NOT_FOUND');
    }

    // Allowed updatable fields
    const {
      name,
      legalName,
      description,
      industry,
      website,
      location,
      contact,
      socialLinks,
      sponsorshipPreferences,
    } = req.body;

    if (name) company.name = name;
    if (legalName !== undefined) company.legalName = legalName;
    if (description !== undefined) company.description = description;
    if (industry !== undefined) company.industry = industry;
    if (website !== undefined) company.website = website;
    if (location) company.location = { ...company.location, ...location };
    if (contact) company.contact = { ...company.contact, ...contact };
    if (socialLinks) company.socialLinks = { ...company.socialLinks, ...socialLinks };
    if (sponsorshipPreferences) {
      company.sponsorshipPreferences = { ...company.sponsorshipPreferences, ...sponsorshipPreferences };
    }

    await company.save();
    return sendSuccess(res, { company }, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCompany,
  getPublicCompany: getCompany,
  getPrivateCompany,
  updateCompany,
  toPublicCompanyDTO,
};
