const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const { USER_STATUS } = require('../utils/constants');
const ApiError = require('../utils/apiError');

/**
 * Authentication Middleware
 * Validates JWT access token in Authorization header, checks user existence & active status,
 * and attaches authenticated User document to req.user.
 */
async function authenticate(req, _res, next) {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(
        ApiError.unauthorized(
          'Authentication required. Bearer token not provided.',
          null,
          'UNAUTHORIZED'
        )
      );
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(
          ApiError.unauthorized(
            'Access token has expired',
            null,
            'TOKEN_EXPIRED'
          )
        );
      }
      return next(
        ApiError.unauthorized(
          'Invalid access token',
          null,
          'INVALID_TOKEN'
        )
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(
        ApiError.unauthorized(
          'User not found or account removed',
          null,
          'USER_NOT_FOUND'
        )
      );
    }

    if (!user.isActive || user.status === USER_STATUS.SUSPENDED || user.status === USER_STATUS.DEACTIVATED) {
      return next(
        ApiError.forbidden(
          'User account is inactive or suspended',
          null,
          'ACCOUNT_INACTIVE'
        )
      );
    }

    req.user = user;
    req.auth = decoded;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  authenticate,
  authMiddleware: authenticate,
};