const mongoose = require('mongoose');
const { CONTRIBUTION_TYPES } = require('../utils/constants');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[0-9\s\-()]{7,20}$/;
const SOCIAL_HANDLE_REGEX = /^@?[a-zA-Z0-9._-]{1,50}$/;

const PROTECTED_FIELDS = ['_id', 'userId', 'isProfileComplete', 'createdAt', 'updatedAt', '__v'];

const ALLOWED_UPDATE_FIELDS = [
  'name',
  'legalName',
  'logoFileId',
  'coverFileId',
  'description',
  'industry',
  'website',
  'location',
  'contact',
  'socialLinks',
  'sponsorshipPreferences',
];

const ALLOWED_LOCATION_FIELDS = ['city', 'state', 'country'];
const ALLOWED_CONTACT_FIELDS = ['phone', 'email'];
const ALLOWED_SOCIAL_FIELDS = ['linkedin', 'instagram', 'website'];
const ALLOWED_PREF_FIELDS = [
  'eventCategories',
  'preferredLocations',
  'targetAudience',
  'budgetMin',
  'budgetMax',
  'contributionTypes',
];

const ALLOWED_HISTORY_FIELDS = [
  'title',
  'eventName',
  'partnerName',
  'date',
  'description',
  'mediaFileIds',
];

const PROTECTED_HISTORY_FIELDS = [
  '_id',
  'ownerId',
  'ownerType',
  'verificationStatus',
  'createdAt',
  'updatedAt',
  '__v',
];

/**
 * Validates whether a string is a well-formed URL.
 */
function isValidUrl(val) {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  try {
    const withProto =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;
    const parsed = new URL(withProto);
    return Boolean(parsed.hostname && parsed.hostname.includes('.'));
  } catch {
    return false;
  }
}

/**
 * Validates social link (either full URL or valid profile handle).
 */
function isValidSocialLinkOrHandle(val) {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (isValidUrl(trimmed)) return true;
  return SOCIAL_HANDLE_REGEX.test(trimmed);
}

/**
 * Validates phone number format.
 */
function isValidPhone(val) {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  return PHONE_REGEX.test(trimmed);
}


/**
 * Validate Company Profile update payload.
 * Rejects protected ownership fields and arbitrary unsupported fields.
 */
