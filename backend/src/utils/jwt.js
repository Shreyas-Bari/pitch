const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { env } = require('../config/env');

/**
 * Generate a short-lived access token.
 * Payload includes userId, email, and role.
 * Signed with JWT_SECRET.
 * @param {Object} user
 * @returns {string}
 */
function generateAccessToken(user) {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

/**
 * Generate a long-lived refresh token with a unique session identifier.
 * Payload includes userId, sessionId, and tokenVersion.
 * Signed with JWT_REFRESH_SECRET.
 * @param {Object} user
 * @param {string} [sessionId] - Unique session/token identifier
 * @returns {string}
 */
function generateRefreshToken(user, sessionId = null) {
  const payload = {
    userId: user._id.toString(),
    sessionId: sessionId || crypto.randomUUID(),
    tokenVersion: typeof user.tokenVersion === 'number' ? user.tokenVersion : 0,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

/**
 * Verify an access token.
 * @param {string} token
 * @returns {Object} Decoded payload
 */
function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {Object} Decoded payload
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

/**
 * Cookie options for HttpOnly refresh token cookie.
 * @returns {Object}
 */
function getRefreshTokenCookieOptions() {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  };
}

/**
 * Set refresh token as a secure HttpOnly cookie on response.
 * @param {Object} res
 * @param {string} token
 */
function setRefreshTokenCookie(res, token) {
  res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, token, getRefreshTokenCookieOptions());
}

/**
 * Clear refresh token cookie on response.
 * @param {Object} res
 */
function clearRefreshTokenCookie(res) {
  const options = { ...getRefreshTokenCookieOptions() };
  delete options.maxAge;
  res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, options);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshTokenCookieOptions,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};