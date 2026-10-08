const mongoose = require('mongoose');

const ALLOWED_INVITATION_FIELDS = [
  'companyId',
  'packageId',
  'message',
  'expiresAt',
];

function validateCreateInvitation(body) {
  const errors = {};
  const unsupported = Object.keys(body).filter(k => !ALLOWED_INVITATION_FIELDS.includes(k));
  if (unsupported.length > 0) {
    errors.unsupported = 'Unsupported fields: ' + unsupported.join(', ');
  }

  if (!body.companyId || !mongoose.Types.ObjectId.isValid(body.companyId)) {
    errors.companyId = 'Valid company ID is required';
  }

  if (body.packageId && !mongoose.Types.ObjectId.isValid(body.packageId)) {
    errors.packageId = 'Invalid package ID format';
  }

  if (body.expiresAt) {
    const d = new Date(body.expiresAt);
    if (isNaN(d.getTime())) {
      errors.expiresAt = 'Invalid expiresAt date format';
    } else if (d <= new Date()) {
      errors.expiresAt = 'Expiration date must be in the future';
    }
  }

  return errors;
}

module.exports = {
  validateCreateInvitation,
  ALLOWED_INVITATION_FIELDS,
};
