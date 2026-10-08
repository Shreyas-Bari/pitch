const { REVIEW_STATUS } = require('../utils/constants');

/**
 * Review Functional Validators
 * Source: docs/PITCH_API_FINAL.md Section 17 & docs/PITCH_DATABASE_FINAL.md Section 24
 */

function validateCreateReview(body = {}) {
  const errors = {};
  if (body.rating === undefined || body.rating === null) {
    errors.rating = 'Rating is required';
  } else if (
    typeof body.rating !== 'number' ||
    !Number.isInteger(body.rating) ||
    body.rating < 1 ||
    body.rating > 5
  ) {
    errors.rating = 'Rating must be an integer between 1 and 5';
  }
  if (body.title !== undefined && typeof body.title !== 'string') {
    errors.title = 'Title must be a string';
  }
  if (body.comment !== undefined && typeof body.comment !== 'string') {
    errors.comment = 'Comment must be a string';
  }
  return errors;
}

function validateUpdateReview(body = {}) {
  const errors = {};
  if (body.rating !== undefined) {
    if (
      typeof body.rating !== 'number' ||
      !Number.isInteger(body.rating) ||
      body.rating < 1 ||
      body.rating > 5
    ) {
      errors.rating = 'Rating must be an integer between 1 and 5';
    }
  }
  if (body.status && !Object.values(REVIEW_STATUS).includes(body.status)) {
    errors.status = 'Invalid review status';
  }
  return errors;
}

module.exports = {
  validateCreateReview,
  validateUpdateReview,
};
