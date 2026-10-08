const mongoose = require('mongoose');
const { Company, SelfReportedHistory, File } = require('../models');
const { ROLES, SELF_REPORTED_OWNER_TYPE } = require('../utils/constants');
const { canAccessCompany } = require('./authorizationService');
const ApiError = require('../utils/apiError');

/**
 * Company Service
 * Handles business logic, completeness scoring, sanitized projections,
 * private owner/admin operations, and self-reported history management.
 * Source: docs/PITCH_FINAL_BUILD_SPEC.md & docs/PITCH_DATABASE_FINAL.md Section 5, 25
 */

/**
 * Calculate dynamic profile completeness for Company.
 * Checks required and recommended profile criteria.
 */
function calculateCompanyCompleteness(company) {
  if (!company) {
    return { isProfileComplete: false, score: 0, missingFields: [] };
  }

  const doc = company.toObject ? company.toObject() : company;
  const missingFields = [];

  // Criteria 1: Name
  if (!doc.name || !doc.name.trim()) {
    missingFields.push('name');
  }

  // Criteria 2: Description
  if (!doc.description || doc.description.trim().length < 10) {
    missingFields.push('description');
  }

  // Criteria 3: Industry
  if (!doc.industry || !doc.industry.trim()) {
    missingFields.push('industry');
  }

  // Criteria 4: Website or Social Presence
  const hasWebsite = doc.website && doc.website.trim();
  const hasSocial =
    doc.socialLinks &&
    (doc.socialLinks.linkedin?.trim() ||
      doc.socialLinks.instagram?.trim() ||
      doc.socialLinks.website?.trim());
  if (!hasWebsite && !hasSocial) {
    missingFields.push('websiteOrSocial');
  }

  // Criteria 5: Location (City and State)
  const hasCity = doc.location?.city && doc.location.city.trim();
  const hasState = doc.location?.state && doc.location.state.trim();
  if (!hasCity || !hasState) {
    missingFields.push('location');
  }

  // Criteria 6: Contact Phone
  if (!doc.contact?.phone || !doc.contact.phone.trim()) {
    missingFields.push('contact.phone');
  }

  // Criteria 7: Sponsorship Preferences
  const prefs = doc.sponsorshipPreferences || {};
  const hasPrefs =
    (Array.isArray(prefs.eventCategories) && prefs.eventCategories.length > 0) ||
    (Array.isArray(prefs.preferredLocations) && prefs.preferredLocations.length > 0) ||
    (Array.isArray(prefs.contributionTypes) && prefs.contributionTypes.length > 0) ||
    (typeof prefs.budgetMax === 'number' && prefs.budgetMax > 0);
  if (!hasPrefs) {
    missingFields.push('sponsorshipPreferences');
  }

  const totalCriteria = 7;
  const completedCount = totalCriteria - missingFields.length;
  const score = Math.round((completedCount / totalCriteria) * 100);
  const isProfileComplete = missingFields.length === 0;

  return {
    isProfileComplete,
    score,
    missingFields,
  };
}

/**
 * Public Company Profile DTO
 * Strips sensitive/internal fields: userId, legalName, contact (phone/email), __v
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
    socialLinks: {
      linkedin: doc.socialLinks?.linkedin || '',
      instagram: doc.socialLinks?.instagram || '',
      website: doc.socialLinks?.website || '',
    },
    sponsorshipPreferences: {
      eventCategories: doc.sponsorshipPreferences?.eventCategories || [],
      preferredLocations: doc.sponsorshipPreferences?.preferredLocations || [],
      targetAudience: doc.sponsorshipPreferences?.targetAudience || [],
      budgetMin: doc.sponsorshipPreferences?.budgetMin ?? 0,
      budgetMax: doc.sponsorshipPreferences?.budgetMax ?? 0,
      contributionTypes: doc.sponsorshipPreferences?.contributionTypes || [],
    },
    isProfileComplete: Boolean(doc.isProfileComplete),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * SelfReportedHistory DTO
 * Guarantees verificationStatus is explicitly SELF_REPORTED
 */
