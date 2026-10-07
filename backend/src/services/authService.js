const crypto = require('crypto');
const { User, Company, Committee } = require('../models');
const { ROLES, USER_STATUS } = require('../utils/constants');
const {
  hashPassword,
  comparePassword,
  generateRandomToken,
  hashToken,
} = require('../utils/password');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');
const ApiError = require('../utils/apiError');
const { env } = require('../config/env');

/**
 * Helper to create and persist a new refresh token session on the user.
 * Prunes expired sessions and saves user.
 */
async function createRefreshSession(user) {
  const sessionId = crypto.randomUUID();
  const refreshToken = generateRefreshToken(user, sessionId);
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  if (!user.refreshSessions) {
    user.refreshSessions = [];
  }
  // Prune expired sessions
  const now = new Date();
  user.refreshSessions = user.refreshSessions.filter(
    (s) => s.expiresAt && s.expiresAt > now
  );

  user.refreshSessions.push({
    sessionId,
    tokenHash,
    expiresAt,
    createdAt: now,
  });

  await user.save();
  return refreshToken;
}

/**
 * Register a new user and create their initial role profile.
 */
async function register(userData = {}) {
  const {
    email,
    password,
    role,
    name,
    collegeName,
    college,
    industry,
    website,
    phone,
    location,
  } = userData;

  const normalizedEmail = email.trim().toLowerCase();

  // Check email uniqueness
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict(
      'An account with this email address already exists',
      null,
      'EMAIL_EXISTS'
    );
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create User
  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    role,
    status: USER_STATUS.ACTIVE,
    isActive: true,
    tokenVersion: 0,
    refreshSessions: [],
  });

  // Create linked profile according to role
  if (role === ROLES.COMPANY) {
    await Company.create({
      userId: user._id,
      name: name || 'Company',
      industry: industry || '',
      website: website || '',
      location: location || {},
      contact: phone ? { phone } : {},
      isProfileComplete: false,
    });
  } else if (role === ROLES.COMMITTEE) {
    const collegeObj =
      typeof college === 'object' && college?.name
        ? college
        : { name: collegeName || 'College', location: location || {} };

    await Committee.create({
      userId: user._id,
      name: name || 'Committee',
      college: collegeObj,
      website: website || '',
      contact: phone ? { phone } : {},
      isProfileComplete: false,
    });
  }

  // Generate short-lived access token and unique refresh session
  const accessToken = generateAccessToken(user);
  const refreshToken = await createRefreshSession(user);

  return {
    user,
    accessToken,
    refreshToken,
  };
}

/**
 * Log in an existing user.
 */
async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password', null, 'INVALID_CREDENTIALS');
  }

  // Verify account status
  if (!user.isActive || user.status === USER_STATUS.SUSPENDED || user.status === USER_STATUS.DEACTIVATED) {
    throw ApiError.forbidden(
      'Your account is deactivated or suspended. Please contact support.',
      null,
      'ACCOUNT_INACTIVE'
    );
  }

  // Verify password
  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password', null, 'INVALID_CREDENTIALS');
  }

  // Update last login
  user.lastLoginAt = new Date();

  // Generate short-lived access token and unique refresh session
  const accessToken = generateAccessToken(user);
  const refreshToken = await createRefreshSession(user);

  return {
    user,
    accessToken,
    refreshToken,
  };
}

/**
 * Validate refresh token and issue rotated token pair.
 * Invalidate the old refresh token/session and reject reuse.
 */
