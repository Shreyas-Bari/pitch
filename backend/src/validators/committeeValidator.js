const mongoose = require('mongoose');
const {
  validateCreateHistory,
  validateUpdateHistory,
  isValidUrl,
  isValidPhone,
  isValidSocialLinkOrHandle,
} = require('./companyValidator');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[0-9\s\-()]{7,20}$/;

const PROTECTED_FIELDS = ['_id', 'userId', 'isProfileComplete', 'createdAt', 'updatedAt', '__v'];

const ALLOWED_UPDATE_FIELDS = [
  'name',
  'college',
  'logoFileId',
  'coverFileId',
  'description',
  'committeeType',
  'website',
  'contact',
  'socialLinks',
];

const ALLOWED_COLLEGE_FIELDS = ['name', 'location'];
const ALLOWED_LOCATION_FIELDS = ['city', 'state', 'country'];
const ALLOWED_CONTACT_FIELDS = ['phone', 'email'];
const ALLOWED_SOCIAL_FIELDS = ['instagram', 'linkedin', 'website'];

/**
 * Validate Committee Profile update payload.
 * Rejects protected ownership fields and arbitrary unsupported fields.
 */
function validateCommitteeUpdate(body = {}) {
  const errors = {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { body: 'Request body must be a valid JSON object' };
  }

  // 1. Reject modification of protected fields
  for (const field of PROTECTED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      errors[field] = `Modifying protected field '${field}' is not allowed`;
    }
  }

  // 2. Reject arbitrary unsupported fields
  for (const key of Object.keys(body)) {
    if (!ALLOWED_UPDATE_FIELDS.includes(key) && !PROTECTED_FIELDS.includes(key)) {
      errors[key] = `Unsupported field '${key}' in committee profile update`;
    }
  }

  // 3. Field: name
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      errors.name = 'Committee name cannot be empty';
    } else if (body.name.trim().length < 2 || body.name.trim().length > 100) {
      errors.name = 'Committee name must be between 2 and 100 characters';
    }
  }

  // 4. Field: description
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      errors.description = 'Description must be a string';
    } else if (body.description.length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters';
    }
  }

  // 5. Field: committeeType
  if (body.committeeType !== undefined && body.committeeType !== null) {
    if (typeof body.committeeType !== 'string') {
      errors.committeeType = 'Committee type must be a string';
    } else if (body.committeeType.trim().length > 100) {
      errors.committeeType = 'Committee type cannot exceed 100 characters';
    }
  }

  // 6. Field: website
  if (body.website !== undefined && body.website !== null && body.website !== '') {
    if (typeof body.website !== 'string' || !isValidUrl(body.website)) {
      errors.website = 'Website must be a valid URL';
    }
  }

  // 7. Field: logoFileId
  if (body.logoFileId !== undefined && body.logoFileId !== null) {
    if (!mongoose.Types.ObjectId.isValid(body.logoFileId)) {
      errors.logoFileId = 'Logo file ID must be a valid ObjectId';
    }
  }

  // 8. Field: coverFileId
  if (body.coverFileId !== undefined && body.coverFileId !== null) {
    if (!mongoose.Types.ObjectId.isValid(body.coverFileId)) {
      errors.coverFileId = 'Cover file ID must be a valid ObjectId';
    }
  }

  // 9. Field: college
  if (body.college !== undefined && body.college !== null) {
    if (typeof body.college !== 'object' || Array.isArray(body.college)) {
      errors.college = 'College must be an object with name and optional location';
    } else {
      for (const colKey of Object.keys(body.college)) {
        if (!ALLOWED_COLLEGE_FIELDS.includes(colKey)) {
          errors[`college.${colKey}`] = `Unsupported college field '${colKey}'`;
        }
      }

      if (body.college.name !== undefined) {
        if (typeof body.college.name !== 'string' || !body.college.name.trim()) {
          errors['college.name'] = 'College name cannot be empty';
        } else if (body.college.name.trim().length < 2 || body.college.name.trim().length > 150) {
          errors['college.name'] = 'College name must be between 2 and 150 characters';
        }
      }

      if (body.college.location !== undefined && body.college.location !== null) {
        if (typeof body.college.location !== 'object' || Array.isArray(body.college.location)) {
          errors['college.location'] = 'College location must be an object';
        } else {
          for (const locKey of Object.keys(body.college.location)) {
            if (!ALLOWED_LOCATION_FIELDS.includes(locKey)) {
              errors[`college.location.${locKey}`] = `Unsupported location field '${locKey}'`;
            }
          }
          if (body.college.location.city !== undefined && typeof body.college.location.city !== 'string') {
            errors['college.location.city'] = 'City must be a string';
          }
          if (body.college.location.state !== undefined && typeof body.college.location.state !== 'string') {
            errors['college.location.state'] = 'State must be a string';
          }
          if (body.college.location.country !== undefined && typeof body.college.location.country !== 'string') {
            errors['college.location.country'] = 'Country must be a string';
          }
        }
      }
    }
  }

  // 10. Field: contact
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

  // 11. Field: socialLinks
  if (body.socialLinks !== undefined && body.socialLinks !== null) {
    if (typeof body.socialLinks !== 'object' || Array.isArray(body.socialLinks)) {
      errors.socialLinks = 'Social links must be an object';
    } else {
      for (const sKey of Object.keys(body.socialLinks)) {
        if (!ALLOWED_SOCIAL_FIELDS.includes(sKey)) {
          errors[`socialLinks.${sKey}`] = `Unsupported social link field '${sKey}'`;
        }
      }
      if (body.socialLinks.instagram !== undefined && body.socialLinks.instagram !== '') {
        if (!isValidSocialLinkOrHandle(body.socialLinks.instagram)) {
          errors['socialLinks.instagram'] = 'Instagram must be a valid URL or handle';
        }
      }
      if (body.socialLinks.linkedin !== undefined && body.socialLinks.linkedin !== '') {
        if (!isValidSocialLinkOrHandle(body.socialLinks.linkedin)) {
          errors['socialLinks.linkedin'] = 'LinkedIn must be a valid URL or handle';
        }
      }
      if (body.socialLinks.website !== undefined && body.socialLinks.website !== '') {
        if (!isValidUrl(body.socialLinks.website)) {
          errors['socialLinks.website'] = 'Website link must be a valid URL';
        }
      }
    }
  }

  return errors;
}

module.exports = {
  validateCommitteeUpdate,
  validateCreateHistory,
  validateUpdateHistory,
  isValidUrl,
  isValidPhone,
  isValidSocialLinkOrHandle,
};
