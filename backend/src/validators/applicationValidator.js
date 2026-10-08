const mongoose = require('mongoose');
const { CONTRIBUTION_TYPES, APPLICATION_STATUS } = require('../utils/constants');

const ALLOWED_APPLICATION_FIELDS = [
  'packageId',
  'message',
  'proposedContribution',
];

function validateCreateApplication(body) {
  const errors = {};
  const unsupported = Object.keys(body).filter(k => !ALLOWED_APPLICATION_FIELDS.includes(k));
  if (unsupported.length > 0) {
    errors.unsupported = 'Unsupported fields: ' + unsupported.join(', ');
  }

  if (body.packageId && !mongoose.Types.ObjectId.isValid(body.packageId)) {
    errors.packageId = 'Invalid package ID format';
  }

  if (body.proposedContribution) {
    const pc = body.proposedContribution;
    if (pc.types) {
      if (!Array.isArray(pc.types)) {
        errors['proposedContribution.types'] = 'Types must be an array';
      } else {
        const inv = pc.types.filter(t => !CONTRIBUTION_TYPES.includes(t));
        if (inv.length > 0) {
          errors['proposedContribution.types'] = 'Invalid contribution types: ' + inv.join(', ');
        }
      }
    }
    if (pc.cash && pc.cash.amount !== undefined && (typeof pc.cash.amount !== 'number' || pc.cash.amount < 0)) {
      errors['proposedContribution.cash.amount'] = 'Cash amount must be non-negative';
    }
  }

  return errors;
}

function validateUpdateApplication(body) {
  const errors = {};
  const unsupported = Object.keys(body).filter(k => !ALLOWED_APPLICATION_FIELDS.includes(k));
  if (unsupported.length > 0) {
    errors.unsupported = 'Unsupported fields: ' + unsupported.join(', ');
  }

  if (body.packageId && !mongoose.Types.ObjectId.isValid(body.packageId)) {
    errors.packageId = 'Invalid package ID format';
  }

  return errors;
}

module.exports = {
  validateCreateApplication,
  validateUpdateApplication,
  ALLOWED_APPLICATION_FIELDS,
};
