const mongoose = require('mongoose');
const { EVENT_LOCATION_MODE, EVENT_STATUS, CONTRIBUTION_TYPES } = require('../utils/constants');

const ALLOWED_CREATE_FIELDS = [
  'title', 'slug', 'description', 'category', 'eventType',
  'eventDate', 'endDate', 'location', 'expectedAudience',
  'audienceDescription', 'estimatedReach', 'socialReach',
  'bannerFileId', 'mediaFileIds', 'sponsorshipRequirements', 'tags',
];

const ALLOWED_UPDATE_FIELDS = [...ALLOWED_CREATE_FIELDS];

function validateCreateEvent(body) {
  const errors = {};
  const unsupported = Object.keys(body).filter(k => !ALLOWED_CREATE_FIELDS.includes(k));
  if (unsupported.length > 0) errors.unsupported = 'Unsupported fields: ' + unsupported.join(', ');
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) errors.title = 'Event title is required';
  if (!body.description || typeof body.description !== 'string' || !body.description.trim()) errors.description = 'Event description is required';
  if (!body.category || typeof body.category !== 'string' || !body.category.trim()) errors.category = 'Event category is required';
  if (body.eventDate && isNaN(new Date(body.eventDate).getTime())) {
    errors.eventDate = 'Invalid event date format';
  }
  if (body.eventDate && body.endDate) {
    const s = new Date(body.eventDate), e = new Date(body.endDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e < s) errors.endDate = 'End date must be after event date';
  }
  if (body.location && body.location.mode && !Object.values(EVENT_LOCATION_MODE).includes(body.location.mode)) {
    errors['location.mode'] = 'Invalid location mode';
  }
  if (body.expectedAudience) {
    if (body.expectedAudience.min !== undefined && (typeof body.expectedAudience.min !== 'number' || body.expectedAudience.min < 0)) errors['expectedAudience.min'] = 'Must be non-negative';
    if (body.expectedAudience.max !== undefined && (typeof body.expectedAudience.max !== 'number' || body.expectedAudience.max < 0)) errors['expectedAudience.max'] = 'Must be non-negative';
    if (body.expectedAudience.min !== undefined && body.expectedAudience.max !== undefined && body.expectedAudience.max < body.expectedAudience.min) errors['expectedAudience.range'] = 'Max must be >= min';
  }
  if (body.sponsorshipRequirements) {
    const sr = body.sponsorshipRequirements;
    if (sr.contributionTypes && Array.isArray(sr.contributionTypes)) {
      const inv = sr.contributionTypes.filter(t => !CONTRIBUTION_TYPES.includes(t));
      if (inv.length) errors['sponsorshipRequirements.contributionTypes'] = 'Invalid types: ' + inv.join(', ');
    }
    if (sr.budgetMin !== undefined && (typeof sr.budgetMin !== 'number' || sr.budgetMin < 0)) errors['sponsorshipRequirements.budgetMin'] = 'Must be non-negative';
    if (sr.budgetMax !== undefined && (typeof sr.budgetMax !== 'number' || sr.budgetMax < 0)) errors['sponsorshipRequirements.budgetMax'] = 'Must be non-negative';
    if (sr.budgetMin !== undefined && sr.budgetMax !== undefined && sr.budgetMax < sr.budgetMin) errors['sponsorshipRequirements.budgetRange'] = 'Max must be >= min';
  }
  if (body.bannerFileId && !mongoose.Types.ObjectId.isValid(body.bannerFileId)) errors.bannerFileId = 'Invalid banner file ID';
  if (body.mediaFileIds) {
    if (!Array.isArray(body.mediaFileIds)) errors.mediaFileIds = 'Must be an array';
    else if (body.mediaFileIds.some(id => !mongoose.Types.ObjectId.isValid(id))) errors.mediaFileIds = 'Invalid media file ID';
  }
  if (body.tags && !Array.isArray(body.tags)) errors.tags = 'Tags must be an array';
  return errors;
}

function validateUpdateEvent(body) {
  const errors = {};
  const unsupported = Object.keys(body).filter(k => !ALLOWED_UPDATE_FIELDS.includes(k));
  if (unsupported.length > 0) errors.unsupported = 'Unsupported fields: ' + unsupported.join(', ');
  if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim())) errors.title = 'Title cannot be empty';
  if (body.description !== undefined && (typeof body.description !== 'string' || !body.description.trim())) errors.description = 'Description cannot be empty';
  if (body.eventDate && isNaN(new Date(body.eventDate).getTime())) errors.eventDate = 'Invalid event date';
  if (body.endDate && isNaN(new Date(body.endDate).getTime())) errors.endDate = 'Invalid end date';
  if (body.eventDate && body.endDate) {
    const s = new Date(body.eventDate), e = new Date(body.endDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e < s) errors.endDate = 'End date must be after event date';
  }
  if (body.location && body.location.mode && !Object.values(EVENT_LOCATION_MODE).includes(body.location.mode)) errors['location.mode'] = 'Invalid location mode';
  if (body.bannerFileId && !mongoose.Types.ObjectId.isValid(body.bannerFileId)) errors.bannerFileId = 'Invalid banner file ID';
  return errors;
}

function validateEventId(params) {
  const errors = {};
  const id = params.eventId || params.id;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) errors.eventId = 'Invalid event ID format';
  return errors;
}

function validateListQuery(query) {
  const errors = {};
  if (query.page && (isNaN(parseInt(query.page)) || parseInt(query.page) < 1)) errors.page = 'Page must be a positive integer';
  if (query.limit && (isNaN(parseInt(query.limit)) || parseInt(query.limit) < 1 || parseInt(query.limit) > 100)) errors.limit = 'Limit must be 1-100';
  if (query.status && !Object.values(EVENT_STATUS).includes(query.status)) errors.status = 'Invalid status';
  return errors;
}

module.exports = { validateCreateEvent, validateUpdateEvent, validateEventId, validateListQuery, ALLOWED_CREATE_FIELDS, ALLOWED_UPDATE_FIELDS };