function validateCompanyUpdate(body = {}) {
  const errors = {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { body: 'Request body must be a valid JSON object' };
  }

  // 1. Check for forbidden modification of protected fields
  for (const field of PROTECTED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      errors[field] = `Modifying protected field '${field}' is not allowed`;
    }
  }

  // 2. Reject arbitrary unsupported fields
  for (const key of Object.keys(body)) {
    if (!ALLOWED_UPDATE_FIELDS.includes(key) && !PROTECTED_FIELDS.includes(key)) {
      errors[key] = `Unsupported field '${key}' in company profile update`;
    }
  }

  // 3. Field: name
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      errors.name = 'Company name cannot be empty';
    } else if (body.name.trim().length < 2 || body.name.trim().length > 100) {
      errors.name = 'Company name must be between 2 and 100 characters';
    }
  }

  // 4. Field: legalName
  if (body.legalName !== undefined && body.legalName !== null) {
    if (typeof body.legalName !== 'string') {
      errors.legalName = 'Legal name must be a string';
    } else if (body.legalName.trim().length > 150) {
      errors.legalName = 'Legal name cannot exceed 150 characters';
    }
  }

  // 5. Field: description
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      errors.description = 'Description must be a string';
    } else if (body.description.length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters';
    }
  }

  // 6. Field: industry
  if (body.industry !== undefined && body.industry !== null) {
    if (typeof body.industry !== 'string') {
      errors.industry = 'Industry must be a string';
    } else if (body.industry.trim().length > 100) {
      errors.industry = 'Industry cannot exceed 100 characters';
    }
  }

  // 7. Field: website
  if (body.website !== undefined && body.website !== null && body.website !== '') {
    if (typeof body.website !== 'string' || !isValidUrl(body.website)) {
      errors.website = 'Website must be a valid URL';
    }
  }

  // 8. Field: logoFileId
  if (body.logoFileId !== undefined && body.logoFileId !== null) {
    if (!mongoose.Types.ObjectId.isValid(body.logoFileId)) {
      errors.logoFileId = 'Logo file ID must be a valid ObjectId';
    }
  }

  // 9. Field: coverFileId
  if (body.coverFileId !== undefined && body.coverFileId !== null) {
    if (!mongoose.Types.ObjectId.isValid(body.coverFileId)) {
      errors.coverFileId = 'Cover file ID must be a valid ObjectId';
    }
  }

  // 10. Field: location
  if (body.location !== undefined && body.location !== null) {
    if (typeof body.location !== 'object' || Array.isArray(body.location)) {
      errors.location = 'Location must be an object with city, state, country';
    } else {
      for (const locKey of Object.keys(body.location)) {
        if (!ALLOWED_LOCATION_FIELDS.includes(locKey)) {
          errors[`location.${locKey}`] = `Unsupported location field '${locKey}'`;
        }
      }
      if (body.location.city !== undefined && typeof body.location.city !== 'string') {
        errors['location.city'] = 'City must be a string';
      }
      if (body.location.state !== undefined && typeof body.location.state !== 'string') {
        errors['location.state'] = 'State must be a string';
      }
      if (body.location.country !== undefined && typeof body.location.country !== 'string') {
        errors['location.country'] = 'Country must be a string';
      }
    }
  }

  // 11. Field: contact
  if (body.contact !== undefined && body.contact !== null) {
    if (typeof body.contact !== 'object' || Array.isArray(body.contact)) {
      errors.contact = 'Contact must be an object with phone and optional email';
    } else {
      for (const cKey of Object.keys(body.contact)) {
        if (!ALLOWED_CONTACT_FIELDS.includes(cKey)) {
          errors[`contact.${cKey}`] = `Unsupported contact field '${cKey}'`;
        }
      }
      if (body.contact.phone !== undefined && body.contact.phone !== '') {
        if (typeof body.contact.phone !== 'string' || !PHONE_REGEX.test(body.contact.phone.trim())) {
          errors['contact.phone'] = 'Please provide a valid contact phone number';
        }
      }
      if (body.contact.email !== undefined && body.contact.email !== '') {
        if (typeof body.contact.email !== 'string' || !EMAIL_REGEX.test(body.contact.email.trim())) {
          errors['contact.email'] = 'Please provide a valid contact email address';
        }
      }
    }
  }

  // 12. Field: socialLinks
  if (body.socialLinks !== undefined && body.socialLinks !== null) {
    if (typeof body.socialLinks !== 'object' || Array.isArray(body.socialLinks)) {
      errors.socialLinks = 'Social links must be an object';
    } else {
      for (const sKey of Object.keys(body.socialLinks)) {
        if (!ALLOWED_SOCIAL_FIELDS.includes(sKey)) {
          errors[`socialLinks.${sKey}`] = `Unsupported social link field '${sKey}'`;
        }
      }
      if (body.socialLinks.linkedin !== undefined && body.socialLinks.linkedin !== '') {
        if (!isValidSocialLinkOrHandle(body.socialLinks.linkedin)) {
          errors['socialLinks.linkedin'] = 'LinkedIn must be a valid URL or handle';
        }
      }
      if (body.socialLinks.instagram !== undefined && body.socialLinks.instagram !== '') {
        if (!isValidSocialLinkOrHandle(body.socialLinks.instagram)) {
          errors['socialLinks.instagram'] = 'Instagram must be a valid URL or handle';
        }
      }
      if (body.socialLinks.website !== undefined && body.socialLinks.website !== '') {
        if (!isValidUrl(body.socialLinks.website)) {
          errors['socialLinks.website'] = 'Website link must be a valid URL';
        }
      }
    }
  }

  // 13. Field: sponsorshipPreferences
  if (body.sponsorshipPreferences !== undefined && body.sponsorshipPreferences !== null) {
    if (typeof body.sponsorshipPreferences !== 'object' || Array.isArray(body.sponsorshipPreferences)) {
      errors.sponsorshipPreferences = 'Sponsorship preferences must be an object';
    } else {
      for (const pKey of Object.keys(body.sponsorshipPreferences)) {
        if (!ALLOWED_PREF_FIELDS.includes(pKey)) {
          errors[`sponsorshipPreferences.${pKey}`] = `Unsupported preference field '${pKey}'`;
        }
      }

      const {
        budgetMin,
        budgetMax,
        eventCategories,
        preferredLocations,
        targetAudience,
        contributionTypes,
      } = body.sponsorshipPreferences;

      if (budgetMin !== undefined) {
        if (typeof budgetMin !== 'number' || budgetMin < 0 || isNaN(budgetMin)) {
          errors['sponsorshipPreferences.budgetMin'] = 'Minimum budget must be a positive number';
        }
      }

      if (budgetMax !== undefined) {
        if (typeof budgetMax !== 'number' || budgetMax < 0 || isNaN(budgetMax)) {
          errors['sponsorshipPreferences.budgetMax'] = 'Maximum budget must be a positive number';
        }
      }

      if (
        budgetMin !== undefined &&
        budgetMax !== undefined &&
        typeof budgetMin === 'number' &&
        typeof budgetMax === 'number' &&
        budgetMin > budgetMax
      ) {
        errors['sponsorshipPreferences.budgetRange'] = 'Maximum budget must be greater than or equal to minimum budget';
      }

      if (eventCategories !== undefined) {
        if (!Array.isArray(eventCategories)) {
          errors['sponsorshipPreferences.eventCategories'] = 'Event categories must be an array of strings';
        } else if (eventCategories.some((c) => typeof c !== 'string')) {
          errors['sponsorshipPreferences.eventCategories'] = 'All event category entries must be strings';
        }
      }

      if (preferredLocations !== undefined) {
        if (!Array.isArray(preferredLocations)) {
          errors['sponsorshipPreferences.preferredLocations'] = 'Preferred locations must be an array of strings';
        } else if (preferredLocations.some((l) => typeof l !== 'string')) {
          errors['sponsorshipPreferences.preferredLocations'] = 'All preferred location entries must be strings';
        }
      }

      if (targetAudience !== undefined) {
        if (!Array.isArray(targetAudience)) {
          errors['sponsorshipPreferences.targetAudience'] = 'Target audience must be an array of strings';
        } else if (targetAudience.some((a) => typeof a !== 'string')) {
          errors['sponsorshipPreferences.targetAudience'] = 'All target audience entries must be strings';
        }
      }

      if (contributionTypes !== undefined) {
        if (!Array.isArray(contributionTypes)) {
          errors['sponsorshipPreferences.contributionTypes'] = 'Contribution types must be an array';
        } else {
          for (const ct of contributionTypes) {
            if (!CONTRIBUTION_TYPES.includes(ct)) {
              errors['sponsorshipPreferences.contributionTypes'] = `Invalid contribution type '${ct}'. Allowed: ${CONTRIBUTION_TYPES.join(', ')}`;
              break;
            }
          }
        }
      }
    }
  }

  return errors;
}

