const authService = require('../services/authService');
const { setRefreshTokenCookie, clearRefreshTokenCookie } = require('../utils/jwt');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Register a new user and link role profile.
 * POST /api/v1/auth/register
 */
async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    setRefreshTokenCookie(res, result.refreshToken);
    return sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Log in an existing user.
 * POST /api/v1/auth/login
 */
async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    setRefreshTokenCookie(res, result.refreshToken);
    return sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      200
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Refresh access token using HttpOnly cookie or body refresh token.
 * POST /api/v1/auth/refresh
 */
async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await authService.refreshTokens({ refreshToken });
    setRefreshTokenCookie(res, result.refreshToken);
    return sendSuccess(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      200
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Log out user and clear refresh token cookie.
 * POST /api/v1/auth/logout
 */
async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const userId = req.user?._id;
    await authService.logout({ userId, refreshToken });
    clearRefreshTokenCookie(res);
    return sendSuccess(
      res,
      {
        message: 'Logged out successfully',
      },
      200
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Get current authenticated user details and profile.
 * GET /api/v1/auth/me or GET /api/v1/users/me
 */
async function getMe(req, res, next) {
  try {
    const result = await authService.getCurrentUser(req.user._id);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * Request password reset token.
 * POST /api/v1/auth/forgot-password
 */
async function forgotPassword(req, res, next) {
  try {
    const result = await authService.forgotPassword(req.body);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * Reset password using token.
 * POST /api/v1/auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body);
    return sendSuccess(res, result, 200);
  } catch (err) {
    next(err);
  }
}

/**
 * Change password for authenticated user.
 * PATCH /api/v1/auth/change-password
 */
async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword({
      userId: req.user._id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    setRefreshTokenCookie(res, result.refreshToken);
    return sendSuccess(
      res,
      {
        message: result.message,
        accessToken: result.accessToken,
      },
      200
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
};
