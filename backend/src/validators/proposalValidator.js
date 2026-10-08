const mongoose = require('mongoose');
const { validateContributionItem } = require('./dealValidator');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function validateProposalData(body = {}) {
  const errors = {};

  if (body.dealId && !isValidObjectId(body.dealId)) {
    errors.dealId = 'Invalid dealId format';
  }

  // Validate contributions if provided
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

  // Validate benefits
  if (body.benefits !== undefined) {
    if (!Array.isArray(body.benefits)) {
      errors.benefits = 'Benefits must be an array';
    } else {
      body.benefits.forEach((b, idx) => {
        if (!b || typeof b !== 'object') {
          errors[`benefits[${idx}]`] = 'Benefit entry must be an object';
        } else if (!b.title || typeof b.title !== 'string' || !b.title.trim()) {
          errors[`benefits[${idx}].title`] = 'Benefit title is required';
        }
      });
    }
  }

  // Validate deliverables
  if (body.deliverables !== undefined) {
    if (!Array.isArray(body.deliverables)) {
      errors.deliverables = 'Deliverables must be an array';
    } else {
      body.deliverables.forEach((d, idx) => {
        if (!d || typeof d !== 'object') {
          errors[`deliverables[${idx}]`] = 'Deliverable entry must be an object';
        } else {
          if (!d.party || !['COMPANY', 'COMMITTEE'].includes(d.party)) {
            errors[`deliverables[${idx}].party`] = 'Deliverable party must be COMPANY or COMMITTEE';
          }
          if (!d.description || typeof d.description !== 'string' || !d.description.trim()) {
            errors[`deliverables[${idx}].description`] = 'Deliverable description is required';
          }
        }
      });
    }
  }

  return errors;
}

function validateCreateProposal(body = {}) {
  return validateProposalData(body);
}

function validateCounterProposal(body = {}) {
  return validateProposalData(body);
}

function validateProposalAction(body = {}) {
  const errors = {};
  if (body.action && !['ACCEPT', 'DECLINE', 'WITHDRAW'].includes(body.action.toUpperCase())) {
    errors.action = 'Invalid proposal action. Allowed: ACCEPT, DECLINE, WITHDRAW';
  }
  return errors;
}

module.exports = {
  validateCreateProposal,
  validateCounterProposal,
  validateProposalAction,
};