/**
 * Validate SelfReportedHistory creation.
 */
function validateCreateHistory(body = {}) {
  const errors = {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { body: 'Request body must be a valid JSON object' };
  }

  for (const field of PROTECTED_HISTORY_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      errors[field] = `Modifying protected field '${field}' is not allowed`;
    }
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_HISTORY_FIELDS.includes(key) && !PROTECTED_HISTORY_FIELDS.includes(key)) {
      errors[key] = `Unsupported field '${key}' in history entry`;
    }
  }

  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    errors.title = 'Title is required';
  } else if (body.title.trim().length < 2 || body.title.trim().length > 150) {
    errors.title = 'Title must be between 2 and 150 characters';
  }

  if (!body.eventName || typeof body.eventName !== 'string' || !body.eventName.trim()) {
    errors.eventName = 'Event name is required';
  } else if (body.eventName.trim().length < 2 || body.eventName.trim().length > 150) {
    errors.eventName = 'Event name must be between 2 and 150 characters';
  }

  if (!body.partnerName || typeof body.partnerName !== 'string' || !body.partnerName.trim()) {
    errors.partnerName = 'Partner name is required';
  } else if (body.partnerName.trim().length < 2 || body.partnerName.trim().length > 150) {
    errors.partnerName = 'Partner name must be between 2 and 150 characters';
  }

  if (!body.date) {
    errors.date = 'Date is required';
  } else {
    const parsedDate = Date.parse(body.date);
    if (isNaN(parsedDate)) {
      errors.date = 'Date must be a valid date format';
    }
  }

  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      errors.description = 'Description must be a string';
    } else if (body.description.length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters';
    }
  }

  if (body.mediaFileIds !== undefined && body.mediaFileIds !== null) {
    if (!Array.isArray(body.mediaFileIds)) {
      errors.mediaFileIds = 'mediaFileIds must be an array of ObjectIds';
    } else {
      for (const id of body.mediaFileIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.mediaFileIds = 'Each mediaFileId must be a valid ObjectId';
          break;
        }
      }
    }
  }

  return errors;
}

