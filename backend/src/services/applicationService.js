const mongoose = require('mongoose');
const { Application, Event, Company, Committee, SponsorshipPackage } = require('../models');
const ApiError = require('../utils/apiError');
const { APPLICATION_STATUS, EVENT_STATUS, ROLES, NOTIFICATION_TYPE } = require('../utils/constants');
const notificationService = require('./notificationService');
const conversationService = require('./conversationService');

/**
 * Application Service
 * Sources: docs/PITCH_API_FINAL.md Section 8 & docs/PITCH_FINAL_BUILD_SPEC.md Section 17, 48, Step 10
 */

async function applyToEvent(companyUserId, eventId, data) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw ApiError.badRequest('Invalid event ID format', null, 'INVALID_ID');
  }

  const company = await Company.findOne({ userId: companyUserId });
  if (!company) {
    throw ApiError.badRequest('Company profile required to apply for events', null, 'PROFILE_REQUIRED');
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND');
  }

  if (event.status !== EVENT_STATUS.PUBLISHED) {
    throw ApiError.badRequest('Event is not currently open for sponsorship applications', null, 'EVENT_NOT_PUBLISHED');
  }

  // Check for active application (PENDING or ACCEPTED)
  const existingActive = await Application.findOne({
    eventId,
    companyId: company._id,
    status: { $in: [APPLICATION_STATUS.PENDING, APPLICATION_STATUS.ACCEPTED] },
  });

  if (existingActive) {
    throw ApiError.conflict('An active application already exists for this event', null, 'DUPLICATE_APPLICATION');
  }

  let packageId = null;
  if (data.packageId) {
    if (!mongoose.Types.ObjectId.isValid(data.packageId)) {
      throw ApiError.badRequest('Invalid package ID format', null, 'INVALID_ID');
    }
    const pkg = await SponsorshipPackage.findOne({ _id: data.packageId, eventId });
    if (!pkg) {
      throw ApiError.badRequest('Sponsorship package not found for this event', null, 'PACKAGE_NOT_FOUND');
    }
    packageId = pkg._id;
  }

  const application = await Application.create({
    eventId: event._id,
    companyId: company._id,
    packageId,
    message: data.message ? data.message.trim() : '',
    proposedContribution: data.proposedContribution || {
      types: ['CASH'],
      cash: { amount: 0, currency: 'INR' },
      nonCash: [],
    },
    status: APPLICATION_STATUS.PENDING,
  });

  // Notify committee
  const committee = await Committee.findById(event.committeeId);
  if (committee && committee.userId) {
    await notificationService.createNotification({
      recipientUserId: committee.userId,
      type: NOTIFICATION_TYPE.APPLICATION_RECEIVED,
      title: 'New Sponsorship Application',
      message: `${company.name} applied for "${event.title}"`,
      entityType: 'APPLICATION',
      entityId: application._id,
    });
  }

  return application;
}

