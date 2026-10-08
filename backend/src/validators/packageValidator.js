const mongoose = require('mongoose');
const { SPONSORSHIP_PACKAGE_STATUS, CONTRIBUTION_TYPES } = require('../utils/constants');

const ALLOWED_PACKAGE_FIELDS = [
  'title',
  'description',
  'contributionTypes',
  'cashRequirement',
  'nonCashRequirements',
  'benefits',
  'availability',
  'status',
];

function validateCreatePackage(body) {
  const errors = {};
  const unsupported = Object.keys(body).filter(k => !ALLOWED_PACKAGE_FIELDS.includes(k));
  if (unsupported.length > 0) {
    errors.unsupported = 'Unsupported fields: ' + unsupported.join(', ');
  }

  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    errors.title = 'Package title is required';
  }

  if (body.contributionTypes) {
    if (!Array.isArray(body.contributionTypes)) {
      errors.contributionTypes = 'contributionTypes must be an array';
    } else {
      const invalid = body.contributionTypes.filter(t => !CONTRIBUTION_TYPES.includes(t));
      if (invalid.length > 0) {
        errors.contributionTypes = 'Invalid contribution types: ' + invalid.join(', ');
      }
    }
  }

  if (body.cashRequirement) {
    if (typeof body.cashRequirement !== 'object') {
      errors.cashRequirement = 'cashRequirement must be an object';
    } else if (body.cashRequirement.amount !== undefined && (typeof body.cashRequirement.amount !== 'number' || body.cashRequirement.amount < 0)) {
      errors['cashRequirement.amount'] = 'Cash amount must be a non-negative number';
    }
  }

  if (body.availability !== undefined && (typeof body.availability !== 'number' || body.availability < 0)) {
    errors.availability = 'Availability must be a non-negative number';
  }

  if (body.status && !Object.values(SPONSORSHIP_PACKAGE_STATUS).includes(body.status)) {
    errors.status = 'Invalid package status';
  }

  return errors;
}

function validateUpdatePackage(body) {
  const errors = {};
  const unsupported = Object.keys(body).filter(k => !ALLOWED_PACKAGE_FIELDS.includes(k));
  if (unsupported.length > 0) {
    errors.unsupported = 'Unsupported fields: ' + unsupported.join(', ');
  }

  if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim())) {
    errors.title = 'Package title cannot be empty';
  }

  if (body.contributionTypes !== undefined) {
    if (!Array.isArray(body.contributionTypes)) {
      errors.contributionTypes = 'contributionTypes must be an array';
    } else {
      const invalid = body.contributionTypes.filter(t => !CONTRIBUTION_TYPES.includes(t));
      if (invalid.length > 0) {
        errors.contributionTypes = 'Invalid contribution types: ' + invalid.join(', ');
      }
    }
  }

  if (body.cashRequirement !== undefined) {
    if (typeof body.cashRequirement !== 'object') {
      errors.cashRequirement = 'cashRequirement must be an object';
    } else if (body.cashRequirement.amount !== undefined && (typeof body.cashRequirement.amount !== 'number' || body.cashRequirement.amount < 0)) {
      errors['cashRequirement.amount'] = 'Cash amount must be a non-negative number';
    }
  }

  if (body.availability !== undefined && (typeof body.availability !== 'number' || body.availability < 0)) {
    errors.availability = 'Availability must be a non-negative number';
  }

  if (body.status !== undefined && !Object.values(SPONSORSHIP_PACKAGE_STATUS).includes(body.status)) {
    errors.status = 'Invalid package status';
  }

  return errors;
}

module.exports = {
  validateCreatePackage,
  validateUpdatePackage,
  ALLOWED_PACKAGE_FIELDS,
};