function toSelfReportedHistoryDTO(history) {
  if (!history) return null;
  const doc = history.toObject ? history.toObject() : { ...history };

  return {
    _id: doc._id,
    ownerType: doc.ownerType,
    ownerId: doc.ownerId,
    title: doc.title,
    description: doc.description || '',
    eventName: doc.eventName,
    partnerName: doc.partnerName,
    date: doc.date,
    mediaFileIds: doc.mediaFileIds || [],
    verificationStatus: 'SELF_REPORTED',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Get public company profile.
 */
async function getPublicCompany(companyId) {
  if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
    throw ApiError.badRequest('Invalid company ID format', null, 'INVALID_ID');
  }

  const company = await Company.findById(companyId);
  if (!company) {
    throw ApiError.notFound('Company not found', null, 'COMPANY_NOT_FOUND');
  }

  return toPublicCompanyDTO(company);
}

/**
 * Get private company profile for owner or admin.
 */
async function getPrivateCompany(companyId, requestingUser) {
  if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
    throw ApiError.badRequest('Invalid company ID format', null, 'INVALID_ID');
  }

  const company = await Company.findById(companyId);
  if (!company) {
    throw ApiError.notFound('Company not found', null, 'COMPANY_NOT_FOUND');
  }

  if (!canAccessCompany(requestingUser, company)) {
    throw ApiError.forbidden(
      'Access denied. You do not own this company resource.',
      null,
      'FORBIDDEN'
    );
  }

  const completeness = calculateCompanyCompleteness(company);
  return { company, completeness };
}

/**
 * Get company profile by linked user ID (for /companies/me).
 */
async function getCompanyByUserId(userId) {
  const company = await Company.findOne({ userId });
  if (!company) {
    throw ApiError.notFound('Company profile not found for user', null, 'COMPANY_NOT_FOUND');
  }

  const completeness = calculateCompanyCompleteness(company);
  return { company, completeness };
}

/**
 * List public company profiles with pagination and marketplace filters.
 */