async function getApplicationsForEvent(committeeUserId, eventId, query = {}) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw ApiError.badRequest('Invalid event ID format', null, 'INVALID_ID');
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND');
  }

  const committee = await Committee.findOne({ userId: committeeUserId });
  if (!committee || String(committee._id) !== String(event.committeeId)) {
    throw ApiError.forbidden('You do not own this event', null, 'FORBIDDEN');
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = { eventId };
  if (query.status) {
    filter.status = query.status;
  }

  const [total, applications] = await Promise.all([
    Application.countDocuments(filter),
    Application.find(filter)
      .populate('companyId', 'name industry website logoFileId location contact')
      .populate('packageId', 'title cashRequirement nonCashRequirements benefits')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function listApplications(userId, userRole, query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.status) {
    filter.status = query.status;
  }

  if (userRole === ROLES.COMPANY) {
    const company = await Company.findOne({ userId });
    if (!company) throw ApiError.badRequest('Company profile required', null, 'PROFILE_REQUIRED');
    filter.companyId = company._id;
  } else if (userRole === ROLES.COMMITTEE) {
    const committee = await Committee.findOne({ userId });
    if (!committee) throw ApiError.badRequest('Committee profile required', null, 'PROFILE_REQUIRED');
    const myEvents = await Event.find({ committeeId: committee._id }).select('_id');
    filter.eventId = { $in: myEvents.map(e => e._id) };
  } else if (userRole !== ROLES.ADMIN) {
    throw ApiError.forbidden('Unauthorized to list applications', null, 'FORBIDDEN');
  }

  const [total, applications] = await Promise.all([
    Application.countDocuments(filter),
    Application.find(filter)
      .populate('eventId', 'title eventDate status committeeId bannerFileId')
      .populate('companyId', 'name industry logoFileId location')
      .populate('packageId', 'title cashRequirement')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getApplicationById(applicationId, userId, userRole) {
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    throw ApiError.badRequest('Invalid application ID format', null, 'INVALID_ID');
  }

  const application = await Application.findById(applicationId)
    .populate('eventId')
    .populate('companyId')
    .populate('packageId');

  if (!application) {
    throw ApiError.notFound('Application not found', null, 'APPLICATION_NOT_FOUND');
  }

  if (userRole !== ROLES.ADMIN) {
    let hasAccess = false;
    if (userRole === ROLES.COMPANY) {
      const company = await Company.findOne({ userId });
      if (company && String(company._id) === String(application.companyId._id)) {
        hasAccess = true;
      }
    } else if (userRole === ROLES.COMMITTEE) {
      const committee = await Committee.findOne({ userId });
      if (committee && String(committee._id) === String(application.eventId.committeeId)) {
        hasAccess = true;
      }
    }
    if (!hasAccess) {
      throw ApiError.forbidden('Unauthorized access to application', null, 'FORBIDDEN');
    }
  }

  return application;
}

async function updateApplication(applicationId, companyUserId, data) {
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    throw ApiError.badRequest('Invalid application ID format', null, 'INVALID_ID');
  }

  const company = await Company.findOne({ userId: companyUserId });
  if (!company) throw ApiError.badRequest('Company profile required', null, 'PROFILE_REQUIRED');

  const application = await Application.findById(applicationId);
  if (!application) throw ApiError.notFound('Application not found', null, 'APPLICATION_NOT_FOUND');

  if (String(application.companyId) !== String(company._id)) {
    throw ApiError.forbidden('You do not own this application', null, 'FORBIDDEN');
  }

  if (application.status !== APPLICATION_STATUS.PENDING) {
    throw ApiError.badRequest('Only pending applications can be updated', null, 'INVALID_STATE');
  }

  if (data.message !== undefined) application.message = data.message.trim();
  if (data.packageId !== undefined) application.packageId = data.packageId;
  if (data.proposedContribution) {
    application.proposedContribution = { ...application.proposedContribution, ...data.proposedContribution };
  }

  await application.save();
  return application;
}

async function acceptApplication(applicationId, committeeUserId, userRole) {
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    throw ApiError.badRequest('Invalid application ID format', null, 'INVALID_ID');
  }

  const application = await Application.findById(applicationId)
    .populate('eventId')
    .populate('companyId');

  if (!application) throw ApiError.notFound('Application not found', null, 'APPLICATION_NOT_FOUND');

  if (userRole !== ROLES.ADMIN) {
    const committee = await Committee.findOne({ userId: committeeUserId });
    if (!committee || String(committee._id) !== String(application.eventId.committeeId)) {
      throw ApiError.forbidden('You do not own this event', null, 'FORBIDDEN');
    }
  }

  if (application.status !== APPLICATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Cannot accept application with status ${application.status}`, null, 'INVALID_STATE');
  }

  application.status = APPLICATION_STATUS.ACCEPTED;
  application.respondedAt = new Date();
  await application.save();

  // Establish Conversation between company and committee for this event
  const conversation = await conversationService.getOrCreateConversation({
    companyId: application.companyId._id,
    committeeId: application.eventId.committeeId,
    eventId: application.eventId._id,
  });

  // Notify company user
  if (application.companyId && application.companyId.userId) {
    await notificationService.createNotification({
      recipientUserId: application.companyId.userId,
      type: NOTIFICATION_TYPE.APPLICATION_ACCEPTED,
      title: 'Application Accepted!',
      message: `Your application for "${application.eventId.title}" was accepted. You can now chat and negotiate.`,
      entityType: 'APPLICATION',
      entityId: application._id,
    });
  }

  return { application, conversation };
}

async function rejectApplication(applicationId, committeeUserId, userRole) {
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    throw ApiError.badRequest('Invalid application ID format', null, 'INVALID_ID');
  }

  const application = await Application.findById(applicationId)
    .populate('eventId')
    .populate('companyId');

  if (!application) throw ApiError.notFound('Application not found', null, 'APPLICATION_NOT_FOUND');

  if (userRole !== ROLES.ADMIN) {
    const committee = await Committee.findOne({ userId: committeeUserId });
    if (!committee || String(committee._id) !== String(application.eventId.committeeId)) {
      throw ApiError.forbidden('You do not own this event', null, 'FORBIDDEN');
    }
  }

  if (application.status !== APPLICATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Cannot reject application with status ${application.status}`, null, 'INVALID_STATE');
  }

  application.status = APPLICATION_STATUS.REJECTED;
  application.respondedAt = new Date();
  await application.save();

  // Notify company user
  if (application.companyId && application.companyId.userId) {
    await notificationService.createNotification({
      recipientUserId: application.companyId.userId,
      type: NOTIFICATION_TYPE.APPLICATION_REJECTED,
      title: 'Application Update',
      message: `Your application for "${application.eventId.title}" was declined.`,
      entityType: 'APPLICATION',
      entityId: application._id,
    });
  }

  return application;
}

async function withdrawApplication(applicationId, companyUserId) {
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    throw ApiError.badRequest('Invalid application ID format', null, 'INVALID_ID');
  }

  const company = await Company.findOne({ userId: companyUserId });
  if (!company) throw ApiError.badRequest('Company profile required', null, 'PROFILE_REQUIRED');

  const application = await Application.findById(applicationId);
  if (!application) throw ApiError.notFound('Application not found', null, 'APPLICATION_NOT_FOUND');

  if (String(application.companyId) !== String(company._id)) {
    throw ApiError.forbidden('You do not own this application', null, 'FORBIDDEN');
  }

  if (application.status !== APPLICATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Cannot withdraw application with status ${application.status}`, null, 'INVALID_STATE');
  }

  application.status = APPLICATION_STATUS.WITHDRAWN;
  application.respondedAt = new Date();
  await application.save();

  return application;
}

module.exports = {
  applyToEvent,
  getApplicationsForEvent,
  listApplications,
  getApplicationById,
  updateApplication,
  acceptApplication,
  rejectApplication,
  withdrawApplication,
};
