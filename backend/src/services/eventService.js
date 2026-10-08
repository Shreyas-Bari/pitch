const mongoose = require('mongoose');
const { Event, Committee, Company, SponsorshipPackage, SavedEvent, File } = require('../models');
const ApiError = require('../utils/apiError');
const { EVENT_STATUS, ROLES } = require('../utils/constants');

function generateSlug(title) {
  const base = (title || 'event')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'event'}-${Date.now()}`;
}

async function createEvent(userId, data) {
  const committee = await Committee.findOne({ userId });
  if (!committee) {
    throw ApiError.badRequest('Committee profile must exist before creating events', null, 'PROFILE_REQUIRED');
  }

  if (data.bannerFileId) {
    const file = await File.findById(data.bannerFileId);
    if (!file) {
      throw ApiError.badRequest('Banner file does not exist', null, 'INVALID_FILE');
    }
  }

  if (data.mediaFileIds && data.mediaFileIds.length > 0) {
    const count = await File.countDocuments({ _id: { $in: data.mediaFileIds } });
    if (count !== data.mediaFileIds.length) {
      throw ApiError.badRequest('One or more media files do not exist', null, 'INVALID_FILE');
    }
  }

  let slug = data.slug;
  if (!slug || !slug.trim()) {
    slug = generateSlug(data.title);
  } else {
    slug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const existing = await Event.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  const event = await Event.create({
    committeeId: committee._id,
    title: data.title.trim(),
    slug,
    description: data.description.trim(),
    category: data.category.trim(),
    eventType: data.eventType || 'Festival',
    eventDate: data.eventDate ? new Date(data.eventDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    endDate: data.endDate ? new Date(data.endDate) : null,
    location: data.location || {
      mode: 'PHYSICAL',
      venue: 'Campus Auditorium',
      city: committee.college?.location?.city || 'Mumbai',
    },
    expectedAudience: data.expectedAudience || { min: 100, max: 1000 },
    audienceDescription: data.audienceDescription || '',
    estimatedReach: data.estimatedReach !== undefined ? data.estimatedReach : 1000,
    socialReach: data.socialReach || { instagram: 0, linkedin: 0, youtube: 0, other: 0 },
    bannerFileId: data.bannerFileId || null,
    mediaFileIds: data.mediaFileIds || [],
    sponsorshipRequirements: data.sponsorshipRequirements || {
      contributionTypes: ['CASH'],
      budgetMin: 0,
      budgetMax: 100000,
      description: '',
    },
    tags: Array.isArray(data.tags) ? data.tags.map(t => String(t).trim()).filter(Boolean) : [],
    status: EVENT_STATUS.DRAFT,
  });

  return event;
}

async function getEventById(identifier, user = null) {
  let query;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query = { _id: identifier };
  } else {
    query = { slug: identifier };
  }

  const event = await Event.findOne(query)
    .populate('committeeId', 'name college logoFileId verificationStatus contact description socialLinks')
    .populate('bannerFileId');

  if (!event) {
    throw ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND');
  }

  return event;
}

async function listEvents(query = {}, user = null) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.status) {
    if (user && user.role === ROLES.ADMIN) {
      filter.status = query.status;
    } else {
      filter.status = EVENT_STATUS.PUBLISHED;
    }
  } else {
    filter.status = EVENT_STATUS.PUBLISHED;
  }

  if (query.category) {
    filter.category = { $regex: new RegExp(`^${query.category.trim()}$`, 'i') };
  }

  if (query.eventType) {
    filter.eventType = { $regex: new RegExp(`^${query.eventType.trim()}$`, 'i') };
  }

  if (query.locationMode) {
    filter['location.mode'] = query.locationMode;
  }

  if (query.city) {
    filter['location.city'] = { $regex: new RegExp(query.city.trim(), 'i') };
  }

  if (query.search) {
    const s = query.search.trim();
    filter.$or = [
      { title: { $regex: new RegExp(s, 'i') } },
      { description: { $regex: new RegExp(s, 'i') } },
      { category: { $regex: new RegExp(s, 'i') } },
      { tags: { $in: [new RegExp(s, 'i')] } },
      { 'location.city': { $regex: new RegExp(s, 'i') } },
    ];
  }

  if (query.tag) {
    filter.tags = { $in: [query.tag.trim()] };
  }

  if (query.startDate) {
    const d = new Date(query.startDate);
    if (!isNaN(d.getTime())) {
      filter.eventDate = { ...filter.eventDate, $gte: d };
    }
  }

  if (query.endDate) {
    const d = new Date(query.endDate);
    if (!isNaN(d.getTime())) {
      filter.eventDate = { ...filter.eventDate, $lte: d };
    }
  }

  if (query.budgetMin !== undefined && !isNaN(Number(query.budgetMin))) {
    filter['sponsorshipRequirements.budgetMax'] = { $gte: Number(query.budgetMin) };
  }

  if (query.budgetMax !== undefined && !isNaN(Number(query.budgetMax))) {
    filter['sponsorshipRequirements.budgetMin'] = { $lte: Number(query.budgetMax) };
  }

  const sort = {};
  const sortField = query.sort || 'eventDate';
  const sortOrder = query.order === 'desc' ? -1 : 1;

  if (['eventDate', 'createdAt', 'estimatedReach', 'title'].includes(sortField)) {
    sort[sortField] = sortOrder;
  } else {
    sort.eventDate = 1;
  }

  const [total, events] = await Promise.all([
    Event.countDocuments(filter),
    Event.find(filter)
      .populate('committeeId', 'name college logoFileId verificationStatus')
      .populate('bannerFileId')
      .sort(sort)
      .skip(skip)
      .limit(limit),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function updateEvent(eventId, userId, userRole, data) {
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

  if (data.bannerFileId !== undefined) {
    if (data.bannerFileId) {
      const file = await File.findById(data.bannerFileId);
      if (!file) throw ApiError.badRequest('Banner file not found', null, 'INVALID_FILE');
      event.bannerFileId = data.bannerFileId;
    } else {
      event.bannerFileId = null;
    }
  }

  if (data.mediaFileIds !== undefined) {
    if (Array.isArray(data.mediaFileIds) && data.mediaFileIds.length > 0) {
      const count = await File.countDocuments({ _id: { $in: data.mediaFileIds } });
      if (count !== data.mediaFileIds.length) {
        throw ApiError.badRequest('One or more media files not found', null, 'INVALID_FILE');
      }
      event.mediaFileIds = data.mediaFileIds;
    } else if (Array.isArray(data.mediaFileIds)) {
      event.mediaFileIds = [];
    }
  }

  if (data.title) event.title = data.title.trim();
  if (data.description) event.description = data.description.trim();
  if (data.category) event.category = data.category.trim();
  if (data.eventType) event.eventType = data.eventType;
  if (data.eventDate) event.eventDate = new Date(data.eventDate);
  if (data.endDate !== undefined) event.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.location) event.location = { ...event.location, ...data.location };
  if (data.expectedAudience) event.expectedAudience = { ...event.expectedAudience, ...data.expectedAudience };
  if (data.audienceDescription !== undefined) event.audienceDescription = data.audienceDescription;
  if (data.estimatedReach !== undefined) event.estimatedReach = data.estimatedReach;
  if (data.socialReach) event.socialReach = { ...event.socialReach, ...data.socialReach };
  if (data.sponsorshipRequirements) {
    event.sponsorshipRequirements = { ...event.sponsorshipRequirements, ...data.sponsorshipRequirements };
  }
  if (Array.isArray(data.tags)) {
    event.tags = data.tags.map(t => String(t).trim()).filter(Boolean);
  }

  await event.save();
  return event;
}

async function deleteEvent(eventId, userId, userRole) {
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

  await SponsorshipPackage.deleteMany({ eventId: event._id });
  await Event.findByIdAndDelete(event._id);

  return { message: 'Event deleted successfully' };
}

async function setEventStatus(eventId, userId, userRole, newStatus) {
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

  event.status = newStatus;
  if (newStatus === EVENT_STATUS.PUBLISHED && !event.publishedAt) {
    event.publishedAt = new Date();
  }
  await event.save();
  return event;
}

async function publishEvent(eventId, userId, userRole) {
  return setEventStatus(eventId, userId, userRole, EVENT_STATUS.PUBLISHED);
}

async function unpublishEvent(eventId, userId, userRole) {
  return setEventStatus(eventId, userId, userRole, EVENT_STATUS.DRAFT);
}

async function archiveEvent(eventId, userId, userRole) {
  return setEventStatus(eventId, userId, userRole, EVENT_STATUS.ARCHIVED);
}

async function getMyCommitteeEvents(userId, query = {}) {
  const committee = await Committee.findOne({ userId });
  if (!committee) {
    throw ApiError.badRequest('Committee profile not found', null, 'PROFILE_REQUIRED');
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = { committeeId: committee._id };
  if (query.status) {
    filter.status = query.status;
  }

  const [total, events] = await Promise.all([
    Event.countDocuments(filter),
    Event.find(filter)
      .populate('bannerFileId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function addMedia(eventId, userId, userRole, fileId) {
  if (!mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(fileId)) {
    throw ApiError.badRequest('Invalid ID format', null, 'INVALID_ID');
  }

  const event = await Event.findById(eventId);
  if (!event) throw ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND');

  if (userRole !== ROLES.ADMIN) {
    const committee = await Committee.findOne({ userId });
    if (!committee || String(committee._id) !== String(event.committeeId)) {
      throw ApiError.forbidden('You do not own this event', null, 'FORBIDDEN');
    }
  }

  const file = await File.findById(fileId);
  if (!file) throw ApiError.badRequest('File does not exist', null, 'INVALID_FILE');

  if (!event.mediaFileIds.some(id => String(id) === String(fileId))) {
    event.mediaFileIds.push(fileId);
    await event.save();
  }

  return event;
}

async function removeMedia(eventId, userId, userRole, mediaId) {
  if (!mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(mediaId)) {
    throw ApiError.badRequest('Invalid ID format', null, 'INVALID_ID');
  }

  const event = await Event.findById(eventId);
  if (!event) throw ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND');

  if (userRole !== ROLES.ADMIN) {
    const committee = await Committee.findOne({ userId });
    if (!committee || String(committee._id) !== String(event.committeeId)) {
      throw ApiError.forbidden('You do not own this event', null, 'FORBIDDEN');
    }
  }

  event.mediaFileIds = event.mediaFileIds.filter(id => String(id) !== String(mediaId));
  await event.save();
  return event;
}

async function saveEvent(companyUserId, eventId) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw ApiError.badRequest('Invalid event ID format', null, 'INVALID_ID');
  }

  const company = await Company.findOne({ userId: companyUserId });
  if (!company) {
    throw ApiError.badRequest('Company profile required to save events', null, 'PROFILE_REQUIRED');
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND');
  }

  const saved = await SavedEvent.findOneAndUpdate(
    { companyId: company._id, eventId: event._id },
    { companyId: company._id, eventId: event._id },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return { saved: true, savedEvent: saved };
}

async function unsaveEvent(companyUserId, eventId) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw ApiError.badRequest('Invalid event ID format', null, 'INVALID_ID');
  }

  const company = await Company.findOne({ userId: companyUserId });
  if (!company) {
    throw ApiError.badRequest('Company profile required', null, 'PROFILE_REQUIRED');
  }

  await SavedEvent.findOneAndDelete({ companyId: company._id, eventId });
  return { saved: false, message: 'Event unsaved successfully' };
}

async function getSavedEvents(companyUserId, query = {}) {
  const company = await Company.findOne({ userId: companyUserId });
  if (!company) {
    throw ApiError.badRequest('Company profile required', null, 'PROFILE_REQUIRED');
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [total, savedRecords] = await Promise.all([
    SavedEvent.countDocuments({ companyId: company._id }),
    SavedEvent.find({ companyId: company._id })
      .populate({
        path: 'eventId',
        populate: [
          { path: 'committeeId', select: 'name college logoFileId verificationStatus' },
          { path: 'bannerFileId' },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  const events = savedRecords.map(r => r.eventId).filter(Boolean);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

module.exports = {
  createEvent,
  getEventById,
  listEvents,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
  archiveEvent,
  getMyCommitteeEvents,
  addMedia,
  removeMedia,
  saveEvent,
  unsaveEvent,
  getSavedEvents,
};
