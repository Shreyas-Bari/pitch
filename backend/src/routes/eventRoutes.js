const express = require('express');
const eventController = require('../controllers/eventController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { requireEventOwnership } = require('../middleware/ownershipMiddleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();

/**
 * Event Routes
 * Base path: /api/v1/events
 * Source: docs/PITCH_API_FINAL.md Section 4 & docs/PITCH_FINAL_BUILD_SPEC.md Section 9.4
 */

// Public / view event
router.get('/:eventId', eventController.getEvent);

// Create event: COMMITTEE role only
router.post(
  '/',
  authMiddleware,
  requireRole(ROLES.COMMITTEE),
  eventController.createEvent
);

// Update event: Owning COMMITTEE or ADMIN (PUT and PATCH supported)
router.put(
  '/:eventId',
  authMiddleware,
  requireEventOwnership({ paramName: 'eventId' }),
  eventController.updateEvent
);

router.patch(
  '/:eventId',
  authMiddleware,
  requireEventOwnership({ paramName: 'eventId' }),
  eventController.updateEvent
);

// Delete event: Owning COMMITTEE or ADMIN
router.delete(
  '/:eventId',
  authMiddleware,
  requireEventOwnership({ paramName: 'eventId' }),
  eventController.deleteEvent
);

module.exports = router;
