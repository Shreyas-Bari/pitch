const express = require('express');
const reviewController = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { validateUpdateReview } = require('../validators/reviewValidator');

const router = express.Router();

/**
 * Review Routes
 * Source: docs/PITCH_API_FINAL.md Section 17
 * Base path: /api/v1/reviews
 */

router.use(authMiddleware);

// PATCH /api/v1/reviews/:reviewId
router.patch(
  '/:reviewId',
  validateRequest({ body: validateUpdateReview }),
  reviewController.updateReview
);

module.exports = router;
