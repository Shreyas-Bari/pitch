const eventService = require('../services/eventService');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');

/**
 * Event Controller
 * Sources: docs/PITCH_API_FINAL.md Section 4, 6 & docs/PITCH_FINAL_BUILD_SPEC.md Section 15, 45, 47
 */

async function createEvent(req, res, next) {
  try {
    const event = await eventService.createEvent(req.user._id, req.body);
    return sendSuccess(res, { event }, 201);
  } catch (err) {
    next(err);
  }
}

async function getEvent(req, res, next) {
  try {
    const event = await eventService.getEventById(req.params.eventId, req.user);
    return sendSuccess(res, { event }, 200);
  } catch (err) {
    next(err);
  }
}

async function listEvents(req, res, next) {
  try {
    const result = await eventService.listEvents(req.query, req.user);
    return sendPaginated(res, result.events, result.pagination);
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const event = await eventService.updateEvent(req.params.eventId, req.user._id, req.user.role, req.body);
    return sendSuccess(res, { event }, 200);
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const result = await eventService.deleteEvent(req.params.eventId, req.user._id, req.user.role);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function publishEvent(req, res, next) {
  try {
    const event = await eventService.publishEvent(req.params.eventId, req.user._id, req.user.role);
    return sendSuccess(res, { event }, 200);
  } catch (err) {
    next(err);
  }
}

async function unpublishEvent(req, res, next) {
  try {
    const event = await eventService.unpublishEvent(req.params.eventId, req.user._id, req.user.role);
    return sendSuccess(res, { event }, 200);
  } catch (err) {
    next(err);
  }
}

async function archiveEvent(req, res, next) {
  try {
    const event = await eventService.archiveEvent(req.params.eventId, req.user._id, req.user.role);
    return sendSuccess(res, { event }, 200);
  } catch (err) {
    next(err);
  }
}

async function getMyCommitteeEvents(req, res, next) {
  try {
    const result = await eventService.getMyCommitteeEvents(req.user._id, req.query);
    return sendPaginated(res, result.events, result.pagination);
  } catch (err) {
    next(err);
  }
}

async function addMedia(req, res, next) {
  try {
    const event = await eventService.addMedia(req.params.eventId, req.user._id, req.user.role, req.body.fileId);
    return sendSuccess(res, { event }, 200);
  } catch (err) {
    next(err);
  }
}

async function removeMedia(req, res, next) {
  try {
    const event = await eventService.removeMedia(req.params.eventId, req.user._id, req.user.role, req.params.mediaId);
    return sendSuccess(res, { event }, 200);
  } catch (err) {
    next(err);
  }
}

async function saveEvent(req, res, next) {
  try {
    const result = await eventService.saveEvent(req.user._id, req.params.eventId);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function unsaveEvent(req, res, next) {
  try {
    const result = await eventService.unsaveEvent(req.user._id, req.params.eventId);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

async function getSavedEvents(req, res, next) {
  try {
    const result = await eventService.getSavedEvents(req.user._id, req.query);
    return sendPaginated(res, result.events, result.pagination);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createEvent,
  getEvent,
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
