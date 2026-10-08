import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import request from '../backend/node_modules/supertest/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('--- RUNNING STAGE 7 INTEGRATION & FINAL QA CHECKS ---');
console.log('====================================================\n');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✔ ${message}`);
}

// ---------------------------------------------------------
// PART 1: FRONTEND SECURITY & CREDENTIAL AUDIT
// ---------------------------------------------------------
console.log('[SECTION 1] Security & In-Memory Token Storage Audit...');

function scanFilesRecursively(dir, filterExt = ['.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(scanFilesRecursively(fullPath, filterExt));
    } else if (filterExt.includes(path.extname(fullPath))) {
      results.push(fullPath);
    }
  }
  return results;
}

const frontendSrcFiles = scanFilesRecursively(path.join(__dirname, 'src'));

for (const file of frontendSrcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(__dirname, file);

  // Assert NO localStorage token storage
  assert(
    !content.includes("localStorage.setItem('token'") &&
    !content.includes('localStorage.setItem("token"') &&
    !content.includes("localStorage.setItem('accessToken'") &&
    !content.includes('localStorage.setItem("accessToken"') &&
    !content.includes("localStorage.setItem('refreshToken'") &&
    !content.includes('localStorage.setItem("refreshToken"'),
    `No token stored in localStorage in ${relPath}`
  );

  // Assert NO hardcoded passwords in production components
  assert(
    !content.includes('password = "password123"') &&
    !content.includes("password = 'password123'") &&
    !content.includes('PRIVATE_KEY') &&
    !content.includes('secret_key_'),
    `No hardcoded credentials found in ${relPath}`
  );
}

// ---------------------------------------------------------
// PART 2: BUSINESS RULE & CONSTANTS AUDIT
// ---------------------------------------------------------
console.log('\n[SECTION 2] Authoritative Business Rules Audit...');

const constantsPath = path.join(__dirname, 'src', 'utils', 'constants.js');
const constantsContent = fs.readFileSync(constantsPath, 'utf8');

// Roles
assert(constantsContent.includes("COMPANY: 'COMPANY'"), 'ROLES includes COMPANY');
assert(constantsContent.includes("COMMITTEE: 'COMMITTEE'"), 'ROLES includes COMMITTEE');
assert(constantsContent.includes("ADMIN: 'ADMIN'"), 'ROLES includes ADMIN');

const unauthorizedRoles = ['SUPER_ADMIN', 'MODERATOR', 'STAFF', 'MANAGER', 'VERIFIER'];
for (const r of unauthorizedRoles) {
  assert(!constantsContent.includes(`${r}:`), `No unauthorized role ${r} introduced`);
}

// Deal statuses & RESOLVED absence
const expectedDealStatuses = [
  'INTERESTED',
  'DISCUSSION',
  'NEGOTIATING',
  'PROPOSAL',
  'COUNTER_PROPOSAL',
  'AGREED',
  'MOU_DRAFT',
  'AWAITING_SIGNATURES',
  'PARTIALLY_SIGNED',
  'EXECUTED',
  'FULFILLMENT',
  'COMPLETED',
  'DECLINED',
  'CANCELLED',
  'DISPUTED',
  'EXPIRED',
];

for (const s of expectedDealStatuses) {
  assert(constantsContent.includes(`'${s}'`) || constantsContent.includes(`"${s}"`), `DEAL_STATUS includes ${s}`);
}

const dealStatusBlockMatch = constantsContent.match(/export const DEAL_STATUS = {([^}]+)}/s);
assert(dealStatusBlockMatch, 'DEAL_STATUS is defined');
assert(!dealStatusBlockMatch[1].includes('RESOLVED'), 'RESOLVED is NOT in DEAL_STATUS (per authoritative spec)');

// 11 Contribution Types
const expectedContributions = [
  'CASH',
  'PRODUCT',
  'FOOD',
  'BEVERAGE',
  'MERCHANDISE',
  'EQUIPMENT',
  'SERVICE',
  'VENUE',
  'TRANSPORTATION',
  'GIFT_HAMPER',
  'OTHER',
];
for (const c of expectedContributions) {
  assert(constantsContent.includes(`'${c}'`), `CONTRIBUTION_TYPES includes ${c}`);
}

// ---------------------------------------------------------
// PART 3: LIVE BACKEND & MONGODB INTEGRATION AUDIT
// ---------------------------------------------------------
console.log('\n[SECTION 3] Live Backend & MongoDB Integration Testing...');

// Dynamically import backend modules
const backendAppPath = path.join(rootDir, 'backend', 'src', 'app.js');
const backendDbPath = path.join(rootDir, 'backend', 'src', 'config', 'db.js');
const backendModelsPath = path.join(rootDir, 'backend', 'src', 'models', 'index.js');

const { default: app } = await import(pathToFileURL(backendAppPath).href);
const { connectDB, disconnectDB } = await import(pathToFileURL(backendDbPath).href);
const models = await import(pathToFileURL(backendModelsPath).href);

await connectDB();
assert(true, 'MongoDB database connection established');

// Health Check APIs
const healthRes = await request(app).get('/api/v1/health').expect(200);
assert(healthRes.body.data.status === 'ok', '/api/v1/health endpoint operational');

const dbHealthRes = await request(app).get('/api/v1/health/db').expect(200);
assert(dbHealthRes.body.data.database === 'connected', '/api/v1/health/db reports connected database');

// Public Marketplace Endpoints
const eventsRes = await request(app).get('/api/v1/events').expect(200);
assert(Array.isArray(eventsRes.body.data), '/api/v1/events returns array of listings');
assert(eventsRes.body.data.length > 0, 'Real cataloged campus events exist in database');
for (const ev of eventsRes.body.data) {
  assert(ev.status === 'PUBLISHED', `Event ${ev.title} is strictly in PUBLISHED status on public marketplace`);
}

const companiesRes = await request(app).get('/api/v1/companies').expect(200);
assert(companiesRes.body.data.length > 0, 'Real registered company profiles exist in database');

const committeesRes = await request(app).get('/api/v1/committees').expect(200);
assert(committeesRes.body.data.length > 0, 'Real campus committee profiles exist in database');

// ---------------------------------------------------------
// PART 4: MULTI-ROLE AUTHENTICATION & SESSION RESTORE
// ---------------------------------------------------------
console.log('\n[SECTION 4] Multi-Role Authentication & Session Restore...');

// Admin Login
const adminLoginRes = await request(app)
  .post('/api/v1/auth/login')
  .send({ email: 'admin@pitchdemo.com', password: 'DemoPassword123!' })
  .expect(200);
const adminToken = adminLoginRes.body.data.accessToken;
assert(adminLoginRes.body.data.user.role === 'ADMIN', 'Admin login authenticates with ADMIN role');
assert(typeof adminToken === 'string' && adminToken.length > 20, 'Admin login issues valid access token');

// Company Login
const companyLoginRes = await request(app)
  .post('/api/v1/auth/login')
  .send({ email: 'sponsor@techcorp.pitchdemo.com', password: 'DemoPassword123!' })
  .expect(200);
const companyToken = companyLoginRes.body.data.accessToken;
assert(companyLoginRes.body.data.user.role === 'COMPANY', 'Company login authenticates with COMPANY role');

// Committee Login
const committeeLoginRes = await request(app)
  .post('/api/v1/auth/login')
  .send({ email: 'convenor@ecell.pitchdemo.com', password: 'DemoPassword123!' })
  .expect(200);
const committeeToken = committeeLoginRes.body.data.accessToken;
assert(committeeLoginRes.body.data.user.role === 'COMMITTEE', 'Committee login authenticates with COMMITTEE role');

// Session Restoration (GET /api/v1/auth/me)
const meRes = await request(app)
  .get('/api/v1/auth/me')
  .set('Authorization', `Bearer ${companyToken}`)
  .expect(200);
assert(meRes.body.data.user.email === 'sponsor@techcorp.pitchdemo.com', 'Session restore (GET /auth/me) retrieves authentic user');
assert(meRes.body.data.profile !== undefined, 'Session restore includes attached organization profile');

// ---------------------------------------------------------
// PART 5: RBAC ROUTE PROTECTION
// ---------------------------------------------------------
console.log('\n[SECTION 5] RBAC Route Guard Enforcement...');

// Company blocked from admin
const companyAdminBlockRes = await request(app)
  .get('/api/v1/admin/analytics/overview')
  .set('Authorization', `Bearer ${companyToken}`)
  .expect(403);
assert(companyAdminBlockRes.body.error.code === 'FORBIDDEN', 'Company access to admin endpoints blocked with 403 FORBIDDEN');

// Committee blocked from admin
const commAdminBlockRes = await request(app)
  .get('/api/v1/admin/analytics/overview')
  .set('Authorization', `Bearer ${committeeToken}`)
  .expect(403);
assert(commAdminBlockRes.body.error.code === 'FORBIDDEN', 'Committee access to admin endpoints blocked with 403 FORBIDDEN');

// Admin granted access to admin
const adminAnalyticsRes = await request(app)
  .get('/api/v1/admin/analytics/overview')
  .set('Authorization', `Bearer ${adminToken}`)
  .expect(200);
assert(adminAnalyticsRes.body.data.users.total >= 5, 'Admin authorized to inspect platform overview analytics');

// ---------------------------------------------------------
// PART 6: COMPLETE DEAL, FULFILLMENT & REVIEW AUDIT
// ---------------------------------------------------------
console.log('\n[SECTION 6] Deal, Fulfillment & Review Lifecycle Audit...');

const companyDealsRes = await request(app)
  .get('/api/v1/deals')
  .set('Authorization', `Bearer ${companyToken}`)
  .expect(200);
assert(Array.isArray(companyDealsRes.body.data), 'Company deals list returned successfully');
assert(companyDealsRes.body.data.length > 0, 'Company deals exist in MongoDB');

// Locate completed deal
const completedDeal = companyDealsRes.body.data.find((d) => d.status === 'COMPLETED');
assert(completedDeal !== undefined, 'Seeded deal in COMPLETED status found in MongoDB');

// Inspect fulfillments on deal
const fulfillmentRes = await request(app)
  .get(`/api/v1/deals/${completedDeal._id}/fulfillment`)
  .set('Authorization', `Bearer ${companyToken}`)
  .expect(200);
assert(fulfillmentRes.body.data.fulfillments.length > 0, 'Deal fulfillment obligations loaded from MongoDB');
assert(fulfillmentRes.body.data.summary.completed > 0, 'Completed fulfillments summary verified');

// Inspect verified reviews on completed deal
const dealReviewsRes = await request(app)
  .get(`/api/v1/deals/${completedDeal._id}/reviews`)
  .set('Authorization', `Bearer ${companyToken}`)
  .expect(200);
assert(dealReviewsRes.body.data.length >= 2, 'Two-way verified reviews exist for completed deal');
assert(dealReviewsRes.body.data[0].rating === 5, 'Review rating recorded accurately');

// Disputed deal inspection
const disputedDeal = await models.Deal.findOne({ status: 'DISPUTED' });
assert(disputedDeal !== null, 'Disputed deal fixture verified in MongoDB');
const disputeRecord = await models.Dispute.findOne({ dealId: disputedDeal._id });
assert(disputeRecord !== null, 'Formal dispute ticket verified in MongoDB');

// ---------------------------------------------------------
// PART 7: AUDIT LOGS & SECRET REDACTION
// ---------------------------------------------------------
console.log('\n[SECTION 7] Administrative Audit Logs & Credential Redaction...');

const auditLogsRes = await request(app)
  .get('/api/v1/admin/audit-logs')
  .set('Authorization', `Bearer ${adminToken}`)
  .expect(200);

const logs = auditLogsRes.body.data.logs;
assert(Array.isArray(logs) && logs.length > 0, 'Admin audit logs retrieved from database');
for (const log of logs) {
  const metaStr = JSON.stringify(log.metadata || {});
  assert(!metaStr.includes('DemoPassword123!'), `Audit log ${log.action} contains no raw passwords`);
  assert(!metaStr.includes('Bearer '), `Audit log ${log.action} contains no bearer tokens`);
}

await disconnectDB();
assert(true, 'Database connection closed gracefully');

console.log('\n====================================================');
console.log('ALL STAGE 7 INTEGRATION & FINAL QA CHECKS PASSED!');
console.log('====================================================\n');
