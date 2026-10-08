/**
 * Comprehensive RBAC and Authorization Test Suite for PITCH Phase 5
 * Source of Truth: docs/PITCH_FINAL_BUILD_SPEC.md Section 35 & docs/PITCH_API_FINAL.md Section 3, 4, 20
 *
 * Verifies:
 * 1. Unauthenticated user can GET a public company profile.
 * 2. Unauthenticated user can GET a public committee profile.
 * 3. Company A can GET Company B's public profile.
 * 4. Committee A can GET Committee B's public profile.
 * 5. Company cannot PUT/PATCH another company's profile (403 FORBIDDEN).
 * 6. Committee cannot PUT/PATCH another committee's profile (403 FORBIDDEN).
 * 7. Company cannot modify committee profile (403 FORBIDDEN).
 * 8. Committee cannot modify company profile (403 FORBIDDEN).
 * 9. Admin can modify either resource (200 OK).
 * 10. Sensitive/private fields (phone, contact, legalName, userId) are NOT exposed through public profile responses.
 * 11. Event ownership resolved through event.committeeId relationship.
 * 12. Existing 401 vs 403 authorization behavior for protected mutation endpoints remains strict and unchanged.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { validateEnv } = require('./src/config/env');
const { User, Company, Committee, Event, AuditLog } = require('./src/models');
const { ROLES, USER_STATUS, EVENT_LOCATION_MODE, EVENT_STATUS } = require('./src/utils/constants');
const { generateAccessToken } = require('./src/utils/jwt');
const { hashPassword } = require('./src/utils/password');
const authorizationService = require('./src/services/authorizationService');

async function runAuthzTests() {
  console.log('====================================================');
  console.log(' PITCH Phase 5: RBAC & Authorization Test Suite     ');
  console.log('====================================================\n');

  validateEnv();
  await connectDB();
  console.log('✓ Database connection established\n');

  const timestamp = Date.now();
  const password = 'TestPassword123!';
  const hashedPassword = await hashPassword(password);

  // Entities to track for cleanup
  const createdUserIds = [];
  const createdCompanyIds = [];
  const createdCommitteeIds = [];
  const createdEventIds = [];

  try {
    console.log('[SETUP] Creating test users, profiles with sensitive fields, and resources...');

    // 1. Company User A
    const userCompanyA = await User.create({
      email: `company.a.${timestamp}@pitch.ac.in`,
      passwordHash: hashedPassword,
      role: ROLES.COMPANY,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    createdUserIds.push(userCompanyA._id);
    const companyA = await Company.create({
      userId: userCompanyA._id,
      name: 'Alpha Ventures Ltd',
      legalName: 'Alpha Ventures Private Limited Legal Entity',
      industry: 'Technology',
      website: 'https://alphaventures.example.com',
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      contact: { phone: '+919876543210' },
      socialLinks: { linkedin: 'https://linkedin.com/company/alpha' },
    });
    createdCompanyIds.push(companyA._id);
    const tokenCompanyA = generateAccessToken(userCompanyA);

    // 2. Company User B
    const userCompanyB = await User.create({
      email: `company.b.${timestamp}@pitch.ac.in`,
      passwordHash: hashedPassword,
      role: ROLES.COMPANY,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    createdUserIds.push(userCompanyB._id);
    const companyB = await Company.create({
      userId: userCompanyB._id,
      name: 'Beta Brands International',
      legalName: 'Beta Brands Global LLC',
      industry: 'FMCG',
      website: 'https://betabrands.example.com',
      location: { city: 'Delhi', state: 'Delhi', country: 'India' },
      contact: { phone: '+919876543222' },
      socialLinks: { linkedin: 'https://linkedin.com/company/beta' },
    });
    createdCompanyIds.push(companyB._id);
    const tokenCompanyB = generateAccessToken(userCompanyB);

    // 3. Committee User A
    const userCommitteeA = await User.create({
      email: `committee.a.${timestamp}@pitch.ac.in`,
      passwordHash: hashedPassword,
      role: ROLES.COMMITTEE,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    createdUserIds.push(userCommitteeA._id);
    const committeeA = await Committee.create({
      userId: userCommitteeA._id,
      name: 'TSEC ACM Chapter',
      college: {
        name: 'Thadomal Shahani Engineering College',
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      },
      committeeType: 'Technical',
      website: 'https://tsecacm.example.com',
      contact: { phone: '+919876543233' },
      socialLinks: { instagram: 'https://instagram.com/tsecacm' },
    });
    createdCommitteeIds.push(committeeA._id);
    const tokenCommitteeA = generateAccessToken(userCommitteeA);

    // 4. Committee User B
    const userCommitteeB = await User.create({
      email: `committee.b.${timestamp}@pitch.ac.in`,
      passwordHash: hashedPassword,
      role: ROLES.COMMITTEE,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    createdUserIds.push(userCommitteeB._id);
    const committeeB = await Committee.create({
      userId: userCommitteeB._id,
      name: 'IIT Bombay TechFest Committee',
      college: {
        name: 'Indian Institute of Technology Bombay',
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      },
      committeeType: 'Cultural',
      contact: { phone: '+919876543244' },
    });
    createdCommitteeIds.push(committeeB._id);
    const tokenCommitteeB = generateAccessToken(userCommitteeB);

    // 5. Admin User
    const userAdmin = await User.create({
      email: `admin.${timestamp}@pitch.ac.in`,
      passwordHash: hashedPassword,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    createdUserIds.push(userAdmin._id);
    const tokenAdmin = generateAccessToken(userAdmin);

    // 6. Event owned by Committee A
    const eventA = await Event.create({
      committeeId: committeeA._id,
      title: 'TSEC Hackathon 2027',
      slug: `tsec-hackathon-${timestamp}`,
      description: 'Annual inter-college coding festival',
      category: 'Technology',
      eventType: 'Hackathon',
      eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      location: {
        mode: EVENT_LOCATION_MODE.PHYSICAL,
        venue: 'Main Auditorium',
        city: 'Mumbai',
      },
      status: EVENT_STATUS.DRAFT,
      expectedAudience: { min: 500, max: 2000 },
      estimatedReach: 5000,
    });
    createdEventIds.push(eventA._id);

    console.log('  ✓ Test fixtures successfully created.\n');

    // ----------------------------------------------------
    // TEST 1: Unauthenticated Public Profile GET Access
    // ----------------------------------------------------
    console.log('[TEST 1] Testing Unauthenticated Public Profile GET Access...');

    // 1.1 Unauthenticated GET Company Profile
    const unauthCompRes = await request(app).get(`/api/v1/companies/${companyA._id}`);
    if (unauthCompRes.status !== 200 || !unauthCompRes.body.success) {
      throw new Error(`Unauthenticated company GET failed: ${JSON.stringify(unauthCompRes.body)}`);
    }
    if (unauthCompRes.body.data.company.name !== 'Alpha Ventures Ltd') {
      throw new Error(`Unexpected company name: ${unauthCompRes.body.data.company.name}`);
    }

    // 1.2 Unauthenticated GET Committee Profile
    const unauthCommRes = await request(app).get(`/api/v1/committees/${committeeA._id}`);
    if (unauthCommRes.status !== 200 || !unauthCommRes.body.success) {
      throw new Error(`Unauthenticated committee GET failed: ${JSON.stringify(unauthCommRes.body)}`);
    }
    if (unauthCommRes.body.data.committee.name !== 'TSEC ACM Chapter') {
      throw new Error(`Unexpected committee name: ${unauthCommRes.body.data.committee.name}`);
    }

    // 1.3 Unauthenticated GET Event
    const unauthEventRes = await request(app).get(`/api/v1/events/${eventA._id}`);
    if (unauthEventRes.status !== 200 || !unauthEventRes.body.success) {
      throw new Error(`Unauthenticated event GET failed: ${JSON.stringify(unauthEventRes.body)}`);
    }

    console.log('  ✓ Unauthenticated users can successfully GET public company, committee, and event profiles');

    // ----------------------------------------------------
    // TEST 2: Cross-Tenant Public Profile Discoverability
    // ----------------------------------------------------
    console.log('[TEST 2] Testing Cross-Tenant Public Profile Discoverability...');

    // 2.1 Company A GET Company B's public profile
    const compAToBRes = await request(app)
      .get(`/api/v1/companies/${companyB._id}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`);
    if (compAToBRes.status !== 200 || compAToBRes.body.data.company.name !== 'Beta Brands International') {
      throw new Error(`Company A could not view Company B's public profile: ${compAToBRes.status}`);
    }

    // 2.2 Committee A GET Committee B's public profile
    const commAToBRes = await request(app)
      .get(`/api/v1/committees/${committeeB._id}`)
      .set('Authorization', `Bearer ${tokenCommitteeA}`);
    if (commAToBRes.status !== 200 || commAToBRes.body.data.committee.name !== 'IIT Bombay TechFest Committee') {
      throw new Error(`Committee A could not view Committee B's public profile: ${commAToBRes.status}`);
    }

    // 2.3 Company A GET Committee A's public profile
    const compToCommRes = await request(app)
      .get(`/api/v1/committees/${committeeA._id}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`);
    if (compToCommRes.status !== 200 || compToCommRes.body.data.committee.name !== 'TSEC ACM Chapter') {
      throw new Error(`Company could not view Committee's public profile: ${compToCommRes.status}`);
    }

    // 2.4 Committee A GET Company A's public profile
    const commToCompRes = await request(app)
      .get(`/api/v1/companies/${companyA._id}`)
      .set('Authorization', `Bearer ${tokenCommitteeA}`);
    if (commToCompRes.status !== 200 || commToCompRes.body.data.company.name !== 'Alpha Ventures Ltd') {
      throw new Error(`Committee could not view Company's public profile: ${commToCompRes.status}`);
    }

    console.log('  ✓ Marketplace discoverability verified: Cross-tenant public profile reads allowed');

    // ----------------------------------------------------
    // TEST 3: Sensitive / Private Field Protection via Public DTO
    // ----------------------------------------------------
    console.log('[TEST 3] Verifying Sensitive / Private Field Protection via Public DTO...');

    // 3.1 Verify public Company profile does NOT expose sensitive fields
    const publicCompCheck = await request(app).get(`/api/v1/companies/${companyA._id}`);
    const pubCompData = publicCompCheck.body.data.company;
    if (pubCompData.contact !== undefined) {
      throw new Error('LEAK: Sensitive contact details exposed on public company profile!');
    }
    if (pubCompData.legalName !== undefined) {
      throw new Error('LEAK: Sensitive legalName exposed on public company profile!');
    }
    if (pubCompData.userId !== undefined) {
      throw new Error('LEAK: Internal userId exposed on public company profile!');
    }
    if (!pubCompData._id || !pubCompData.name || !pubCompData.industry) {
      throw new Error('Public fields missing from public company profile response');
    }

    // 3.2 Verify public Committee profile does NOT expose sensitive fields
    const publicCommCheck = await request(app).get(`/api/v1/committees/${committeeA._id}`);
    const pubCommData = publicCommCheck.body.data.committee;
    if (pubCommData.contact !== undefined) {
      throw new Error('LEAK: Sensitive contact details exposed on public committee profile!');
    }
    if (pubCommData.userId !== undefined) {
      throw new Error('LEAK: Internal userId exposed on public committee profile!');
    }
    if (!pubCommData._id || !pubCommData.name || !pubCommData.college) {
      throw new Error('Public fields missing from public committee profile response');
    }

    // 3.3 Verify private endpoint exposes full fields ONLY to owner / admin
    const privateCompOwnerRes = await request(app)
      .get(`/api/v1/companies/${companyA._id}/private`)
      .set('Authorization', `Bearer ${tokenCompanyA}`);
    if (privateCompOwnerRes.status !== 200 || !privateCompOwnerRes.body.data.company.legalName) {
      throw new Error('Owner failed to access full private company profile');
    }
    if (privateCompOwnerRes.body.data.company.contact?.phone !== '+919876543210') {
      throw new Error('Private contact phone not available on private company endpoint');
    }

    // 3.4 Verify non-owner cannot access private company endpoint (403 FORBIDDEN)
    const privateCompNonOwnerRes = await request(app)
      .get(`/api/v1/companies/${companyA._id}/private`)
      .set('Authorization', `Bearer ${tokenCompanyB}`);
    if (privateCompNonOwnerRes.status !== 403) {
      throw new Error(`Expected 403 on private company endpoint for non-owner, got ${privateCompNonOwnerRes.status}`);
    }

    // 3.5 Verify unauthenticated user cannot access private endpoint (401 UNAUTHORIZED)
    const privateCompUnauthRes = await request(app).get(`/api/v1/companies/${companyA._id}/private`);
    if (privateCompUnauthRes.status !== 401) {
      throw new Error(`Expected 401 on private company endpoint without auth, got ${privateCompUnauthRes.status}`);
    }

    console.log('  ✓ Public DTO strictly sanitizes sensitive fields (phone, legalName, userId, contact)');
    console.log('  ✓ Private management endpoint strictly protected (Owner/Admin only, 401/403 enforced)');

    // ----------------------------------------------------
    // TEST 4: Cross-Company Mutation Denial (PUT & PATCH)
    // ----------------------------------------------------
    console.log('[TEST 4] Testing Cross-Company Mutation Denial (PUT & PATCH)...');

    // 4.1 Company B attempts PATCH on Company A
    const crossCompPatch = await request(app)
      .patch(`/api/v1/companies/${companyA._id}`)
      .set('Authorization', `Bearer ${tokenCompanyB}`)
      .send({ name: 'Tampered by Company B' });
    if (crossCompPatch.status !== 403 || crossCompPatch.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN on cross-company PATCH, got ${crossCompPatch.status}`);
    }

    // 4.2 Company B attempts PUT on Company A
    const crossCompPut = await request(app)
      .put(`/api/v1/companies/${companyA._id}`)
      .set('Authorization', `Bearer ${tokenCompanyB}`)
      .send({ name: 'Tampered by Company B via PUT' });
    if (crossCompPut.status !== 403 || crossCompPut.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN on cross-company PUT, got ${crossCompPut.status}`);
    }

    // 4.3 Company A successfully updates own profile via PATCH
    const ownCompPatch = await request(app)
      .patch(`/api/v1/companies/${companyA._id}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ website: 'https://alpha-updated.example.com' });
    if (ownCompPatch.status !== 200 || ownCompPatch.body.data.company.website !== 'https://alpha-updated.example.com') {
      throw new Error('Owner failed to update own company profile');
    }

    console.log('  ✓ Cross-company PUT/PATCH blocked with 403 FORBIDDEN; Owner update succeeds');

    // ----------------------------------------------------
    // TEST 5: Cross-Committee Mutation Denial (PUT & PATCH)
    // ----------------------------------------------------
    console.log('[TEST 5] Testing Cross-Committee Mutation Denial (PUT & PATCH)...');

    // 5.1 Committee B attempts PATCH on Committee A
    const crossCommPatch = await request(app)
      .patch(`/api/v1/committees/${committeeA._id}`)
      .set('Authorization', `Bearer ${tokenCommitteeB}`)
      .send({ name: 'Tampered by Committee B' });
    if (crossCommPatch.status !== 403 || crossCommPatch.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN on cross-committee PATCH, got ${crossCommPatch.status}`);
    }

    // 5.2 Committee B attempts PUT on Committee A
    const crossCommPut = await request(app)
      .put(`/api/v1/committees/${committeeA._id}`)
      .set('Authorization', `Bearer ${tokenCommitteeB}`)
      .send({ name: 'Tampered by Committee B via PUT' });
    if (crossCommPut.status !== 403 || crossCommPut.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN on cross-committee PUT, got ${crossCommPut.status}`);
    }

    // 5.3 Committee A successfully updates own profile via PATCH
    const ownCommPatch = await request(app)
      .patch(`/api/v1/committees/${committeeA._id}`)
      .set('Authorization', `Bearer ${tokenCommitteeA}`)
      .send({ description: 'Updated TSEC ACM Chapter Description' });
    if (ownCommPatch.status !== 200 || !ownCommPatch.body.data.committee.description.includes('Updated')) {
      throw new Error('Owner failed to update own committee profile');
    }

    console.log('  ✓ Cross-committee PUT/PATCH blocked with 403 FORBIDDEN; Owner update succeeds');

    // ----------------------------------------------------
    // TEST 6: Role Cross-Boundary Mutation Denial
    // ----------------------------------------------------
    console.log('[TEST 6] Testing Role Cross-Boundary Mutation Denial...');

    // 6.1 Company attempts to modify Committee profile
    const compModCommRes = await request(app)
      .patch(`/api/v1/committees/${committeeA._id}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ name: 'Company Takeover' });
    if (compModCommRes.status !== 403 || compModCommRes.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN for Company modifying Committee, got ${compModCommRes.status}`);
    }

    // 6.2 Committee attempts to modify Company profile
    const commModCompRes = await request(app)
      .patch(`/api/v1/companies/${companyA._id}`)
      .set('Authorization', `Bearer ${tokenCommitteeA}`)
      .send({ name: 'Committee Takeover' });
    if (commModCompRes.status !== 403 || commModCompRes.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN for Committee modifying Company, got ${commModCompRes.status}`);
    }

    console.log('  ✓ Cross-role mutations strictly blocked (Company cannot modify Committee; Committee cannot modify Company)');

    // ----------------------------------------------------
    // TEST 7: Admin Moderation Modification Overrides
    // ----------------------------------------------------
    console.log('[TEST 7] Testing Admin Moderation Modification Overrides...');

    // 7.1 Admin modifies Company profile
    const adminModComp = await request(app)
      .patch(`/api/v1/companies/${companyA._id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ description: 'Admin verified and moderated company' });
    if (adminModComp.status !== 200 || !adminModComp.body.data.company.description.includes('Admin verified')) {
      throw new Error(`Admin moderation on company failed: ${JSON.stringify(adminModComp.body)}`);
    }

    // 7.2 Admin modifies Committee profile
    const adminModComm = await request(app)
      .patch(`/api/v1/committees/${committeeA._id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ description: 'Admin verified and moderated committee' });
    if (adminModComm.status !== 200 || !adminModComm.body.data.committee.description.includes('Admin verified')) {
      throw new Error(`Admin moderation on committee failed: ${JSON.stringify(adminModComm.body)}`);
    }

    // 7.3 Admin modifies Event
    const adminModEvent = await request(app)
      .patch(`/api/v1/events/${eventA._id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ description: 'Admin verified and moderated event' });
    if (adminModEvent.status !== 200 || !adminModEvent.body.data.event.description.includes('Admin verified')) {
      throw new Error(`Admin moderation on event failed: ${JSON.stringify(adminModEvent.body)}`);
    }

    console.log('  ✓ Admin moderation overrides allowed across Company, Committee, and Event resources (200 OK)');

    // ----------------------------------------------------
    // TEST 8: Event Ownership Through Committee Relationship
    // ----------------------------------------------------
    console.log('[TEST 8] Testing Event Ownership Through Committee Relationship...');

    // 8.1 Committee A creates a new event (Allowed)
    const commCreateEventRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${tokenCommitteeA}`)
      .send({
        title: 'New Annual Hack 2027',
        description: 'New coding festival',
        category: 'Technology',
      });
    if (commCreateEventRes.status !== 201 || !commCreateEventRes.body.success) {
      throw new Error(`Committee event creation failed: ${JSON.stringify(commCreateEventRes.body)}`);
    }
    const createdEventId = commCreateEventRes.body.data.event._id;
    createdEventIds.push(createdEventId);

    // 8.2 Company tries to create event (Forbidden)
    const compCreateEventRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ title: 'Company Hackathon' });
    if (compCreateEventRes.status !== 403 || compCreateEventRes.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN for company creating event, got ${compCreateEventRes.status}`);
    }

    // 8.3 Committee A modifies own event (Allowed)
    const commModOwnEventRes = await request(app)
      .patch(`/api/v1/events/${eventA._id}`)
      .set('Authorization', `Bearer ${tokenCommitteeA}`)
      .send({ title: 'TSEC Hackathon 2027 — Updated' });
    if (commModOwnEventRes.status !== 200 || commModOwnEventRes.body.data.event.title !== 'TSEC Hackathon 2027 — Updated') {
      throw new Error('Committee failed to modify own event');
    }

    // 8.4 Committee B tries to modify Committee A's event (Forbidden)
    const commBHijackRes = await request(app)
      .patch(`/api/v1/events/${eventA._id}`)
      .set('Authorization', `Bearer ${tokenCommitteeB}`)
      .send({ title: 'Hijacked Event' });
    if (commBHijackRes.status !== 403 || commBHijackRes.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN for cross-committee event update, got ${commBHijackRes.status}`);
    }

    // 8.5 Company tries to modify Committee A's event (Forbidden)
    const compModEventRes = await request(app)
      .patch(`/api/v1/events/${eventA._id}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ title: 'Company Hijacked' });
    if (compModEventRes.status !== 403 || compModEventRes.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN for company modifying event, got ${compModEventRes.status}`);
    }

    // 8.6 Committee B tries to delete Committee A's event (Forbidden)
    const commBDeleteRes = await request(app)
      .delete(`/api/v1/events/${eventA._id}`)
      .set('Authorization', `Bearer ${tokenCommitteeB}`);
    if (commBDeleteRes.status !== 403 || commBDeleteRes.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN for non-owning committee deleting event, got ${commBDeleteRes.status}`);
    }

    // 8.7 Committee A deletes own event (Allowed)
    const commADeleteRes = await request(app)
      .delete(`/api/v1/events/${createdEventId}`)
      .set('Authorization', `Bearer ${tokenCommitteeA}`);
    if (commADeleteRes.status !== 200) {
      throw new Error(`Owner committee failed to delete event: ${JSON.stringify(commADeleteRes.body)}`);
    }

    console.log('  ✓ Event ownership rules verified: Committee creates/manages own events; cross-tenant updates/deletions blocked');

    // ----------------------------------------------------
    // TEST 9: Admin Route Protection Matrix
    // ----------------------------------------------------
    console.log('[TEST 9] Testing Admin Platform Route Protection Matrix...');

    // 9.1 Unauthenticated access to /admin/users -> 401
    const unauthAdmin = await request(app).get('/api/v1/admin/users');
    if (unauthAdmin.status !== 401 || unauthAdmin.body.error?.code !== 'UNAUTHORIZED') {
      throw new Error(`Expected 401 on unauthenticated admin access, got ${unauthAdmin.status}`);
    }

    // 9.2 Company access to /admin/users -> 403
    const companyAdmin = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${tokenCompanyA}`);
    if (companyAdmin.status !== 403 || companyAdmin.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 for company accessing admin routes, got ${companyAdmin.status}`);
    }

    // 9.3 Committee access to /admin/users -> 403
    const committeeAdmin = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${tokenCommitteeA}`);
    if (committeeAdmin.status !== 403 || committeeAdmin.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 for committee accessing admin routes, got ${committeeAdmin.status}`);
    }

    // 9.4 Admin access to /admin/users -> 200
    const adminGetUsers = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    if (adminGetUsers.status !== 200 || !adminGetUsers.body.data.users) {
      throw new Error(`Admin failed to access /admin/users: ${JSON.stringify(adminGetUsers.body)}`);
    }

    // 9.5 Admin updates user status -> 200
    const adminUpdateStatus = await request(app)
      .patch(`/api/v1/admin/users/${userCompanyB._id}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: USER_STATUS.PENDING });
    if (adminUpdateStatus.status !== 200 || adminUpdateStatus.body.data.user.status !== USER_STATUS.PENDING) {
      throw new Error('Admin failed to update user status');
    }

    // 9.6 Admin accesses audit logs -> 200
    const adminAuditLogs = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    if (adminAuditLogs.status !== 200 || !adminAuditLogs.body.data.logs) {
      throw new Error('Admin failed to access audit logs');
    }

    console.log('  ✓ Admin platform routes secured: Admin allowed, non-admins rejected with 403 FORBIDDEN');

    // ----------------------------------------------------
    // TEST 10: Invalid & Nonexistent Resource Handling (400 vs 404)
    // ----------------------------------------------------
    console.log('[TEST 10] Testing Invalid & Nonexistent Resource Handling...');

    // 10.1 Malformed MongoDB ID on company route -> 400 INVALID_ID
    const malformedIdRes = await request(app).get('/api/v1/companies/invalid-id-xyz');
    if (malformedIdRes.status !== 400 || malformedIdRes.body.error?.code !== 'INVALID_ID') {
      throw new Error(`Expected 400 INVALID_ID on malformed company ID, got ${malformedIdRes.status}`);
    }

    // 10.2 Nonexistent Company ID on public GET -> 404 COMPANY_NOT_FOUND
    const ghostCompId = new mongoose.Types.ObjectId();
    const ghostCompRes = await request(app).get(`/api/v1/companies/${ghostCompId}`);
    if (ghostCompRes.status !== 404 || ghostCompRes.body.error?.code !== 'COMPANY_NOT_FOUND') {
      throw new Error(`Expected 404 COMPANY_NOT_FOUND for ghost company, got ${ghostCompRes.status}`);
    }

    // 10.3 Nonexistent Company ID on PATCH -> 404 COMPANY_NOT_FOUND
    const ghostCompPatch = await request(app)
      .patch(`/api/v1/companies/${ghostCompId}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ name: 'Ghost' });
    if (ghostCompPatch.status !== 404 || ghostCompPatch.body.error?.code !== 'COMPANY_NOT_FOUND') {
      throw new Error(`Expected 404 COMPANY_NOT_FOUND on ghost PATCH, got ${ghostCompPatch.status}`);
    }

    // 10.4 Nonexistent Committee ID on public GET -> 404 COMMITTEE_NOT_FOUND
    const ghostCommId = new mongoose.Types.ObjectId();
    const ghostCommRes = await request(app).get(`/api/v1/committees/${ghostCommId}`);
    if (ghostCommRes.status !== 404 || ghostCommRes.body.error?.code !== 'COMMITTEE_NOT_FOUND') {
      throw new Error(`Expected 404 COMMITTEE_NOT_FOUND for ghost committee, got ${ghostCommRes.status}`);
    }

    // 10.5 Nonexistent Event ID on public GET -> 404 EVENT_NOT_FOUND
    const ghostEventId = new mongoose.Types.ObjectId();
    const ghostEventRes = await request(app).get(`/api/v1/events/${ghostEventId}`);
    if (ghostEventRes.status !== 404 || ghostEventRes.body.error?.code !== 'EVENT_NOT_FOUND') {
      throw new Error(`Expected 404 EVENT_NOT_FOUND for ghost event, got ${ghostEventRes.status}`);
    }

    console.log('  ✓ Malformed IDs return 400 INVALID_ID; Nonexistent entities return 404 NOT_FOUND');

    // ----------------------------------------------------
    // TEST 11: Strict 401 vs 403 Status Code Boundaries
    // ----------------------------------------------------
    console.log('[TEST 11] Testing Strict 401 vs 403 Status Code Boundaries...');

    // 11.1 Unauthenticated mutation attempt is ALWAYS 401 UNAUTHORIZED
    const boundaryUnauth = await request(app)
      .patch(`/api/v1/companies/${companyA._id}`)
      .send({ name: 'Unauth Tamper' });
    if (boundaryUnauth.status !== 401 || boundaryUnauth.body.error?.code !== 'UNAUTHORIZED') {
      throw new Error('Boundary failure: unauthenticated request must yield 401 UNAUTHORIZED');
    }

    // 11.2 Authenticated with wrong role is ALWAYS 403 FORBIDDEN
    const boundaryRole = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ title: 'Company Event Attempt' });
    if (boundaryRole.status !== 403 || boundaryRole.body.error?.code !== 'FORBIDDEN') {
      throw new Error('Boundary failure: authenticated user with wrong role must yield 403 FORBIDDEN');
    }

    // 11.3 Authenticated with wrong owner is ALWAYS 403 FORBIDDEN
    const boundaryOwner = await request(app)
      .patch(`/api/v1/companies/${companyA._id}`)
      .set('Authorization', `Bearer ${tokenCompanyB}`)
      .send({ name: 'Cross-Tenant Update' });
    if (boundaryOwner.status !== 403 || boundaryOwner.body.error?.code !== 'FORBIDDEN') {
      throw new Error('Boundary failure: authenticated user without ownership must yield 403 FORBIDDEN');
    }

    console.log('  ✓ 401 UNAUTHORIZED vs 403 FORBIDDEN boundaries verified with standard PITCH envelopes');

    // ----------------------------------------------------
    // TEST 12: Programmatic Authorization Service Assertions
    // ----------------------------------------------------
    console.log('[TEST 12] Testing Programmatic Authorization Service Assertions...');

    // 12.1 assertRole
    authorizationService.assertRole(userAdmin, ROLES.ADMIN);
    authorizationService.assertRole(userCompanyA, ROLES.COMPANY, ROLES.ADMIN);
    let roleAssertFailed = false;
    try {
      authorizationService.assertRole(userCompanyA, ROLES.COMMITTEE);
    } catch (err) {
      roleAssertFailed = true;
      if (err.statusCode !== 403 || err.code !== 'FORBIDDEN') {
        throw new Error('assertRole did not throw standard 403 ApiError');
      }
    }
    if (!roleAssertFailed) throw new Error('assertRole should have thrown for invalid role');

    // 12.2 canAccessCompany & verifyCompanyOwnership
    if (!authorizationService.canAccessCompany(userCompanyA, companyA)) {
      throw new Error('Owner should have access to own company');
    }
    if (authorizationService.canAccessCompany(userCompanyB, companyA)) {
      throw new Error('Company B should not have access to Company A');
    }
    if (!authorizationService.canAccessCompany(userAdmin, companyA)) {
      throw new Error('Admin should have moderation access to any company');
    }

    const verifyCompA = await authorizationService.verifyCompanyOwnership(userCompanyA._id, companyA._id);
    if (!verifyCompA.isOwner) throw new Error('verifyCompanyOwnership failed for owner');

    const verifyCompB = await authorizationService.verifyCompanyOwnership(userCompanyB._id, companyA._id);
    if (verifyCompB.isOwner) throw new Error('verifyCompanyOwnership incorrectly reported true for non-owner');

    // 12.3 canAccessCommittee & verifyCommitteeOwnership
    if (!authorizationService.canAccessCommittee(userCommitteeA, committeeA)) {
      throw new Error('Owner should have access to own committee');
    }
    if (authorizationService.canAccessCommittee(userCommitteeB, committeeA)) {
      throw new Error('Committee B should not have access to Committee A');
    }
    if (!authorizationService.canAccessCommittee(userAdmin, committeeA)) {
      throw new Error('Admin should have access to any committee');
    }

    const verifyCommA = await authorizationService.verifyCommitteeOwnership(userCommitteeA._id, committeeA._id);
    if (!verifyCommA.isOwner) throw new Error('verifyCommitteeOwnership failed for owner');

    const verifyCommB = await authorizationService.verifyCommitteeOwnership(userCommitteeB._id, committeeA._id);
    if (verifyCommB.isOwner) throw new Error('verifyCommitteeOwnership incorrectly reported true for non-owner');

    // 12.4 verifyEventOwnership
    const verifyEvtA = await authorizationService.verifyEventOwnership(userCommitteeA._id, eventA._id);
    if (!verifyEvtA.isOwner) throw new Error('verifyEventOwnership failed for owning committee');

    const verifyEvtB = await authorizationService.verifyEventOwnership(userCommitteeB._id, eventA._id);
    if (verifyEvtB.isOwner) throw new Error('verifyEventOwnership incorrectly reported true for non-owning committee');

    console.log('  ✓ Programmatic authorizationService assertions and verifications passed');

    console.log('\n====================================================');
    console.log(' ALL 12 PHASE 5 RBAC & AUTHORIZATION TESTS PASSED!  ');
    console.log('====================================================\n');
  } finally {
    // Teardown created test entities
    if (createdEventIds.length > 0) {
      await Event.deleteMany({ _id: { $in: createdEventIds } });
    }
    if (createdCompanyIds.length > 0) {
      await Company.deleteMany({ _id: { $in: createdCompanyIds } });
    }
    if (createdCommitteeIds.length > 0) {
      await Committee.deleteMany({ _id: { $in: createdCommitteeIds } });
    }
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  runAuthzTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Phase 5 Authorization Test Failed:', err);
      process.exit(1);
    });
}

module.exports = runAuthzTests;