/**
 * Validate SelfReportedHistory update.
 */
function validateUpdateHistory(body = {}) {
  const errors = {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { body: 'Request body must be a valid JSON object' };
  }

  for (const field of PROTECTED_HISTORY_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      errors[field] = `Modifying protected field '${field}' is not allowed`;
    }
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_HISTORY_FIELDS.includes(key) && !PROTECTED_HISTORY_FIELDS.includes(key)) {
      errors[key] = `Unsupported field '${key}' in history entry`;
    }
  }

  const providedAllowedKeys = Object.keys(body).filter((k) =>
    ALLOWED_HISTORY_FIELDS.includes(k)
  );

  if (providedAllowedKeys.length === 0) {
    errors.body = 'At least one field must be provided for update';
  }

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      errors.title = 'Title cannot be empty';
    } else if (body.title.trim().length < 2 || body.title.trim().length > 150) {
      errors.title = 'Title must be between 2 and 150 characters';
    }
  }

  if (body.eventName !== undefined) {
    if (typeof body.eventName !== 'string' || !body.eventName.trim()) {
      errors.eventName = 'Event name cannot be empty';
    } else if (body.eventName.trim().length < 2 || body.eventName.trim().length > 150) {
      errors.eventName = 'Event name must be between 2 and 150 characters';
    }
  }

  if (body.partnerName !== undefined) {
    if (typeof body.partnerName !== 'string' || !body.partnerName.trim()) {
      errors.partnerName = 'Partner name cannot be empty';
    } else if (body.partnerName.trim().length < 2 || body.partnerName.trim().length > 150) {
      errors.partnerName = 'Partner name must be between 2 and 150 characters';
    }
  }

  if (body.date !== undefined) {
    const parsedDate = Date.parse(body.date);
    if (isNaN(parsedDate)) {
      errors.date = 'Date must be a valid date format';
    }
  }

  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      errors.description = 'Description must be a string';
    } else if (body.description.length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters';
    }
  }

  if (body.mediaFileIds !== undefined && body.mediaFileIds !== null) {
    if (!Array.isArray(body.mediaFileIds)) {
      errors.mediaFileIds = 'mediaFileIds must be an array of ObjectIds';
    } else {
      for (const id of body.mediaFileIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.mediaFileIds = 'Each mediaFileId must be a valid ObjectId';
          break;
        }
      }
    }
  }

  return errors;
}

module.exports = {
  validateCompanyUpdate,
  validateCreateHistory,
  validateUpdateHistory,
  isValidUrl,
  isValidPhone,
  isValidSocialLinkOrHandle,
};
