const mongoose = require('mongoose');
const { Event, Committee } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

/**
 * Event Controller
 * Source: docs/PITCH_API_FINAL.md Section 4 & docs/PITCH_FINAL_BUILD_SPEC.md Section 9.4
 */

async function createEvent(req, res, next) {
  try {
    const committee = await Committee.findOne({ userId: req.user._id });
    if (!committee) {
      throw ApiError.badRequest('Committee profile must exist before creating events');
    }

    const {
      title,
      slug,
      description,
      category,
      eventType,
      eventDate,
      endDate,
      location,
      expectedAudience,
      estimatedReach,
    } = req.body;

    const event = await Event.create({
      committeeId: committee._id,
      title,
      slug: slug || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      description: description || 'Event description',
      category: category || 'Technology',
      eventType: eventType || 'Festival',
      eventDate: eventDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: endDate || null,
      location: location || { venue: 'Campus Auditorium', city: committee.college?.location?.city || 'Mumbai' },
      expectedAudience: expectedAudience || { min: 500, max: 2000 },
      estimatedReach: estimatedReach || 5000,
    });

    return sendSuccess(res, { event }, 201);
  } catch (err) {
    next(err);
  }
}

async function getEvent(req, res, next) {
  try {
    const { eventId } = req.params;
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      throw ApiError.badRequest('Invalid event ID format', null, 'INVALID_ID');
    }
    const event = await Event.findById(eventId);
    if (!event) {
      throw ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND');
    }
    return sendSuccess(res, { event }, 200);
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const event = req.event || (await Event.findById(req.params.eventId));
    if (!event) {
      throw ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND');
    }

    const { title, description, category, eventDate, estimatedReach, expectedAudience } = req.body;
    if (title) event.title = title;
    if (description) event.description = description;
    if (category) event.category = category;
    if (eventDate) event.eventDate = eventDate;
    if (estimatedReach !== undefined) event.estimatedReach = estimatedReach;
    if (expectedAudience) event.expectedAudience = { ...event.expectedAudience, ...expectedAudience };

    await event.save();
    return sendSuccess(res, { event }, 200);
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const event = req.event || (await Event.findById(req.params.eventId));
    if (!event) {
      throw ApiError.notFound('Event not found', null, 'EVENT_NOT_FOUND');
    }

    await Event.findByIdAndDelete(event._id);
    return sendSuccess(res, { message: 'Event deleted successfully' }, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
};
