const { ROLES } = require('../utils/constants');
const ApiError = require('../utils/apiError');

/**
 * Role-Based Access Control (RBAC) Middleware.
 * Enforces backend-authoritative role verification.
 * Source: docs/PITCH_FINAL_BUILD_SPEC.md Section 35.1
 */

/**
 * Require the authenticated user to have one of the specified roles.
 * @param {...string|string[]} roles - One or more allowed roles
 * @returns {Function} Express middleware
 */
function requireRole(...roles) {
  // Support both requireRole('ADMIN', 'COMPANY') and requireRole(['ADMIN', 'COMPANY'])
  const allowedRoles = roles.flat();

  return (req, _res, next) => {
    // 1. Verify user is authenticated
    if (!req.user) {
      return next(
        ApiError.unauthorized(
          'Authentication required.',
          null,
          'UNAUTHORIZED'
        )
      );
    }

    // 2. Verify user has an allowed role
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return next(
        ApiError.forbidden(
          `Access denied. Insufficient permissions for role: ${userRole}`,
          { allowedRoles, currentRole: userRole },
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}

/**
 * Alias for requireRole accepting an array of roles.
 * @param {string[]} roles
 * @returns {Function} Express middleware
 */
function requireAnyRole(roles = []) {
  return requireRole(roles);
}

// Convenience pre-configured middleware
const requireAdmin = requireRole(ROLES.ADMIN);
const requireCompany = requireRole(ROLES.COMPANY);
const requireCommittee = requireRole(ROLES.COMMITTEE);
const requireCompanyOrAdmin = requireRole(ROLES.COMPANY, ROLES.ADMIN);
const requireCommitteeOrAdmin = requireRole(ROLES.COMMITTEE, ROLES.ADMIN);

module.exports = {
  requireRole,
  requireAnyRole,
  requireAdmin,
  requireCompany,
  requireCommittee,
  requireCompanyOrAdmin,
  requireCommitteeOrAdmin,
};
