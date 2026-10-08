const mongoose = require('mongoose');
const { Committee } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Public Committee Profile DTO
 * Strips sensitive/internal fields: userId, contact (phone/email), __v
 * Source: docs/PITCH_API_FINAL.md Section 3 & docs/PITCH_FINAL_BUILD_SPEC.md Section 35
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
    socialLinks: doc.socialLinks || {},
    isProfileComplete: Boolean(doc.isProfileComplete),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * GET /api/v1/committees/:committeeId
 * Public marketplace profile lookup
 */
async function getCommittee(req, res, next) {
  try {
    const { committeeId } = req.params;
    if (!committeeId || !mongoose.Types.ObjectId.isValid(committeeId)) {
      throw ApiError.badRequest('Invalid committee ID format', null, 'INVALID_ID');
    }

    const committee = await Committee.findById(committeeId);
    if (!committee) {
      throw ApiError.notFound('Committee not found', null, 'COMMITTEE_NOT_FOUND');
    }

    return sendSuccess(res, { committee: toPublicCommitteeDTO(committee) }, 200);
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
    const committee = req.committee || (await Committee.findById(req.params.committeeId));
    if (!committee) {
      throw ApiError.notFound('Committee not found', null, 'COMMITTEE_NOT_FOUND');
    }
    return sendSuccess(res, { committee }, 200);
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
    const committee = req.committee || (await Committee.findById(req.params.committeeId));
    if (!committee) {
      throw ApiError.notFound('Committee not found', null, 'COMMITTEE_NOT_FOUND');
    }

    const { name, college, description, committeeType, website, contact, socialLinks } = req.body;
    if (name) committee.name = name;
    if (college) committee.college = { ...committee.college, ...college };
    if (description !== undefined) committee.description = description;
    if (committeeType !== undefined) committee.committeeType = committeeType;
    if (website !== undefined) committee.website = website;
    if (contact) committee.contact = { ...committee.contact, ...contact };
    if (socialLinks) committee.socialLinks = { ...committee.socialLinks, ...socialLinks };

    await committee.save();
    return sendSuccess(res, { committee }, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCommittee,
  getPublicCommittee: getCommittee,
  getPrivateCommittee,
  updateCommittee,
  toPublicCommitteeDTO,
};