async function refreshTokens({ refreshToken }) {
  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token is required', null, 'REFRESH_TOKEN_REQUIRED');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Refresh token has expired', null, 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid or expired refresh token', null, 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw ApiError.unauthorized('User not found or account removed', null, 'USER_NOT_FOUND');
  }

  if (!user.isActive || user.status === USER_STATUS.SUSPENDED || user.status === USER_STATUS.DEACTIVATED) {
    throw ApiError.forbidden('Your account is deactivated or suspended', null, 'ACCOUNT_INACTIVE');
  }

  // Check token version for global revocation
  if (decoded.tokenVersion !== (user.tokenVersion || 0)) {
    throw ApiError.unauthorized(
      'Refresh token has been revoked. Please log in again.',
      null,
      'TOKEN_REVOKED'
    );
  }

  // Check unique session identifier in user.refreshSessions
  const sessionIndex = (user.refreshSessions || []).findIndex(
    (s) => s.sessionId === decoded.sessionId
  );

  // If session not found, token has already been rotated (reuse attempt) or revoked
  if (sessionIndex === -1) {
    throw ApiError.unauthorized(
      'Refresh token has already been used or revoked',
      null,
      'TOKEN_REVOKED'
    );
  }

  const existingSession = user.refreshSessions[sessionIndex];
  const expectedHash = hashToken(refreshToken);
  if (existingSession.tokenHash !== expectedHash) {
    // Invalidate session on hash mismatch
    user.refreshSessions.splice(sessionIndex, 1);
    await user.save();
    throw ApiError.unauthorized('Invalid refresh token session', null, 'INVALID_REFRESH_TOKEN');
  }

  // Invalidate old refresh token session immediately
  user.refreshSessions.splice(sessionIndex, 1);

  // Issue brand new rotated refresh token session
  const newSessionId = crypto.randomUUID();
  const newRefreshToken = generateRefreshToken(user, newSessionId);
  const newTokenHash = hashToken(newRefreshToken);
  const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  user.refreshSessions.push({
    sessionId: newSessionId,
    tokenHash: newTokenHash,
    expiresAt: newExpiresAt,
    createdAt: new Date(),
  });

  await user.save();

  // Issue new short-lived access token
  const newAccessToken = generateAccessToken(user);

  return {
    user,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Logout user, invalidate refresh session, and increment token version.
 */
async function logout({ userId, refreshToken }) {
  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded && decoded.userId) {
        await User.findByIdAndUpdate(decoded.userId, {
          $pull: { refreshSessions: { sessionId: decoded.sessionId } },
          $inc: { tokenVersion: 1 },
        });
        return true;
      }
    } catch (err) {
      // Ignore invalid token during logout
    }
  }
  if (userId) {
    await User.findByIdAndUpdate(userId, {
      $set: { refreshSessions: [] },
      $inc: { tokenVersion: 1 },
    });
  }
  return true;
}

/**
 * Get current user profile and linked role profile.
 */
async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found', null, 'USER_NOT_FOUND');
  }

  let profile = null;
  if (user.role === ROLES.COMPANY) {
    profile = await Company.findOne({ userId });
  } else if (user.role === ROLES.COMMITTEE) {
    profile = await Committee.findOne({ userId });
  }

  return {
    user,
    profile,
  };
}

/**
 * Request password reset token.
 */
async function forgotPassword({ email }) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  // Return generic success to prevent email enumeration
  if (!user || !user.isActive || user.status !== USER_STATUS.ACTIVE) {
    return {
      message: 'If an account exists with this email, a password reset link has been sent.',
    };
  }

  const rawToken = generateRandomToken(32);
  const hashedToken = hashToken(rawToken);

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const isDevOrTest = env.NODE_ENV !== 'production';
  return {
    message: 'If an account exists with this email, a password reset link has been sent.',
    resetToken: isDevOrTest ? rawToken : undefined,
  };
}

/**
 * Reset password using valid reset token.
 * Revokes all existing refresh sessions.
 */
async function resetPassword({ token, newPassword, password }) {
  const targetPassword = newPassword || password;
  if (!token) {
    throw ApiError.badRequest('Reset token is required', null, 'VALIDATION_ERROR');
  }
  if (!targetPassword || targetPassword.length < 8) {
    throw ApiError.badRequest('Password must be at least 8 characters long', null, 'VALIDATION_ERROR');
  }

  const hashedToken = hashToken(token);
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw ApiError.badRequest(
      'Password reset token is invalid or has expired',
      null,
      'INVALID_RESET_TOKEN'
    );
  }

  user.passwordHash = await hashPassword(targetPassword);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.refreshSessions = []; // Invalidate all refresh sessions
  user.tokenVersion = (user.tokenVersion || 0) + 1; // Revoke all existing sessions
  await user.save();

  return {
    message: 'Password has been reset successfully',
  };
}

/**
 * Change password for authenticated user.
 * Revokes all previous refresh sessions and issues fresh tokens for the current session.
 */
async function changePassword({ userId, currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest('Current password and new password are required');
  }
  if (newPassword.length < 8) {
    throw ApiError.badRequest('New password must be at least 8 characters long');
  }

  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect', null, 'INVALID_CURRENT_PASSWORD');
  }

  const isSame = await comparePassword(newPassword, user.passwordHash);
  if (isSame) {
    throw ApiError.badRequest(
      'New password cannot be identical to current password',
      null,
      'PASSWORD_UNCHANGED'
    );
  }

  user.passwordHash = await hashPassword(newPassword);
  user.refreshSessions = []; // Invalidate all previous refresh sessions
  user.tokenVersion = (user.tokenVersion || 0) + 1; // Revoke previous refresh tokens
  await user.save();

  // Issue fresh tokens and unique refresh session for current session
  const accessToken = generateAccessToken(user);
  const refreshToken = await createRefreshSession(user);

  return {
    user,
    accessToken,
    refreshToken,
    message: 'Password changed successfully',
  };
}

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changePassword,
};
