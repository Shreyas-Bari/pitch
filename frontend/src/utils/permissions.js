import { ROLES } from './constants.js';

/**
 * Client-side permission helpers.
 * Note: The backend is always the final authorization authority.
 */

export function isCompany(user) {
  return user?.role === ROLES.COMPANY;
}

export function isCommittee(user) {
  return user?.role === ROLES.COMMITTEE;
}

export function isAdmin(user) {
  return user?.role === ROLES.ADMIN;
}

export function hasRole(user, allowedRoles = []) {
  if (!user || !user.role) return false;
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return true;
  return allowedRoles.includes(user.role);
}

export function getDashboardPath(role) {
  switch (role) {
    case ROLES.COMPANY:
      return '/company/dashboard';
    case ROLES.COMMITTEE:
      return '/committee/dashboard';
    case ROLES.ADMIN:
      return '/admin/dashboard';
    default:
      return '/';
  }
}
