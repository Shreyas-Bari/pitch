const mongoose = require('mongoose');
const { Committee, SelfReportedHistory, File } = require('../models');
const { ROLES, SELF_REPORTED_OWNER_TYPE } = require('../utils/constants');
const { canAccessCommittee } = require('./authorizationService');
const { toSelfReportedHistoryDTO } = require('./companyService');
const ApiError = require('../utils/apiError');

/**
 * Committee Service
 * Handles business logic, completeness scoring, sanitized projections,
 * private owner/admin operations, and self-reported history management.
 * Source: docs/PITCH_FINAL_BUILD_SPEC.md & docs/PITCH_DATABASE_FINAL.md Section 6, 25
 */

/**
 * Calculate dynamic profile completeness for Committee.
 * Checks required and recommended profile criteria.
 */
function calculateCommitteeCompleteness(committee) {
  if (!committee) {
    return { isProfileComplete: false, score: 0, missingFields: [] };
  }

  const doc = committee.toObject ? committee.toObject() : committee;
  const missingFields = [];

  // Criteria 1: Name
  if (!doc.name || !doc.name.trim()) {
    missingFields.push('name');
  }

  // Criteria 2: College Name
  if (!doc.college?.name || !doc.college.name.trim()) {
    missingFields.push('college.name');
  }

  // Criteria 3: College City Location
  if (!doc.college?.location?.city || !doc.college.location.city.trim()) {
    missingFields.push('college.location.city');
  }

  // Criteria 4: Description
  if (!doc.description || doc.description.trim().length < 10) {
    missingFields.push('description');
  }

  // Criteria 5: Committee Type
  if (!doc.committeeType || !doc.committeeType.trim()) {
    missingFields.push('committeeType');
  }

  // Criteria 6: Contact Phone
  if (!doc.contact?.phone || !doc.contact.phone.trim()) {
    missingFields.push('contact.phone');
  }

  // Criteria 7: Website or Social Presence
  const hasWebsite = doc.website && doc.website.trim();
  const hasSocial =
    doc.socialLinks &&
    (doc.socialLinks.instagram?.trim() ||
      doc.socialLinks.linkedin?.trim() ||
      doc.socialLinks.website?.trim());
  if (!hasWebsite && !hasSocial) {
    missingFields.push('websiteOrSocial');
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
 * Public Committee Profile DTO
 * Strips sensitive/internal fields: userId, contact (phone/email), __v
 */
function toPublicCommitteeDTO(committee) {
  if (!committee) return null;
  const doc = committee.toObject ? committee.toObject() : { ...committee };

  return {
    _id: doc._id,
    name: doc.name,
    college: {
      name: doc.college?.name || '',
      location: {
        city: doc.college?.location?.city || '',
        state: doc.college?.location?.state || '',
        country: doc.college?.location?.country || 'India',
      },
    },
    logoFileId: doc.logoFileId || null,
    coverFileId: doc.coverFileId || null,
    description: doc.description || '',
    committeeType: doc.committeeType || '',
    website: doc.website || '',
    socialLinks: {
      instagram: doc.socialLinks?.instagram || '',
      linkedin: doc.socialLinks?.linkedin || '',
      website: doc.socialLinks?.website || '',
    },
    isProfileComplete: Boolean(doc.isProfileComplete),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Get public committee profile.
 */
async function getPublicCommittee(committeeId) {
  if (!committeeId || !mongoose.Types.ObjectId.isValid(committeeId)) {
    throw ApiError.badRequest('Invalid committee ID format', null, 'INVALID_ID');
  }

  const committee = await Committee.findById(committeeId);
  if (!committee) {
    throw ApiError.notFound('Committee not found', null, 'COMMITTEE_NOT_FOUND');
  }

  return toPublicCommitteeDTO(committee);
}

/**
 * Get private committee profile for owner or admin.
 */
async function getPrivateCommittee(committeeId, requestingUser) {
  if (!committeeId || !mongoose.Types.ObjectId.isValid(committeeId)) {
    throw ApiError.badRequest('Invalid committee ID format', null, 'INVALID_ID');
  }

  const committee = await Committee.findById(committeeId);
  if (!committee) {
    throw ApiError.notFound('Committee not found', null, 'COMMITTEE_NOT_FOUND');
  }

  if (!canAccessCommittee(requestingUser, committee)) {
    throw ApiError.forbidden(
      'Access denied. You do not own this committee resource.',
      null,
      'FORBIDDEN'
    );
  }

  const completeness = calculateCommitteeCompleteness(committee);
  return { committee, completeness };
}

/**
 * Get committee profile by linked user ID (for /committees/me).
 */
async function getCommitteeByUserId(userId) {
  const committee = await Committee.findOne({ userId });
  if (!committee) {
    throw ApiError.notFound('Committee profile not found for user', null, 'COMMITTEE_NOT_FOUND');
  }

  const completeness = calculateCommitteeCompleteness(committee);
  return { committee, completeness };
}

/**
 * List public committee profiles with pagination and marketplace filters.
 */
async function listCommittees(query = {}) {
  const filter = {};

  if (query.search) {
    const s = String(query.search).trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { 'college.name': { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } },
      { committeeType: { $regex: s, $options: 'i' } },
    ];
  }

  if (query.committeeType) {
    filter.committeeType = { $regex: String(query.committeeType).trim(), $options: 'i' };
  }

  if (query.collegeName) {
    filter['college.name'] = { $regex: String(query.collegeName).trim(), $options: 'i' };
  }

  if (query.city) {
    filter['college.location.city'] = { $regex: String(query.city).trim(), $options: 'i' };
  }

  if (query.state) {
    filter['college.location.state'] = { $regex: String(query.state).trim(), $options: 'i' };
  }

  if (query.isProfileComplete !== undefined) {
    filter.isProfileComplete = query.isProfileComplete === 'true' || query.isProfileComplete === true;
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [total, committees] = await Promise.all([
    Committee.countDocuments(filter),
    Committee.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    committees: committees.map(toPublicCommitteeDTO),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Update committee profile (Owner or Admin).
 */
async function updateCommittee(committeeId, updateData = {}, requestingUser) {
  if (!committeeId || !mongoose.Types.ObjectId.isValid(committeeId)) {
    throw ApiError.badRequest('Invalid committee ID format', null, 'INVALID_ID');
  }

  const committee = await Committee.findById(committeeId);
  if (!committee) {
    throw ApiError.notFound('Committee not found', null, 'COMMITTEE_NOT_FOUND');
  }

  if (!canAccessCommittee(requestingUser, committee)) {
    throw ApiError.forbidden(
      'Access denied. You do not own this committee resource.',
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
  if (updateData.name !== undefined) committee.name = updateData.name.trim();
  if (updateData.description !== undefined) committee.description = updateData.description;
  if (updateData.committeeType !== undefined) committee.committeeType = updateData.committeeType.trim();
  if (updateData.website !== undefined) committee.website = updateData.website.trim();
  if (updateData.logoFileId !== undefined) committee.logoFileId = updateData.logoFileId;
  if (updateData.coverFileId !== undefined) committee.coverFileId = updateData.coverFileId;

  if (updateData.college) {
    const existingCollege = committee.college || {};
    const existingLocation = existingCollege.location || {};
    committee.college = {
      name: updateData.college.name !== undefined ? updateData.college.name.trim() : (existingCollege.name || ''),
      location: {
        city: updateData.college.location?.city !== undefined
          ? updateData.college.location.city.trim()
          : (existingLocation.city || ''),
        state: updateData.college.location?.state !== undefined
          ? updateData.college.location.state.trim()
          : (existingLocation.state || ''),
        country: updateData.college.location?.country !== undefined
          ? updateData.college.location.country.trim()
          : (existingLocation.country || 'India'),
      },
    };
  }

  if (updateData.contact) {
    committee.contact = {
      phone: updateData.contact.phone !== undefined ? updateData.contact.phone.trim() : (committee.contact?.phone || ''),
      email: updateData.contact.email !== undefined ? updateData.contact.email.trim() : (committee.contact?.email || ''),
    };
  }

  if (updateData.socialLinks) {
    committee.socialLinks = {
      instagram: updateData.socialLinks.instagram !== undefined ? updateData.socialLinks.instagram.trim() : (committee.socialLinks?.instagram || ''),
      linkedin: updateData.socialLinks.linkedin !== undefined ? updateData.socialLinks.linkedin.trim() : (committee.socialLinks?.linkedin || ''),
      website: updateData.socialLinks.website !== undefined ? updateData.socialLinks.website.trim() : (committee.socialLinks?.website || ''),
    };
  }

  // Recalculate profile completeness dynamically
  const completeness = calculateCommitteeCompleteness(committee);
  committee.isProfileComplete = completeness.isProfileComplete;

  await committee.save();

  return { committee, completeness };
}

/**
 * Update current user's committee profile.
 */
async function updateMyCommittee(userId, updateData = {}) {
  const committee = await Committee.findOne({ userId });
  if (!committee) {
    throw ApiError.notFound('Committee profile not found for user', null, 'COMMITTEE_NOT_FOUND');
  }

  return updateCommittee(committee._id, updateData, { _id: userId, role: ROLES.COMMITTEE });
}

/**
 * Public lookup of self-reported history for a committee.
 */
async function getCommitteeHistory(committeeId) {
  if (!committeeId || !mongoose.Types.ObjectId.isValid(committeeId)) {
    throw ApiError.badRequest('Invalid committee ID format', null, 'INVALID_ID');
  }

  const committee = await Committee.findById(committeeId);
  if (!committee) {
    throw ApiError.notFound('Committee not found', null, 'COMMITTEE_NOT_FOUND');
  }

  const entries = await SelfReportedHistory.find({
    ownerType: SELF_REPORTED_OWNER_TYPE.COMMITTEE,
    ownerId: committeeId,
  }).sort({ date: -1 });

  return entries.map(toSelfReportedHistoryDTO);
}

/**
 * Get self-reported history for the authenticated committee owner.
 */
async function getMyHistory(userId) {
  const committee = await Committee.findOne({ userId });
  if (!committee) {
    throw ApiError.notFound('Committee profile not found for user', null, 'COMMITTEE_NOT_FOUND');
  }

  const entries = await SelfReportedHistory.find({
    ownerType: SELF_REPORTED_OWNER_TYPE.COMMITTEE,
    ownerId: committee._id,
  }).sort({ date: -1 });

  return entries.map(toSelfReportedHistoryDTO);
}

/**
 * Create a new self-reported history entry for the authenticated committee owner.
 */
async function createMyHistory(userId, historyData = {}) {
  const committee = await Committee.findOne({ userId });
  if (!committee) {
    throw ApiError.notFound('Committee profile not found for user', null, 'COMMITTEE_NOT_FOUND');
  }

  const entry = await SelfReportedHistory.create({
    ownerType: SELF_REPORTED_OWNER_TYPE.COMMITTEE,
    ownerId: committee._id,
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
 * Update an existing self-reported history entry for the authenticated committee owner.
 */
async function updateMyHistory(userId, historyId, historyData = {}) {
  if (!historyId || !mongoose.Types.ObjectId.isValid(historyId)) {
    throw ApiError.badRequest('Invalid history ID format', null, 'INVALID_ID');
  }

  const committee = await Committee.findOne({ userId });
  if (!committee) {
    throw ApiError.notFound('Committee profile not found for user', null, 'COMMITTEE_NOT_FOUND');
  }

  const entry = await SelfReportedHistory.findOne({
    _id: historyId,
    ownerType: SELF_REPORTED_OWNER_TYPE.COMMITTEE,
    ownerId: committee._id,
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
 * Delete a self-reported history entry for the authenticated committee owner.
 */
async function deleteMyHistory(userId, historyId) {
  if (!historyId || !mongoose.Types.ObjectId.isValid(historyId)) {
    throw ApiError.badRequest('Invalid history ID format', null, 'INVALID_ID');
  }

  const committee = await Committee.findOne({ userId });
  if (!committee) {
    throw ApiError.notFound('Committee profile not found for user', null, 'COMMITTEE_NOT_FOUND');
  }

  const deleted = await SelfReportedHistory.findOneAndDelete({
    _id: historyId,
    ownerType: SELF_REPORTED_OWNER_TYPE.COMMITTEE,
    ownerId: committee._id,
  });

  if (!deleted) {
    throw ApiError.notFound('History record not found', null, 'HISTORY_NOT_FOUND');
  }

  return true;
}

module.exports = {
  calculateCommitteeCompleteness,
  toPublicCommitteeDTO,
  getPublicCommittee,
  getPrivateCommittee,
  getCommitteeByUserId,
  listCommittees,
  updateCommittee,
  updateMyCommittee,
  getCommitteeHistory,
  getMyHistory,
  createMyHistory,
  updateMyHistory,
  deleteMyHistory,
};
