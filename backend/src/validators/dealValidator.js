const {
  FULFILLMENT_RESPONSIBLE_PARTY,
  FULFILLMENT_TYPE,
  FULFILLMENT_STATUS,
} = require('../utils/constants');

/**
 * Deal & Fulfillment Functional Validators
 * Source: docs/PITCH_API_FINAL.md Section 16 & 17
 */

function validateCreateFulfillment(body = {}) {
  const errors = {};
  if (
    !body.responsibleParty ||
    !Object.values(FULFILLMENT_RESPONSIBLE_PARTY).includes(body.responsibleParty)
  ) {
    errors.responsibleParty = 'Responsible party is required (COMPANY or COMMITTEE)';
  }
  if (!body.type || !Object.values(FULFILLMENT_TYPE).includes(body.type)) {
    errors.type = 'Fulfillment obligation type is required';
  }
  if (
    !body.description ||
    typeof body.description !== 'string' ||
    body.description.trim().length < 3
  ) {
    errors.description = 'Description is required and must be at least 3 characters';
  }
  if (
    body.quantity !== undefined &&
    (typeof body.quantity !== 'number' || body.quantity < 0)
  ) {
    errors.quantity = 'Quantity must be a non-negative number';
  }
  if (body.status && !Object.values(FULFILLMENT_STATUS).includes(body.status)) {
    errors.status = 'Invalid fulfillment status';
  }
  return errors;
}

function validateUpdateFulfillment(body = {}) {
  const errors = {};
  if (
    body.responsibleParty &&
    !Object.values(FULFILLMENT_RESPONSIBLE_PARTY).includes(body.responsibleParty)
  ) {
    errors.responsibleParty = 'Invalid responsible party';
  }
  if (body.type && !Object.values(FULFILLMENT_TYPE).includes(body.type)) {
    errors.type = 'Invalid fulfillment type';
  }
  if (
    body.quantity !== undefined &&
    (typeof body.quantity !== 'number' || body.quantity < 0)
  ) {
    errors.quantity = 'Quantity must be a non-negative number';
  }
  if (body.status && !Object.values(FULFILLMENT_STATUS).includes(body.status)) {
    errors.status = 'Invalid fulfillment status';
  }
  return errors;
}

function validateAddEvidence(body = {}) {
  const errors = {};
  if (
    !body.fileId ||
    typeof body.fileId !== 'string' ||
    !/^[0-9a-fA-F]{24}$/.test(body.fileId)
  ) {
    errors.fileId = 'Valid File ObjectId is required';
  }
  return errors;
}

function validateCompleteDeal(_body = {}) {
  return {};
}

function validateCreateDispute(body = {}) {
  const errors = {};
  if (
    !body.reason ||
    typeof body.reason !== 'string' ||
    body.reason.trim().length < 5
  ) {
    errors.reason = 'Dispute reason is required and must be at least 5 characters';
  }
  if (
    !body.description ||
    typeof body.description !== 'string' ||
    body.description.trim().length < 10
  ) {
    errors.description = 'Dispute description is required and must be at least 10 characters';
  }
  return errors;
}

module.exports = {
  validateCreateFulfillment,
  validateUpdateFulfillment,
  validateAddEvidence,
  validateCompleteDeal,
  validateCreateDispute,
};
