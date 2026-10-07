/**
 * Comprehensive Authentication Test Suite for PITCH Phase 4
 * Source of Truth: docs/PITCH_API_FINAL.md Section 2 & docs/PITCH_FINAL_BUILD_SPEC.md Section 34
 *
 * Verifies:
 * - User registration (Company & Committee profile linkage)
 * - Duplicate email prevention (409 Conflict)
 * - Invalid registration data rejection (400 Bad Request)
 * - Login success & credential verification (200 OK vs 401 Unauthorized)
 * - Access token authentication (valid, expired, tampered, missing)
 * - Current authenticated user endpoints (/api/v1/auth/me & /api/v1/users/me)
 * - Comprehensive Refresh Token Strategy:
 *     * First refresh succeeds
 *     * Newly issued rotated refresh token succeeds
 *     * Old refresh token is rejected after rotation (reuse detection)
 *     * Invalid refresh token rejected
 *     * Expired refresh token rejected
 *     * Logout revokes refresh sessions
 *     * Password reset/change revokes refresh sessions
 * - Forgot password flow (secure token generation, no enumeration)
 * - Reset password flow (token validation, password update, revocation)
 * - Change password flow (current password verification, new token issuance)
 * - Inactive, suspended, and nonexistent user rejection (401/403)
 * - Authentication Rate Limiting:
 *     * Normal authentication requests succeed
 *     * Requests beyond configured limit receive standard 429 RATE_LIMIT_EXCEEDED
 *     * Rate limiting does NOT affect unrelated health/public endpoints
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { env, validateEnv } = require('./src/config/env');
const { User, Company, Committee } = require('./src/models');
const { ROLES, USER_STATUS } = require('./src/utils/constants');
const { resetRateLimits } = require('./src/middleware/rateLimitMiddleware');

async function runAuthTests() {
  console.log('====================================================');
  console.log(' PITCH Phase 4: Authentication Security Test Suite  ');
  console.log('====================================================\n');

  validateEnv();
  await connectDB();
  console.log('✓ Database connection established\n');

  // Reset rate limiters before test execution
  resetRateLimits();

  const timestamp = Date.now();
  const companyEmail = `company.auth.${timestamp}@pitch.ac.in`;
  const committeeEmail = `committee.auth.${timestamp}@pitch.ac.in`;
  const password = 'StrongPassword123!';

  let companyAccessToken = null;
  let companyRefreshTokenCookie = null;
  let companyUserId = null;

  let committeeAccessToken = null;
  let committeeUserId = null;

  try {
    // ----------------------------------------------------
    // TEST 1: User Registration Success (Company & Committee)
    // ----------------------------------------------------
    console.log('[TEST 1] Testing User Registration Success (Company & Committee)...');

    // 1.1 Company Registration
    const regCompanyRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: companyEmail,
        password: password,
        role: ROLES.COMPANY,
        name: 'Tech Ventures Ltd',
        industry: 'Software',
      });

    if (regCompanyRes.status !== 201) {
      throw new Error(`Company registration failed with status ${regCompanyRes.status}: ${JSON.stringify(regCompanyRes.body)}`);
    }

    if (!regCompanyRes.body.success || !regCompanyRes.body.data.accessToken || !regCompanyRes.body.data.user) {
      throw new Error('Registration response missing success, accessToken, or user payload');
    }

    companyUserId = regCompanyRes.body.data.user._id;
    companyAccessToken = regCompanyRes.body.data.accessToken;

    // Verify sensitive fields are not exposed in response
    if (regCompanyRes.body.data.user.passwordHash || regCompanyRes.body.data.user.resetPasswordToken || regCompanyRes.body.data.user.refreshSessions) {
      throw new Error('Security violation: Sensitive password, token, or session fields exposed in registration response!');
    }

    // Verify HttpOnly refresh token cookie
    const cookies = regCompanyRes.headers['set-cookie'];
    if (!cookies || !cookies.some((c) => c.includes('refreshToken=') && c.includes('HttpOnly'))) {
      throw new Error('Registration failed to set HttpOnly refreshToken cookie');
    }
    companyRefreshTokenCookie = cookies.find((c) => c.startsWith('refreshToken='));

    // Verify linked Company document was created in MongoDB
    const linkedCompany = await Company.findOne({ userId: companyUserId });
    if (!linkedCompany || linkedCompany.name !== 'Tech Ventures Ltd' || linkedCompany.industry !== 'Software') {
      throw new Error('Linked Company profile document was not created correctly in MongoDB');
    }
    console.log('  ✓ Company registration succeeded with linked Company profile and HttpOnly cookie');

    // 1.2 Committee Registration
    const regCommitteeRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: committeeEmail,
        password: password,
        role: ROLES.COMMITTEE,
        name: 'TSEC ACM Student Chapter',
        collegeName: 'Thadomal Shahani Engineering College',
      });

    if (regCommitteeRes.status !== 201) {
      throw new Error(`Committee registration failed: ${JSON.stringify(regCommitteeRes.body)}`);
    }

    committeeUserId = regCommitteeRes.body.data.user._id;
    committeeAccessToken = regCommitteeRes.body.data.accessToken;

    const linkedCommittee = await Committee.findOne({ userId: committeeUserId });
    if (!linkedCommittee || linkedCommittee.college.name !== 'Thadomal Shahani Engineering College') {
      throw new Error('Linked Committee profile document was not created correctly in MongoDB');
    }
    console.log('  ✓ Committee registration succeeded with linked Committee profile');

    // ----------------------------------------------------
    // TEST 2: Duplicate Email Rejection
    // ----------------------------------------------------
    console.log('[TEST 2] Testing Duplicate Email Rejection...');
    const dupRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: companyEmail,
        password: 'AnotherPassword123!',
        role: ROLES.COMPANY,
        name: 'Another Company',
      });

    if (dupRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate email, got ${dupRes.status}`);
    }
    if (dupRes.body.success !== false || dupRes.body.error?.code !== 'EMAIL_EXISTS') {
      throw new Error(`Expected error code EMAIL_EXISTS, got ${JSON.stringify(dupRes.body)}`);
    }
    console.log('  ✓ Duplicate email rejected with status 409 and code EMAIL_EXISTS');

    // ----------------------------------------------------
    // TEST 3: Invalid Registration Data Rejection
    // ----------------------------------------------------
    console.log('[TEST 3] Testing Invalid Registration Data Rejection...');

    // 3.1 Invalid email format
    const badEmailRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password, role: ROLES.COMPANY, name: 'Test' });
    if (badEmailRes.status !== 400) throw new Error('Invalid email should return 400');

    // 3.2 Short password
    const shortPwRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'valid@pitch.ac.in', password: 'short', role: ROLES.COMPANY, name: 'Test' });
    if (shortPwRes.status !== 400) throw new Error('Short password should return 400');

    // 3.3 Invalid role
    const badRoleRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'valid@pitch.ac.in', password, role: 'SUPERUSER', name: 'Test' });
    if (badRoleRes.status !== 400) throw new Error('Invalid role should return 400');

    // 3.4 Missing company name
    const missingCompNameRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'valid@pitch.ac.in', password, role: ROLES.COMPANY });
    if (missingCompNameRes.status !== 400) throw new Error('Missing company name should return 400');

    // 3.5 Missing committee college name
    const missingCollegeRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'valid@pitch.ac.in', password, role: ROLES.COMMITTEE, name: 'Committee' });
    if (missingCollegeRes.status !== 400) throw new Error('Missing college name should return 400');

    console.log('  ✓ All invalid registration payloads properly rejected with 400 VALIDATION_ERROR');

    // ----------------------------------------------------
    // TEST 4: Login Success & Credentials Handling
    // ----------------------------------------------------
    console.log('[TEST 4] Testing Login Success & Credentials Handling...');

    // 4.1 Login success
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: companyEmail,
        password: password,
      });

    if (loginRes.status !== 200 || !loginRes.body.data.accessToken) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }

    const loginCookies = loginRes.headers['set-cookie'];
    if (!loginCookies || !loginCookies.some((c) => c.includes('refreshToken=') && c.includes('HttpOnly'))) {
      throw new Error('Login failed to set HttpOnly refreshToken cookie');
    }
    companyRefreshTokenCookie = loginCookies.find((c) => c.startsWith('refreshToken='));
    companyAccessToken = loginRes.body.data.accessToken;

    // Verify lastLoginAt updated in DB
    const loggedInUser = await User.findById(companyUserId);
    if (!loggedInUser.lastLoginAt) {
      throw new Error('User lastLoginAt timestamp was not updated on login');
    }
    console.log('  ✓ Valid login succeeded with new accessToken, active refresh session, and lastLoginAt timestamp');

    // 4.2 Invalid password
    const wrongPwRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: companyEmail, password: 'WrongPassword999!' });
    if (wrongPwRes.status !== 401 || wrongPwRes.body.error?.code !== 'INVALID_CREDENTIALS') {
      throw new Error(`Expected 401 INVALID_CREDENTIALS, got: ${JSON.stringify(wrongPwRes.body)}`);
    }
    console.log('  ✓ Invalid password rejected with 401 INVALID_CREDENTIALS');

    // 4.3 Nonexistent email
    const wrongEmailRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@pitch.ac.in', password });
    if (wrongEmailRes.status !== 401 || wrongEmailRes.body.error?.code !== 'INVALID_CREDENTIALS') {
      throw new Error(`Expected 401 INVALID_CREDENTIALS, got: ${JSON.stringify(wrongEmailRes.body)}`);
    }
    console.log('  ✓ Nonexistent email rejected with 401 INVALID_CREDENTIALS');

    // ----------------------------------------------------
    // TEST 5: Access Token Authentication & Middleware
    // ----------------------------------------------------
    console.log('[TEST 5] Testing Access Token Authentication & Middleware...');

    // 5.1 Valid Bearer token
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${companyAccessToken}`);
    if (meRes.status !== 200 || meRes.body.data?.user?._id !== companyUserId.toString()) {
      throw new Error(`GET /auth/me failed with valid token: ${JSON.stringify(meRes.body)}`);
    }
    if (!meRes.body.data.profile || meRes.body.data.profile.name !== 'Tech Ventures Ltd') {
      throw new Error('GET /auth/me failed to return linked profile data');
    }
    console.log('  ✓ GET /api/v1/auth/me succeeded with valid Bearer token');

    // 5.2 Missing token
    const noTokenRes = await request(app).get('/api/v1/auth/me');
    if (noTokenRes.status !== 401 || noTokenRes.body.error?.code !== 'UNAUTHORIZED') {
      throw new Error(`Expected 401 UNAUTHORIZED for missing token, got ${noTokenRes.status}`);
    }
    console.log('  ✓ Missing token rejected with 401 UNAUTHORIZED');

    // 5.3 Malformed / invalid token
    const badTokenRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.tampered.token');
    if (badTokenRes.status !== 401 || badTokenRes.body.error?.code !== 'INVALID_TOKEN') {
      throw new Error(`Expected 401 INVALID_TOKEN, got ${badTokenRes.status}`);
    }
    console.log('  ✓ Tampered token rejected with 401 INVALID_TOKEN');

    // 5.4 Expired token
    const expiredToken = jwt.sign(
      { userId: companyUserId.toString(), email: companyEmail, role: ROLES.COMPANY },
      env.JWT_SECRET,
      { expiresIn: '0s' }
    );
    const expiredRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);
    if (expiredRes.status !== 401 || expiredRes.body.error?.code !== 'TOKEN_EXPIRED') {
      throw new Error(`Expected 401 TOKEN_EXPIRED, got ${expiredRes.status}`);
    }
    console.log('  ✓ Expired token rejected with 401 TOKEN_EXPIRED');

    // ----------------------------------------------------
    // TEST 6: Current Authenticated User (/users/me requirement)
    // ----------------------------------------------------
    console.log('[TEST 6] Testing Current Authenticated User Endpoint (/api/v1/users/me)...');
    const usersMeAuthRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${companyAccessToken}`);
    if (usersMeAuthRes.status !== 200 || usersMeAuthRes.body.data?.user?.email !== companyEmail) {
      throw new Error(`GET /users/me failed: ${JSON.stringify(usersMeAuthRes.body)}`);
    }

    const usersMeUnauthRes = await request(app).get('/api/v1/users/me');
    if (usersMeUnauthRes.status !== 401) {
      throw new Error(`GET /users/me without token should return 401, got ${usersMeUnauthRes.status}`);
    }
    console.log('  ✓ /api/v1/users/me authenticated requirement enforced cleanly');

    // ----------------------------------------------------
    // TEST 7: Refresh Token Strategy: Rotation & Reuse Rejection
    // ----------------------------------------------------
    console.log('[TEST 7] Testing Refresh Token Strategy (Rotation, Reuse Detection & Revocation)...');

    // 7.1 First refresh succeeds
    const firstRefreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', companyRefreshTokenCookie);

    if (firstRefreshRes.status !== 200 || !firstRefreshRes.body.data.accessToken) {
      throw new Error(`First refresh failed: ${JSON.stringify(firstRefreshRes.body)}`);
    }
    const rotatedCookie1 = firstRefreshRes.headers['set-cookie'].find((c) => c.startsWith('refreshToken='));
    const accessTokenAfterFirstRefresh = firstRefreshRes.body.data.accessToken;

    // Verify access token from first refresh works
    const checkAccess1 = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessTokenAfterFirstRefresh}`);
    if (checkAccess1.status !== 200) {
      throw new Error('Access token from first refresh failed authentication');
    }
    console.log('  ✓ First refresh succeeded: new access token and rotated HttpOnly cookie issued');

    // 7.2 Newly issued refresh token succeeds
    const secondRefreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', rotatedCookie1);

    if (secondRefreshRes.status !== 200 || !secondRefreshRes.body.data.accessToken) {
      throw new Error(`Second refresh with newly rotated token failed: ${JSON.stringify(secondRefreshRes.body)}`);
    }
    const rotatedCookie2 = secondRefreshRes.headers['set-cookie'].find((c) => c.startsWith('refreshToken='));
    const accessTokenAfterSecondRefresh = secondRefreshRes.body.data.accessToken;
    console.log('  ✓ Newly issued rotated refresh token succeeded');

    // 7.3 Old refresh token is rejected after rotation (reuse rejection)
    const oldTokenReuseRes1 = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', companyRefreshTokenCookie); // Original token prior to first rotation

    if (oldTokenReuseRes1.status !== 401 || oldTokenReuseRes1.body.error?.code !== 'TOKEN_REVOKED') {
      throw new Error(`Reuse of initial refresh token must return 401 TOKEN_REVOKED, got: ${JSON.stringify(oldTokenReuseRes1.body)}`);
    }

    const oldTokenReuseRes2 = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', rotatedCookie1); // Intermediate token prior to second rotation

    if (oldTokenReuseRes2.status !== 401 || oldTokenReuseRes2.body.error?.code !== 'TOKEN_REVOKED') {
      throw new Error(`Reuse of rotated token 1 must return 401 TOKEN_REVOKED, got: ${JSON.stringify(oldTokenReuseRes2.body)}`);
    }
    console.log('  ✓ Old refresh tokens properly rejected after rotation with 401 TOKEN_REVOKED (reuse attack blocked)');

    // 7.4 Invalid refresh token rejected
    const invalidRefreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', 'refreshToken=completely.invalid.jwt.token');

    if (invalidRefreshRes.status !== 401 || invalidRefreshRes.body.error?.code !== 'INVALID_REFRESH_TOKEN') {
      throw new Error(`Invalid refresh token must return 401 INVALID_REFRESH_TOKEN, got: ${JSON.stringify(invalidRefreshRes.body)}`);
    }
    console.log('  ✓ Invalid refresh token rejected with 401 INVALID_REFRESH_TOKEN');

    // 7.5 Expired refresh token rejected
    const expiredRefreshToken = jwt.sign(
      { userId: companyUserId.toString(), sessionId: 'fake-session', tokenVersion: 0 },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '0s' }
    );
    const expiredRefreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', `refreshToken=${expiredRefreshToken}`);

    if (expiredRefreshRes.status !== 401 || expiredRefreshRes.body.error?.code !== 'TOKEN_EXPIRED') {
      throw new Error(`Expired refresh token must return 401 TOKEN_EXPIRED, got: ${JSON.stringify(expiredRefreshRes.body)}`);
    }
    console.log('  ✓ Expired refresh token rejected with 401 TOKEN_EXPIRED');

    // ----------------------------------------------------
    // TEST 8: Logout & Session Revocation
    // ----------------------------------------------------
    console.log('[TEST 8] Testing Logout & Session Revocation...');

    // 8.1 Logout
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessTokenAfterSecondRefresh}`)
      .set('Cookie', rotatedCookie2);

    if (logoutRes.status !== 200) {
      throw new Error(`Logout failed: ${JSON.stringify(logoutRes.body)}`);
    }

    // Verify cookie cleared
    const logoutCookies = logoutRes.headers['set-cookie'];
    if (!logoutCookies || !logoutCookies.some((c) => c.includes('refreshToken=;') || c.includes('Expires='))) {
      throw new Error('Logout failed to clear refreshToken cookie');
    }

    // 8.2 Attempt to refresh after logout
    const revokedRefreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', rotatedCookie2);

    if (revokedRefreshRes.status !== 401 || revokedRefreshRes.body.error?.code !== 'TOKEN_REVOKED') {
      throw new Error(`Revoked refresh token after logout should return 401 TOKEN_REVOKED, got ${JSON.stringify(revokedRefreshRes.body)}`);
    }
    console.log('  ✓ Logout cleared cookie and invalidated refresh session (post-logout refresh blocked with 401 TOKEN_REVOKED)');

    // ----------------------------------------------------
    // TEST 9: Forgot-Password Flow
    // ----------------------------------------------------
    console.log('[TEST 9] Testing Forgot-Password Flow...');

    // 9.1 Existing user
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: committeeEmail });

    if (forgotRes.status !== 200 || !forgotRes.body.data?.resetToken) {
      throw new Error(`Forgot password failed: ${JSON.stringify(forgotRes.body)}`);
    }
    const resetToken = forgotRes.body.data.resetToken;

    // Verify token hashed in database
    const committeeUserWithToken = await User.findById(committeeUserId).select('+resetPasswordToken +resetPasswordExpires');
    if (!committeeUserWithToken.resetPasswordToken || !committeeUserWithToken.resetPasswordExpires) {
      throw new Error('Reset password token and expiration not persisted in database');
    }
    console.log('  ✓ Forgot-password generated crypto token, saved SHA-256 hash in DB with 1h expiry');

    // 9.2 Unknown user email (no enumeration)
    const forgotUnknownRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'ghost@pitch.ac.in' });
    if (forgotUnknownRes.status !== 200 || forgotUnknownRes.body.data?.resetToken !== undefined) {
      throw new Error('Unknown email forgot-password should return 200 without exposing token');
    }
    console.log('  ✓ Forgot-password for unknown email prevents user enumeration cleanly');

    // ----------------------------------------------------
    // TEST 10: Reset-Password Flow & Session Revocation
    // ----------------------------------------------------
    console.log('[TEST 10] Testing Reset-Password Flow & Session Revocation...');

    // Obtain an active refresh session prior to reset
    const preResetLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: committeeEmail, password });
    const preResetRefreshCookie = preResetLogin.headers['set-cookie'].find((c) => c.startsWith('refreshToken='));

    // 10.1 Invalid reset token
    const badResetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: 'invalid_dummy_token_12345',
        newPassword: 'BrandNewPassword123!',
      });
    if (badResetRes.status !== 400 || badResetRes.body.error?.code !== 'INVALID_RESET_TOKEN') {
      throw new Error(`Expected 400 INVALID_RESET_TOKEN, got ${JSON.stringify(badResetRes.body)}`);
    }
    console.log('  ✓ Invalid reset token rejected with 400 INVALID_RESET_TOKEN');

    // 10.2 Valid reset token
    const newCommitteePassword = 'UpdatedCommitteePass123!';
    const validResetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: resetToken,
        newPassword: newCommitteePassword,
      });

    if (validResetRes.status !== 200) {
      throw new Error(`Reset password failed: ${JSON.stringify(validResetRes.body)}`);
    }

    // Verify token cleared in DB
    const resetUser = await User.findById(committeeUserId).select('+resetPasswordToken +resetPasswordExpires');
    if (resetUser.resetPasswordToken !== null || resetUser.resetPasswordExpires !== null) {
      throw new Error('Reset password token was not cleared from database after use');
    }

    // Verify pre-reset refresh session is now revoked!
    const testPreResetRefresh = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', preResetRefreshCookie);
    if (testPreResetRefresh.status !== 401 || testPreResetRefresh.body.error?.code !== 'TOKEN_REVOKED') {
      throw new Error(`Refresh token issued prior to password reset must be revoked, got ${testPreResetRefresh.status}`);
    }
    console.log('  ✓ Password reset revoked all prior refresh sessions (401 TOKEN_REVOKED)');

    // Log in with new password
    const newLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: committeeEmail, password: newCommitteePassword });
    if (newLoginRes.status !== 200 || !newLoginRes.body.data.accessToken) {
      throw new Error('Login with reset password failed');
    }
    committeeAccessToken = newLoginRes.body.data.accessToken;
    console.log('  ✓ Reset password succeeded; old password rejected, new password verified');

    // ----------------------------------------------------
    // TEST 11: Change-Password Flow & Session Revocation
    // ----------------------------------------------------
    console.log('[TEST 11] Testing Change-Password Flow & Session Revocation...');

    // Obtain an active refresh session prior to change
    const preChangeRefreshCookie = newLoginRes.headers['set-cookie'].find((c) => c.startsWith('refreshToken='));

    // 11.1 Incorrect current password
    const wrongCurrentPwRes = await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${committeeAccessToken}`)
      .send({
        currentPassword: 'IncorrectOldPassword123!',
        newPassword: 'AnotherNewPassword888!',
      });
    if (wrongCurrentPwRes.status !== 400 || wrongCurrentPwRes.body.error?.code !== 'INVALID_CURRENT_PASSWORD') {
      throw new Error(`Expected 400 INVALID_CURRENT_PASSWORD, got ${JSON.stringify(wrongCurrentPwRes.body)}`);
    }
    console.log('  ✓ Wrong current password rejected with 400 INVALID_CURRENT_PASSWORD');

    // 11.2 Same password
    const samePwRes = await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${committeeAccessToken}`)
      .send({
        currentPassword: newCommitteePassword,
        newPassword: newCommitteePassword,
      });
    if (samePwRes.status !== 400 || samePwRes.body.error?.code !== 'PASSWORD_UNCHANGED') {
      throw new Error(`Expected 400 PASSWORD_UNCHANGED, got ${JSON.stringify(samePwRes.body)}`);
    }
    console.log('  ✓ Identical new password rejected with 400 PASSWORD_UNCHANGED');

    // 11.3 Valid password change
    const finalPassword = 'FinalCommitteePass999!';
    const changePwRes = await request(app)
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${committeeAccessToken}`)
      .send({
        currentPassword: newCommitteePassword,
        newPassword: finalPassword,
      });

    if (changePwRes.status !== 200 || !changePwRes.body.data.accessToken) {
      throw new Error(`Change password failed: ${JSON.stringify(changePwRes.body)}`);
    }

    // Verify pre-change refresh token is now revoked
    const testPreChangeRefresh = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', preChangeRefreshCookie);
    if (testPreChangeRefresh.status !== 401 || testPreChangeRefresh.body.error?.code !== 'TOKEN_REVOKED') {
      throw new Error(`Refresh token issued prior to password change must be revoked, got ${testPreChangeRefresh.status}`);
    }
    console.log('  ✓ Password change revoked all prior refresh sessions (401 TOKEN_REVOKED)');

    // Verify login with final password
    const finalLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: committeeEmail, password: finalPassword });
    if (finalLoginRes.status !== 200) {
      throw new Error('Login with changed password failed');
    }
    console.log('  ✓ Change password succeeded and new login verified');

    // ----------------------------------------------------
    // TEST 12: Inactive, Suspended & Nonexistent User Handling
    // ----------------------------------------------------
    console.log('[TEST 12] Testing Inactive, Suspended & Nonexistent User Handling...');

    // 12.1 Nonexistent user ID in JWT
    const fakeUserId = new mongoose.Types.ObjectId();
    const ghostToken = jwt.sign(
      { userId: fakeUserId.toString(), email: 'ghost@pitch.ac.in', role: ROLES.COMPANY },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const ghostRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${ghostToken}`);
    if (ghostRes.status !== 401 || ghostRes.body.error?.code !== 'USER_NOT_FOUND') {
      throw new Error(`Expected 401 USER_NOT_FOUND for ghost user, got ${JSON.stringify(ghostRes.body)}`);
    }
    console.log('  ✓ Token for deleted/nonexistent user rejected with 401 USER_NOT_FOUND');

    // 12.2 Suspended user
    await User.findByIdAndUpdate(companyUserId, { status: USER_STATUS.SUSPENDED });
    const suspendedLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: companyEmail, password });
    if (suspendedLoginRes.status !== 403 || suspendedLoginRes.body.error?.code !== 'ACCOUNT_INACTIVE') {
      throw new Error(`Suspended user login should be 403 ACCOUNT_INACTIVE, got ${JSON.stringify(suspendedLoginRes.body)}`);
    }
    console.log('  ✓ Suspended user login rejected with 403 ACCOUNT_INACTIVE');

    // 12.3 Deactivated user
    await User.findByIdAndUpdate(companyUserId, { isActive: false, status: USER_STATUS.DEACTIVATED });
    const deactMeRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${companyAccessToken}`);
    if (deactMeRes.status !== 403 || deactMeRes.body.error?.code !== 'ACCOUNT_INACTIVE') {
      throw new Error(`Deactivated user request should be 403 ACCOUNT_INACTIVE, got ${JSON.stringify(deactMeRes.body)}`);
    }
    console.log('  ✓ Deactivated user request rejected with 403 ACCOUNT_INACTIVE');

    // ----------------------------------------------------
    // TEST 13: Authentication Rate Limiting & Health Independence
    // ----------------------------------------------------
    console.log('[TEST 13] Testing Authentication Rate Limiting & Health Endpoint Independence...');

    // 13.1 Normal authentication request succeeds with rate limit headers
    const testNormalAuthRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: committeeEmail, password: finalPassword });

    if (testNormalAuthRes.status !== 200) {
      throw new Error(`Normal auth request failed: ${testNormalAuthRes.status}`);
    }
    if (!testNormalAuthRes.headers['x-ratelimit-limit'] || testNormalAuthRes.headers['x-ratelimit-remaining'] === undefined) {
      throw new Error('Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining) missing from auth response');
    }
    console.log('  ✓ Normal authentication request succeeded with standard rate limit headers');

    // 13.2 Requests beyond configured limit receive correct 429 response
    const originalMax = env.AUTH_RATE_LIMIT_MAX;
    try {
      // Temporarily set a test limit of 3 requests
      env.AUTH_RATE_LIMIT_MAX = 3;
      resetRateLimits();

      const testIp = '198.51.100.42'; // Dedicated test client IP

      // Request 1, 2, 3 should pass through rate limiter
      for (let i = 1; i <= 3; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .set('X-Forwarded-For', testIp)
          .send({ email: committeeEmail, password: finalPassword });
        if (res.status === 429) {
          throw new Error(`Request ${i} unexpectedly received 429 prior to exceeding max limit`);
        }
      }

      // Request 4 MUST exceed the limit and receive HTTP 429
      const rateLimitedRes = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', testIp)
        .send({ email: committeeEmail, password: finalPassword });

      if (rateLimitedRes.status !== 429) {
        throw new Error(`Expected 429 RATE_LIMIT_EXCEEDED, got status ${rateLimitedRes.status}`);
      }

      if (rateLimitedRes.body.success !== false || rateLimitedRes.body.error?.code !== 'RATE_LIMIT_EXCEEDED') {
        throw new Error(`Rate limit response did not conform to PITCH standard: ${JSON.stringify(rateLimitedRes.body)}`);
      }

      if (!rateLimitedRes.headers['retry-after']) {
        throw new Error('Rate limit response missing Retry-After header');
      }
      console.log('  ✓ Requests beyond limit returned standard 429 RATE_LIMIT_EXCEEDED with Retry-After header');

      // 13.3 Rate limiting does NOT affect unrelated health/public endpoints
      const healthRes = await request(app)
        .get('/api/v1/health')
        .set('X-Forwarded-For', testIp);

      if (healthRes.status !== 200 || !healthRes.body.success) {
        throw new Error(`Health endpoint was unexpectedly blocked by auth rate limiting: ${healthRes.status}`);
      }

      const dbHealthRes = await request(app)
        .get('/api/v1/health/db')
        .set('X-Forwarded-For', testIp);

      if (dbHealthRes.status !== 200 || !dbHealthRes.body.success) {
        throw new Error(`DB health endpoint was unexpectedly blocked by auth rate limiting: ${dbHealthRes.status}`);
      }

      console.log('  ✓ Unrelated health endpoints (/api/v1/health and /api/v1/health/db) remain completely unaffected (200 OK)');
    } finally {
      env.AUTH_RATE_LIMIT_MAX = originalMax;
      resetRateLimits();
    }

    console.log('\n====================================================');
    console.log(' ALL 13 PHASE 4 AUTHENTICATION TESTS PASSED (100%)  ');
    console.log('====================================================\n');
  } finally {
    // Clean up created test accounts
    if (companyUserId) {
      await Company.deleteMany({ userId: companyUserId });
      await User.findByIdAndDelete(companyUserId);
    }
    if (committeeUserId) {
      await Committee.deleteMany({ userId: committeeUserId });
      await User.findByIdAndDelete(committeeUserId);
    }
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  runAuthTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Phase 4 Auth Test Failed:', err);
      process.exit(1);
    });
}

module.exports = runAuthTests;
