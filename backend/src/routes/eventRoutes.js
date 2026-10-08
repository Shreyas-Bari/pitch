const express = require('express');
const eventController = require('../controllers/eventController');
const packageController = require('../controllers/packageController');
const applicationController = require('../controllers/applicationController');
const invitationController = require('../controllers/invitationController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { requireRole, requireCompany } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { validateCreateEvent, validateUpdateEvent } = require('../validators/eventValidator');
const { validateCreatePackage } = require('../validators/packageValidator');
const { validateCreateApplication } = require('../validators/applicationValidator');
const { validateCreateInvitation } = require('../validators/invitationValidator');
const { ROLES } = require('../utils/constants');

const router = express.Router();

/**
 * Event Routes
 * Base path: /api/v1/events
 * Sources: docs/PITCH_API_FINAL.md Section 4, 6 & docs/PITCH_FINAL_BUILD_SPEC.md Section 15, 45, 47
 */

// 1. List / Discover public events
router.get('/', optionalAuth, eventController.listEvents);

// 2. Create event: COMMITTEE role only
router.post(
  '/',
  authMiddleware,
  requireRole(ROLES.COMMITTEE),
  validateRequest({ body: validateCreateEvent }),
  eventController.createEvent
);

// 3. Get single event by ID or slug (public if published, or owner/admin)
router.get('/:eventId', optionalAuth, eventController.getEvent);

// 4. Update event (owner committee or admin)
router.put(
  '/:eventId',
  authMiddleware,
  validateRequest({ body: validateUpdateEvent }),
  eventController.updateEvent
);

router.patch(
  '/:eventId',
  authMiddleware,
  validateRequest({ body: validateUpdateEvent }),
  eventController.updateEvent
);

// 5. Delete event (owner committee or admin)
router.delete('/:eventId', authMiddleware, eventController.deleteEvent);

// 6. Lifecycle transitions (publish, unpublish, archive)
router.post('/:eventId/publish', authMiddleware, eventController.publishEvent);
router.post('/:eventId/unpublish', authMiddleware, eventController.unpublishEvent);
router.post('/:eventId/archive', authMiddleware, eventController.archiveEvent);

// 7. Event Media management
router.post('/:eventId/media', authMiddleware, eventController.addMedia);
router.delete('/:eventId/media/:mediaId', authMiddleware, eventController.removeMedia);

// 8. Saved Events (Company role)
router.post('/:eventId/save', authMiddleware, requireCompany, eventController.saveEvent);
router.delete('/:eventId/save', authMiddleware, requireCompany, eventController.unsaveEvent);

// 9. Event Sponsorship Packages
router.get('/:eventId/packages', optionalAuth, packageController.getPackagesByEvent);
router.post(
  '/:eventId/packages',
  authMiddleware,
  requireRole(ROLES.COMMITTEE),
  validateRequest({ body: validateCreatePackage }),
  packageController.createPackage
);

// 10. Event Applications
router.post(
  '/:eventId/applications',
  authMiddleware,
  requireCompany,
  validateRequest({ body: validateCreateApplication }),
  applicationController.applyToEvent
);
router.get(
  '/:eventId/applications',
  authMiddleware,
  requireRole(ROLES.COMMITTEE),
  applicationController.getEventApplications
);

// 11. Event Invitations (Committee role)
router.post(
  '/:eventId/invitations',
  authMiddleware,
  requireRole(ROLES.COMMITTEE),
  validateRequest({ body: validateCreateInvitation }),
  invitationController.sendInvitation
);

module.exports = router;