async function listCompanies(query = {}) {
  const filter = {};

  if (query.search) {
    const s = String(query.search).trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { industry: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } },
    ];
  }

  if (query.industry) {
    filter.industry = { $regex: String(query.industry).trim(), $options: 'i' };
  }

  if (query.city) {
    filter['location.city'] = { $regex: String(query.city).trim(), $options: 'i' };
  }

  if (query.state) {
    filter['location.state'] = { $regex: String(query.state).trim(), $options: 'i' };
  }

  if (query.minBudget) {
    const min = Number(query.minBudget);
    if (!isNaN(min)) {
      filter['sponsorshipPreferences.budgetMax'] = { $gte: min };
    }
  }

  if (query.maxBudget) {
    const max = Number(query.maxBudget);
    if (!isNaN(max)) {
      filter['sponsorshipPreferences.budgetMin'] = { $lte: max };
    }
  }

  if (query.isProfileComplete !== undefined) {
    filter.isProfileComplete = query.isProfileComplete === 'true' || query.isProfileComplete === true;
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [total, companies] = await Promise.all([
    Company.countDocuments(filter),
    Company.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    companies: companies.map(toPublicCompanyDTO),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Update company profile (Owner or Admin).
 */
async function updateCompany(companyId, updateData = {}, requestingUser) {
  if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
    throw ApiError.badRequest('Invalid company ID format', null, 'INVALID_ID');
  }

  const company = await Company.findById(companyId);
  if (!company) {
    throw ApiError.notFound('Company not found', null, 'COMPANY_NOT_FOUND');
  }

  if (!canAccessCompany(requestingUser, company)) {
    throw ApiError.forbidden(
      'Access denied. You do not own this company resource.',
      null,
      'FORBIDDEN'
    );
  }

  // Validate referenced media file if provided
  if (updateData.logoFileId) {
    const file = await File.findById(updateData.logoFileId);
    if (!file) {
      throw ApiError.badRequest('Referenced logo file not found', null, 'FILE_NOT_FOUND');
    }
  }

  if (updateData.coverFileId) {
    const file = await File.findById(updateData.coverFileId);
    if (!file) {
      throw ApiError.badRequest('Referenced cover file not found', null, 'FILE_NOT_FOUND');
    }
  }

  // Apply updates
  if (updateData.name !== undefined) company.name = updateData.name.trim();
  if (updateData.legalName !== undefined) company.legalName = updateData.legalName?.trim() || '';
  if (updateData.description !== undefined) company.description = updateData.description;
  if (updateData.industry !== undefined) company.industry = updateData.industry.trim();
  if (updateData.website !== undefined) company.website = updateData.website.trim();
  if (updateData.logoFileId !== undefined) company.logoFileId = updateData.logoFileId;
  if (updateData.coverFileId !== undefined) company.coverFileId = updateData.coverFileId;

  if (updateData.location) {
    company.location = {
      city: updateData.location.city !== undefined ? updateData.location.city.trim() : (company.location?.city || ''),
      state: updateData.location.state !== undefined ? updateData.location.state.trim() : (company.location?.state || ''),
      country: updateData.location.country !== undefined ? updateData.location.country.trim() : (company.location?.country || 'India'),
    };
  }

  if (updateData.contact) {
    company.contact = {
      phone: updateData.contact.phone !== undefined ? updateData.contact.phone.trim() : (company.contact?.phone || ''),
      email: updateData.contact.email !== undefined ? updateData.contact.email.trim() : (company.contact?.email || ''),
    };
  }

  if (updateData.socialLinks) {
    company.socialLinks = {
      linkedin: updateData.socialLinks.linkedin !== undefined ? updateData.socialLinks.linkedin.trim() : (company.socialLinks?.linkedin || ''),
      instagram: updateData.socialLinks.instagram !== undefined ? updateData.socialLinks.instagram.trim() : (company.socialLinks?.instagram || ''),
      website: updateData.socialLinks.website !== undefined ? updateData.socialLinks.website.trim() : (company.socialLinks?.website || ''),
    };
  }

  if (updateData.sponsorshipPreferences) {
    const existingPrefs = company.sponsorshipPreferences || {};
    company.sponsorshipPreferences = {
      eventCategories: updateData.sponsorshipPreferences.eventCategories !== undefined
        ? updateData.sponsorshipPreferences.eventCategories
        : (existingPrefs.eventCategories || []),
      preferredLocations: updateData.sponsorshipPreferences.preferredLocations !== undefined
        ? updateData.sponsorshipPreferences.preferredLocations
        : (existingPrefs.preferredLocations || []),
      targetAudience: updateData.sponsorshipPreferences.targetAudience !== undefined
        ? updateData.sponsorshipPreferences.targetAudience
        : (existingPrefs.targetAudience || []),
      budgetMin: updateData.sponsorshipPreferences.budgetMin !== undefined
        ? updateData.sponsorshipPreferences.budgetMin
        : (existingPrefs.budgetMin ?? 0),
      budgetMax: updateData.sponsorshipPreferences.budgetMax !== undefined
        ? updateData.sponsorshipPreferences.budgetMax
        : (existingPrefs.budgetMax ?? 0),
      contributionTypes: updateData.sponsorshipPreferences.contributionTypes !== undefined
        ? updateData.sponsorshipPreferences.contributionTypes
        : (existingPrefs.contributionTypes || []),
    };
  }

  // Recalculate profile completeness dynamically
  const completeness = calculateCompanyCompleteness(company);
  company.isProfileComplete = completeness.isProfileComplete;

  await company.save();

  return { company, completeness };
}

/**
 * Update current user's company profile.
 */
async function updateMyCompany(userId, updateData = {}) {
  const company = await Company.findOne({ userId });
  if (!company) {
    throw ApiError.notFound('Company profile not found for user', null, 'COMPANY_NOT_FOUND');
  }

  return updateCompany(company._id, updateData, { _id: userId, role: ROLES.COMPANY });
}

/**
 * Public lookup of self-reported history for a company.
 */
async function getCompanyHistory(companyId) {
  if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
    throw ApiError.badRequest('Invalid company ID format', null, 'INVALID_ID');
  }

  const company = await Company.findById(companyId);
  if (!company) {
    throw ApiError.notFound('Company not found', null, 'COMPANY_NOT_FOUND');
  }

  const entries = await SelfReportedHistory.find({
    ownerType: SELF_REPORTED_OWNER_TYPE.COMPANY,
    ownerId: companyId,
  }).sort({ date: -1 });

  return entries.map(toSelfReportedHistoryDTO);
}

/**
 * Get self-reported history for the authenticated company owner.
 */
async function getMyHistory(userId) {
  const company = await Company.findOne({ userId });
  if (!company) {
    throw ApiError.notFound('Company profile not found for user', null, 'COMPANY_NOT_FOUND');
  }

  const entries = await SelfReportedHistory.find({
    ownerType: SELF_REPORTED_OWNER_TYPE.COMPANY,
    ownerId: company._id,
  }).sort({ date: -1 });

  return entries.map(toSelfReportedHistoryDTO);
}

/**
 * Create a new self-reported history entry for the authenticated company owner.
 */
async function createMyHistory(userId, historyData = {}) {
  const company = await Company.findOne({ userId });
  if (!company) {
    throw ApiError.notFound('Company profile not found for user', null, 'COMPANY_NOT_FOUND');
  }

  const entry = await SelfReportedHistory.create({
    ownerType: SELF_REPORTED_OWNER_TYPE.COMPANY,
    ownerId: company._id,
    title: historyData.title.trim(),
    eventName: historyData.eventName.trim(),
    partnerName: historyData.partnerName.trim(),
    date: new Date(historyData.date),
    description: historyData.description || '',
    mediaFileIds: historyData.mediaFileIds || [],
    verificationStatus: 'SELF_REPORTED',
  });

  return toSelfReportedHistoryDTO(entry);
}

/**
 * Update an existing self-reported history entry for the authenticated company owner.
 */
async function updateMyHistory(userId, historyId, historyData = {}) {
  if (!historyId || !mongoose.Types.ObjectId.isValid(historyId)) {
    throw ApiError.badRequest('Invalid history ID format', null, 'INVALID_ID');
  }

  const company = await Company.findOne({ userId });
  if (!company) {
    throw ApiError.notFound('Company profile not found for user', null, 'COMPANY_NOT_FOUND');
  }

  const entry = await SelfReportedHistory.findOne({
    _id: historyId,
    ownerType: SELF_REPORTED_OWNER_TYPE.COMPANY,
    ownerId: company._id,
  });

  if (!entry) {
    throw ApiError.notFound('History record not found', null, 'HISTORY_NOT_FOUND');
  }

  if (historyData.title !== undefined) entry.title = historyData.title.trim();
  if (historyData.eventName !== undefined) entry.eventName = historyData.eventName.trim();
  if (historyData.partnerName !== undefined) entry.partnerName = historyData.partnerName.trim();
  if (historyData.date !== undefined) entry.date = new Date(historyData.date);
  if (historyData.description !== undefined) entry.description = historyData.description;
  if (historyData.mediaFileIds !== undefined) entry.mediaFileIds = historyData.mediaFileIds;

  // Ensure verification status remains strictly SELF_REPORTED
  entry.verificationStatus = 'SELF_REPORTED';

  await entry.save();
  return toSelfReportedHistoryDTO(entry);
}

/**
 * Delete a self-reported history entry for the authenticated company owner.
 */
async function deleteMyHistory(userId, historyId) {
  if (!historyId || !mongoose.Types.ObjectId.isValid(historyId)) {
    throw ApiError.badRequest('Invalid history ID format', null, 'INVALID_ID');
  }

  const company = await Company.findOne({ userId });
  if (!company) {
    throw ApiError.notFound('Company profile not found for user', null, 'COMPANY_NOT_FOUND');
  }

  const deleted = await SelfReportedHistory.findOneAndDelete({
    _id: historyId,
    ownerType: SELF_REPORTED_OWNER_TYPE.COMPANY,
    ownerId: company._id,
  });

  if (!deleted) {
    throw ApiError.notFound('History record not found', null, 'HISTORY_NOT_FOUND');
  }

  return true;
}

module.exports = {
  calculateCompanyCompleteness,
  toPublicCompanyDTO,
  toSelfReportedHistoryDTO,
  getPublicCompany,
  getPrivateCompany,
  getCompanyByUserId,
  listCompanies,
  updateCompany,
  updateMyCompany,
  getCompanyHistory,
  getMyHistory,
  createMyHistory,
  updateMyHistory,
  deleteMyHistory,
};
