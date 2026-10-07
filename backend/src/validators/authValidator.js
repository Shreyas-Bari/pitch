const { ROLES } = require('../utils/constants');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(body = {}) {
  const errors = {};

  if (!body.email || typeof body.email !== 'string' || !body.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(body.email.trim())) {
    errors.email = 'Please provide a valid email address';
  }

  if (!body.password || typeof body.password !== 'string') {
    errors.password = 'Password is required';
  } else if (body.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  }

  if (!body.role || typeof body.role !== 'string') {
    errors.role = 'Role is required';
  } else if (!Object.values(ROLES).includes(body.role)) {
    errors.role = 'Invalid role. Allowed roles: ' + Object.values(ROLES).join(', ');
  }

  if (body.role === ROLES.COMPANY) {
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      errors.name = 'Company name is required for company registration';
    }
  }

  if (body.role === ROLES.COMMITTEE) {
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      errors.name = 'Committee name is required for committee registration';
    }
    const collegeName = body.collegeName || (body.college && body.college.name);
    if (!collegeName || typeof collegeName !== 'string' || !collegeName.trim()) {
      errors.collegeName = 'College name is required for committee registration';
    }
  }

  return errors;
}

function validateLogin(body = {}) {
  const errors = {};

  if (!body.email || typeof body.email !== 'string' || !body.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(body.email.trim())) {
    errors.email = 'Please provide a valid email address';
  }

  if (!body.password || typeof body.password !== 'string') {
    errors.password = 'Password is required';
  }

  return errors;
}

function validateForgotPassword(body = {}) {
  const errors = {};

  if (!body.email || typeof body.email !== 'string' || !body.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(body.email.trim())) {
    errors.email = 'Please provide a valid email address';
  }

  return errors;
}

function validateResetPassword(body = {}) {
  const errors = {};

  if (!body.token || typeof body.token !== 'string' || !body.token.trim()) {
    errors.token = 'Reset token is required';
  }

  const newPassword = body.newPassword || body.password;
  if (!newPassword || typeof newPassword !== 'string') {
    errors.newPassword = 'New password is required';
  } else if (newPassword.length < 8) {
    errors.newPassword = 'Password must be at least 8 characters long';
  }

  return errors;
}

function validateChangePassword(body = {}) {
  const errors = {};

  if (!body.currentPassword || typeof body.currentPassword !== 'string') {
    errors.currentPassword = 'Current password is required';
  }

  if (!body.newPassword || typeof body.newPassword !== 'string') {
    errors.newPassword = 'New password is required';
  } else if (body.newPassword.length < 8) {
    errors.newPassword = 'New password must be at least 8 characters long';
  }

  return errors;
}

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
};