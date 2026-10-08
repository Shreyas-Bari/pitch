const mongoose = require('mongoose');
const { SponsorshipPackage, Event, Committee } = require('../models');
const ApiError = require('../utils/apiError');
const { ROLES, SPONSORSHIP_PACKAGE_STATUS } = require('../utils/constants');

/**
 * Sponsorship Package Service
 * Sources: docs/PITCH_API_FINAL.md Section 5 & docs/PITCH_FINAL_BUILD_SPEC.md Section 16, Step 8
 */

async function createPackage(eventId, userId, userRole, data) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw ApiError.badRequest('Invalid event ID format', null, 'INVALID_ID');
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND');
  }

  if (userRole !== ROLES.ADMIN) {
    const committee = await Committee.findOne({ userId });
    if (!committee || String(committee._id) !== String(event.committeeId)) {
      throw ApiError.forbidden('You do not own this event', null, 'FORBIDDEN');
    }
  }

  const packageDoc = await SponsorshipPackage.create({
    eventId: event._id,
    title: data.title.trim(),
    description: data.description ? data.description.trim() : '',
    contributionTypes: Array.isArray(data.contributionTypes) ? data.contributionTypes : ['CASH'],
    cashRequirement: data.cashRequirement || { amount: 0, currency: 'INR' },
    nonCashRequirements: data.nonCashRequirements || [],
    benefits: data.benefits || [],
    availability: data.availability !== undefined ? data.availability : 1,
    status: data.status || SPONSORSHIP_PACKAGE_STATUS.AVAILABLE,
  });

  return packageDoc;
}

async function getPackagesByEvent(eventId, user = null) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw ApiError.badRequest('Invalid event ID format', null, 'INVALID_ID');
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND');
  }

  const filter = { eventId };
  // If not owner or admin, only show AVAILABLE packages
  let isOwner = false;
  if (user) {
    if (user.role === ROLES.ADMIN) {
      isOwner = true;
    } else if (user.role === ROLES.COMMITTEE) {
      const committee = await Committee.findOne({ userId: user._id });
      if (committee && String(committee._id) === String(event.committeeId)) {
        isOwner = true;
      }
    }
  }

  if (!isOwner) {
    filter.status = { $ne: SPONSORSHIP_PACKAGE_STATUS.INACTIVE };
  }

  const packages = await SponsorshipPackage.find(filter).sort({ 'cashRequirement.amount': 1, createdAt: 1 });
  return packages;
}

async function getPackageById(packageId) {
  if (!mongoose.Types.ObjectId.isValid(packageId)) {
    throw ApiError.badRequest('Invalid package ID format', null, 'INVALID_ID');
  }

  const packageDoc = await SponsorshipPackage.findById(packageId).populate('eventId');
  if (!packageDoc) {
    throw ApiError.notFound('Sponsorship package not found', null, 'PACKAGE_NOT_FOUND');
  }

  return packageDoc;
}

async function updatePackage(packageId, userId, userRole, data) {
  if (!mongoose.Types.ObjectId.isValid(packageId)) {
    throw ApiError.badRequest('Invalid package ID format', null, 'INVALID_ID');
  }

  const packageDoc = await SponsorshipPackage.findById(packageId);
  if (!packageDoc) {
    throw ApiError.notFound('Sponsorship package not found', null, 'PACKAGE_NOT_FOUND');
  }

  if (userRole !== ROLES.ADMIN) {
    const event = await Event.findById(packageDoc.eventId);
    const committee = await Committee.findOne({ userId });
    if (!committee || !event || String(committee._id) !== String(event.committeeId)) {
      throw ApiError.forbidden('You do not have permission to update this package', null, 'FORBIDDEN');
    }
  }

  if (data.title !== undefined) packageDoc.title = data.title.trim();
  if (data.description !== undefined) packageDoc.description = data.description.trim();
  if (data.contributionTypes !== undefined) packageDoc.contributionTypes = data.contributionTypes;
  if (data.cashRequirement !== undefined) packageDoc.cashRequirement = { ...packageDoc.cashRequirement, ...data.cashRequirement };
  if (data.nonCashRequirements !== undefined) packageDoc.nonCashRequirements = data.nonCashRequirements;
  if (data.benefits !== undefined) packageDoc.benefits = data.benefits;
  if (data.availability !== undefined) packageDoc.availability = data.availability;
  if (data.status !== undefined) packageDoc.status = data.status;

  await packageDoc.save();
  return packageDoc;
}

async function deletePackage(packageId, userId, userRole) {
  if (!mongoose.Types.ObjectId.isValid(packageId)) {
    throw ApiError.badRequest('Invalid package ID format', null, 'INVALID_ID');
  }

  const packageDoc = await SponsorshipPackage.findById(packageId);
  if (!packageDoc) {
    throw ApiError.notFound('Sponsorship package not found', null, 'PACKAGE_NOT_FOUND');
  }

  if (userRole !== ROLES.ADMIN) {
    const event = await Event.findById(packageDoc.eventId);
    const committee = await Committee.findOne({ userId });
    if (!committee || !event || String(committee._id) !== String(event.committeeId)) {
      throw ApiError.forbidden('You do not have permission to delete this package', null, 'FORBIDDEN');
    }
  }

  await SponsorshipPackage.findByIdAndDelete(packageId);
  return { message: 'Package deleted successfully' };
}

module.exports = {
  createPackage,
  getPackagesByEvent,
  getPackageById,
  updatePackage,
  deletePackage,
};
