const mongoose = require('mongoose');
const {
  DEAL_STATUS,
  CONTRIBUTION_TYPES,
  FULFILLMENT_RESPONSIBLE_PARTY,
  FULFILLMENT_TYPE,
  FULFILLMENT_STATUS,
} = require('../utils/constants');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function validateContributionItem(item, idx = 0) {
  const errors = {};
  const prefix = `contributions[${idx}]`;

  if (!item || typeof item !== 'object') {
    errors[`${prefix}`] = 'Contribution entry must be an object';
    return errors;
  }

  if (!item.type || !CONTRIBUTION_TYPES.includes(item.type)) {
    errors[`${prefix}.type`] = `Invalid contribution type "${item.type}". Allowed: ${CONTRIBUTION_TYPES.join(', ')}`;
  }

  if (item.type === 'CASH') {
    const amount = Number(item.amount);
    if (isNaN(amount) || amount < 0) {
      errors[`${prefix}.amount`] = 'Cash contribution amount must be a non-negative number';
    }
  } else {
    if (item.quantity !== undefined) {
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty < 0) {
        errors[`${prefix}.quantity`] = 'Quantity must be a non-negative number';
      }
    }
    if (item.estimatedValue !== undefined) {
      const val = Number(item.estimatedValue);
      if (isNaN(val) || val < 0) {
        errors[`${prefix}.estimatedValue`] = 'Estimated value must be a non-negative number';
      }
    }
  }

  return errors;
}

function normalizeContributions(input) {
  if (!input) {
    return {
      types: [],
      cash: { amount: 0, currency: 'INR' },
      nonCash: [],
    };
  }

  if (Array.isArray(input)) {
    const types = new Set();
    let cashAmount = 0;
    const nonCash = [];

    for (const item of input) {
      if (!item || !item.type) continue;
      types.add(item.type);
      if (item.type === 'CASH') {
        cashAmount += Number(item.amount || 0);
      } else {
        nonCash.push({
          type: item.type,
          name: item.name || '',
          description: item.description || '',
          quantity: item.quantity !== undefined ? Number(item.quantity) : 1,
          unit: item.unit || 'units',
          estimatedValue: item.estimatedValue !== undefined ? Number(item.estimatedValue) : 0,
          expectedDate: item.expectedDate ? new Date(item.expectedDate) : null,
          status: item.status || 'PENDING',
        });
      }
    }

    return {
      types: Array.from(types),
      cash: { amount: cashAmount, currency: 'INR' },
      nonCash,
    };
  }

  const types = Array.isArray(input.types)
    ? input.types.filter((t) => CONTRIBUTION_TYPES.includes(t))
    : [];
  const cashAmount = input.cash?.amount !== undefined ? Number(input.cash.amount) : 0;
  const nonCash = Array.isArray(input.nonCash)
    ? input.nonCash.map((nc) => ({
        type: CONTRIBUTION_TYPES.includes(nc.type) ? nc.type : 'PRODUCT',
        name: nc.name || '',
        description: nc.description || '',
        quantity: nc.quantity !== undefined ? Number(nc.quantity) : 1,
        unit: nc.unit || 'units',
        estimatedValue: nc.estimatedValue !== undefined ? Number(nc.estimatedValue) : 0,
        expectedDate: nc.expectedDate ? new Date(nc.expectedDate) : null,
        status: nc.status || 'PENDING',
      }))
    : [];

  if (cashAmount > 0 && !types.includes('CASH')) {
    types.push('CASH');
  }
  for (const nc of nonCash) {
    if (!types.includes(nc.type)) {
      types.push(nc.type);
    }
  }

  return {
    types,
    cash: { amount: cashAmount, currency: input.cash?.currency || 'INR' },
    nonCash,
  };
}

function validateCreateDeal(body = {}) {
  const errors = {};

  if (!body.eventId || !isValidObjectId(body.eventId)) {
    errors.eventId = 'Valid eventId is required to create a deal';
  }

  if (body.companyId && !isValidObjectId(body.companyId)) {
    errors.companyId = 'Invalid companyId format';
  }

  if (body.committeeId && !isValidObjectId(body.committeeId)) {
    errors.committeeId = 'Invalid committeeId format';
  }

  if (body.applicationId && !isValidObjectId(body.applicationId)) {
    errors.applicationId = 'Invalid applicationId format';
  }

  if (body.invitationId && !isValidObjectId(body.invitationId)) {
    errors.invitationId = 'Invalid invitationId format';
  }

  if (body.contributions) {
    if (Array.isArray(body.contributions)) {
      body.contributions.forEach((c, idx) => {
        Object.assign(errors, validateContributionItem(c, idx));
      });
    } else if (typeof body.contributions === 'object') {
      if (body.contributions.nonCash && Array.isArray(body.contributions.nonCash)) {
        body.contributions.nonCash.forEach((nc, idx) => {
          Object.assign(errors, validateContributionItem(nc, idx));
        });
      }
    }
  }

  return errors;
}

function validateUpdateDeal(body = {}) {
  const errors = {};

  if (body.status && !Object.values(DEAL_STATUS).includes(body.status)) {
    errors.status = `Invalid deal status: ${body.status}. Allowed: ${Object.values(DEAL_STATUS).join(', ')}`;
  }

  return errors;
}

function validateCancelDeal(body = {}) {
  const errors = {};
  const reason = body.reason || body.cancellationReason;

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    errors.cancellationReason = 'Cancellation reason is required to cancel a deal';
  }

  return errors;
}

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
  validateCreateDeal,
  validateUpdateDeal,
  validateCancelDeal,
  validateContributionItem,
  normalizeContributions,
  validateCreateFulfillment,
  validateUpdateFulfillment,
  validateAddEvidence,
  validateCompleteDeal,
  validateCreateDispute,
};
