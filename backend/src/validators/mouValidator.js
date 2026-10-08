function validateGenerateMou(body = {}) {
  const errors = {};

  if (body.legalSettings) {
    if (body.legalSettings.curePeriodDays !== undefined) {
      const days = Number(body.legalSettings.curePeriodDays);
      if (isNaN(days) || days <= 0) {
        errors['legalSettings.curePeriodDays'] = 'Cure period must be a positive integer';
      }
    }
    if (body.legalSettings.noticePeriodDays !== undefined) {
      const days = Number(body.legalSettings.noticePeriodDays);
      if (isNaN(days) || days <= 0) {
        errors['legalSettings.noticePeriodDays'] = 'Notice period must be a positive integer';
      }
    }
  }

  return errors;
}

function validateSignMou(body = {}) {
  const errors = {};

  if (!body.fullName || typeof body.fullName !== 'string' || !body.fullName.trim()) {
    errors.fullName = 'Full legal name of the authorized signer is required';
  }

  if (!body.designation || typeof body.designation !== 'string' || !body.designation.trim()) {
    errors.designation = 'Signer designation is required';
  }

  if (body.agreedToTerms !== true) {
    errors.agreedToTerms = 'You must explicitly agree to the terms of this MoU';
  }

  if (!body.consentText || typeof body.consentText !== 'string' || !body.consentText.trim()) {
    errors.consentText = 'Consent declaration text is required';
  }

  if (!body.signatureData || typeof body.signatureData !== 'string' || !body.signatureData.trim()) {
    errors.signatureData = 'Signature representation is required';
  }

  return errors;
}

module.exports = {
  validateGenerateMou,
  validateSignMou,
};
