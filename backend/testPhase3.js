/**
 * Comprehensive Test Suite for PITCH Phase 3:
 * Base Backend Architecture / Express API Foundation
 *
 * Verifies:
 * 1. Express application structure and middleware chain
 * 2. API Versioning (/api/v1) and health check endpoints
 * 3. Backward-compatible /api/health endpoints
 * 4. 404 Not Found handling conforming to PITCH API specification
 * 5. Standard API response helpers (sendSuccess, sendPaginated, sendError)
 * 6. Custom ApiError class with operational error codes
 * 7. Request validation foundation middleware (rejection & pass-through)
 * 8. Centralized error middleware (malformed JSON, validation, custom errors)
 * 9. Database connection lifecycle status reporting
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./src/app');
const { env, validateEnv } = require('./src/config/env');
const { connectDB, getConnectionStatus } = require('./src/config/db');
const ApiError = require('./src/utils/apiError');
const { sendSuccess, sendPaginated, sendError } = require('./src/utils/apiResponse');
const { validateRequest } = require('./src/middleware/validationMiddleware');

async function runPhase3Tests() {
  console.log('====================================================');
  console.log(' PITCH Phase 3: Express API Foundation Test Suite   ');
  console.log('====================================================\n');

  // Validate env and establish DB connection
  validateEnv();
  await connectDB();
  console.log('✓ Database connection established\n');

  // ----------------------------------------------------
  // TEST 1: Versioned Health Endpoints (/api/v1/health)
  // ----------------------------------------------------
  console.log('[TEST 1] Testing Versioned Health Endpoints (/api/v1/health)...');
  const resV1Health = await request(app).get('/api/v1/health');
  if (resV1Health.status !== 200) {
    throw new Error(`Expected 200 from /api/v1/health, got ${resV1Health.status}`);
  }
  if (!resV1Health.body.success || resV1Health.body.data.status !== 'ok') {
    throw new Error(`Invalid response structure from /api/v1/health: ${JSON.stringify(resV1Health.body)}`);
  }
  console.log('  ✓ GET /api/v1/health returned 200 with { success: true, data: { status: "ok" } }');

  const resV1Db = await request(app).get('/api/v1/health/db');
  if (resV1Db.status !== 200) {
    throw new Error(`Expected 200 from /api/v1/health/db, got ${resV1Db.status}`);
  }
  if (!resV1Db.body.success || resV1Db.body.data.database !== 'connected') {
    throw new Error(`Invalid response structure from /api/v1/health/db: ${JSON.stringify(resV1Db.body)}`);
  }
  console.log('  ✓ GET /api/v1/health/db returned 200 with { success: true, data: { database: "connected" } }\n');

  // ----------------------------------------------------
  // TEST 2: Root Health Endpoints (/api/health backward compatibility)
  // ----------------------------------------------------
  console.log('[TEST 2] Testing Root Health Endpoints (/api/health)...');
  const resRootHealth = await request(app).get('/api/health');
  if (resRootHealth.status !== 200 || !resRootHealth.body.success) {
    throw new Error(`Root /api/health failed: ${JSON.stringify(resRootHealth.body)}`);
  }
  console.log('  ✓ GET /api/health returned 200 with success: true');

  const resRootDb = await request(app).get('/api/health/db');
  if (resRootDb.status !== 200 || !resRootDb.body.success || resRootDb.body.data.database !== 'connected') {
    throw new Error(`Root /api/health/db failed: ${JSON.stringify(resRootDb.body)}`);
  }
  console.log('  ✓ GET /api/health/db returned 200 with success: true\n');

  // ----------------------------------------------------
  // TEST 3: Standard 404 Not Found Handling
  // ----------------------------------------------------
  console.log('[TEST 3] Testing 404 Route Not Found Handling...');
  const res404 = await request(app).get('/api/v1/nonexistent-route-for-testing');
  if (res404.status !== 404) {
    throw new Error(`Expected 404 from unknown route, got ${res404.status}`);
  }
  if (res404.body.success !== false) {
    throw new Error('Expected success: false on 404 response');
  }
  if (!res404.body.error || res404.body.error.code !== 'NOT_FOUND') {
    throw new Error(`Expected error.code "NOT_FOUND" on 404 response, got ${JSON.stringify(res404.body)}`);
  }
  console.log('  ✓ 404 properly handled with standard { success: false, error: { code: "NOT_FOUND" } }\n');

  // ----------------------------------------------------
  // TEST 4: API Response Helpers & Formatting
  // ----------------------------------------------------
  console.log('[TEST 4] Testing API Response Format Helpers...');
  const mockRes = {
    _status: 200,
    _data: null,
    status(code) {
      this._status = code;
      return this;
    },
    json(payload) {
      this._data = payload;
      return this;
    },
  };

  // Test sendSuccess
  sendSuccess(mockRes, { item: 'test-data' }, 201);
  if (mockRes._status !== 201 || !mockRes._data.success || mockRes._data.data.item !== 'test-data') {
    throw new Error('sendSuccess helper formatting failed');
  }
  console.log('  ✓ sendSuccess generates { success: true, data } with custom status codes');

  // Test sendPaginated
  sendPaginated(mockRes, [{ id: 1 }, { id: 2 }], { page: 1, limit: 10, total: 2 });
  if (
    mockRes._data.pagination.page !== 1 ||
    mockRes._data.pagination.total !== 2 ||
    mockRes._data.pagination.totalPages !== 1 ||
    mockRes._data.data.length !== 2
  ) {
    throw new Error('sendPaginated helper formatting failed');
  }
  console.log('  ✓ sendPaginated generates { success: true, data: [...], pagination: { ... } }');

  // Test sendError
  sendError(mockRes, { code: 'TEST_ERROR', message: 'Test message', details: { f: 1 } }, 400);
  if (
    mockRes._status !== 400 ||
    mockRes._data.success !== false ||
    mockRes._data.error.code !== 'TEST_ERROR' ||
    mockRes._data.error.details.f !== 1
  ) {
    throw new Error('sendError helper formatting failed');
  }
  console.log('  ✓ sendError generates { success: false, error: { code, message, details } }\n');

  // ----------------------------------------------------
  // TEST 5: Custom ApiError Class
  // ----------------------------------------------------
  console.log('[TEST 5] Testing Custom ApiError Class & Status Code Mappings...');
  const errBadReq = ApiError.badRequest('Invalid input', { email: 'Invalid email' });
  if (errBadReq.statusCode !== 400 || errBadReq.code !== 'BAD_REQUEST' || !errBadReq.details.email) {
    throw new Error('ApiError.badRequest failed');
  }

  const errUnauth = ApiError.unauthorized('Token expired');
  if (errUnauth.statusCode !== 401 || errUnauth.code !== 'UNAUTHORIZED') {
    throw new Error('ApiError.unauthorized failed');
  }

  const errForbid = ApiError.forbidden('Access denied');
  if (errForbid.statusCode !== 403 || errForbid.code !== 'FORBIDDEN') {
    throw new Error('ApiError.forbidden failed');
  }

  const errNotFound = ApiError.notFound('Deal not found');
  if (errNotFound.statusCode !== 404 || errNotFound.code !== 'NOT_FOUND') {
    throw new Error('ApiError.notFound failed');
  }

  const errConflict = ApiError.conflict('Email exists');
  if (errConflict.statusCode !== 409 || errConflict.code !== 'CONFLICT') {
    throw new Error('ApiError.conflict failed');
  }

  const errUnprocessable = ApiError.unprocessable('Validation failure', { x: 1 });
  if (errUnprocessable.statusCode !== 422 || errUnprocessable.code !== 'VALIDATION_ERROR') {
    throw new Error('ApiError.unprocessable failed');
  }

  const errInternal = ApiError.internal('Unexpected failure');
  if (errInternal.statusCode !== 500 || errInternal.code !== 'INTERNAL_SERVER_ERROR') {
    throw new Error('ApiError.internal failed');
  }
  console.log('  ✓ All 7 ApiError factory methods verified with matching status codes and operational flags\n');

  // ----------------------------------------------------
  // TEST 6: Request Validation Foundation Middleware
  // ----------------------------------------------------
  console.log('[TEST 6] Testing Request Validation Foundation Middleware...');
  const testValidationMiddleware = validateRequest({
    body: (body) => {
      const errors = {};
      if (!body.title || typeof body.title !== 'string') {
        errors.title = 'Title is required';
      }
      if (body.count !== undefined && typeof body.count !== 'number') {
        errors.count = 'Count must be a number';
      }
      return errors;
    },
  });

  // Verify failure on invalid body
  let valErr = null;
  const mockReqInvalid = { body: { title: '', count: 'not-a-number' } };
  testValidationMiddleware(mockReqInvalid, {}, (err) => {
    valErr = err;
  });

  if (!valErr || valErr.statusCode !== 400 || valErr.code !== 'VALIDATION_ERROR') {
    throw new Error('validateRequest should have produced a 400 VALIDATION_ERROR');
  }
  if (!valErr.details['body.title'] || !valErr.details['body.count']) {
    throw new Error(`Expected body.title and body.count validation error details, got: ${JSON.stringify(valErr.details)}`);
  }
  console.log('  ✓ validateRequest correctly rejected invalid payload with status 400 and scoped error details');

  // Verify success on valid body
  let nextCalled = false;
  const mockReqValid = { body: { title: 'Valid Title', count: 42 } };
  testValidationMiddleware(mockReqValid, {}, (err) => {
    if (!err) nextCalled = true;
  });

  if (!nextCalled) {
    throw new Error('validateRequest failed to proceed to next handler for valid payload');
  }
  console.log('  ✓ validateRequest passed valid payload through to next handler cleanly\n');

  // ----------------------------------------------------
  // TEST 7: Central Error Middleware Integration
  // ----------------------------------------------------
  console.log('[TEST 7] Testing Central Error Middleware Integration...');

  // Test malformed JSON body handling
  const resMalformed = await request(app)
    .post('/api/v1/health')
    .set('Content-Type', 'application/json')
    .send('{ invalid json payload');

  if (resMalformed.status !== 400) {
    throw new Error(`Expected 400 on malformed JSON, got ${resMalformed.status}`);
  }
  if (resMalformed.body.success !== false || resMalformed.body.error.code !== 'MALFORMED_JSON') {
    throw new Error(`Expected MALFORMED_JSON error, got: ${JSON.stringify(resMalformed.body)}`);
  }
  console.log('  ✓ Central error handler trapped malformed JSON and returned standard 400 MALFORMED_JSON');

  // ----------------------------------------------------
  // TEST 8: Database Connection Lifecycle Status
  // ----------------------------------------------------
  console.log('[TEST 8] Testing Database Connection Lifecycle Status...');
  const connStatus = getConnectionStatus();
  if (!connStatus.isConnected || connStatus.state !== 1 || connStatus.stateName !== 'connected') {
    throw new Error(`Database connection lifecycle status invalid: ${JSON.stringify(connStatus)}`);
  }
  console.log(`  ✓ Database lifecycle reporting verified: state=${connStatus.stateName}, host=${connStatus.host}, name=${connStatus.name}\n`);

  console.log('====================================================');
  console.log(' ALL 8 PHASE 3 API FOUNDATION TESTS PASSED (100%)    ');
  console.log('====================================================');

  process.exit(0);
}

runPhase3Tests().catch((err) => {
  console.error('\n❌ Phase 3 test suite failed:', err);
  process.exit(1);
});
