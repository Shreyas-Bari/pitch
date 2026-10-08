/**
 * Comprehensive Test Suite for PITCH Phase 6: Company & Committee Profiles
 * Source of Truth:
 * - docs/PITCH_FINAL_BUILD_SPEC.md (Sections 13, 14, 35, 49/Step 6 & 26)
 * - docs/PITCH_DATABASE_FINAL.md (Sections 5, 6, 7, 25)
 * - docs/PITCH_API_FINAL.md (Section 3)
 *
 * Verifies:
 * 1. Public Company Profile (sanitized DTO, no sensitive/legal/contact leaks)
 * 2. Public Committee Profile (sanitized DTO, no sensitive contact/internal leaks)
 * 3. Public Marketplace Lists (GET /companies, GET /committees with search, pagination, filtering)
 * 4. Owner Profile Retrieval (GET /companies/me, GET /committees/me, /:id/private with full private fields & completeness)
 * 5. Owner Profile Updates (PATCH & PUT on /me and /:id with dynamic completeness recalculation)
 * 6. Cross-Owner Mutation Denial (Company B cannot mutate Company A; Committee B cannot mutate Committee A)
 * 7. Cross-Role Boundary Denial (Company cannot modify Committee; Committee cannot modify Company; role-based /me barriers)
 * 8. Admin Moderation Overrides (Admin can view full private profiles and modify both Company and Committee resources)
 * 9. Protected Ownership & Whitelist Enforcement (Reject userId/_id/isProfileComplete modification & unsupported arbitrary fields)
 * 10. Comprehensive Input Validation Failures (Invalid URLs, phone numbers, locations, budget ranges, contribution types)
 * 11. Invalid & Nonexistent Resource Handling (Malformed ObjectIds -> 400 INVALID_ID, nonexistent -> 404 NOT_FOUND)
 * 12. Profile Completeness Lifecycle (Incomplete initially, transitions to complete when criteria met, transitions back if cleared)
 * 13. Self-Reported History CRUD & Strict Separation (Create, list, update, delete for Company & Committee, verificationStatus: SELF_REPORTED, public view, spoof prevention, cross-tenant denial)
 * 14. Media Reference Validation (Valid File IDs assigned, nonexistent file references rejected)
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { validateEnv } = require('./src/config/env');
const { User, Company, Committee, SelfReportedHistory, File } = require('./src/models');
const { ROLES, USER_STATUS, FILE_PROVIDER, FILE_RESOURCE_TYPE, FILE_PURPOSE, CONTRIBUTION_TYPES } = require('./src/utils/constants');
const { generateAccessToken } = require('./src/utils/jwt');
const { hashPassword } = require('./src/utils/password');

async function runPhase6Tests() {
  console.log('====================================================');
  console.log(' PITCH Phase 6: Company & Committee Profiles Suite ');
  console.log('====================================================\n');

  validateEnv();
  await connectDB();
  console.log('✓ Database connection established\n');

  const timestamp = Date.now();
  const password = 'TestPassword123!';
  const hashedPassword = await hashPassword(password);

  const cleanupUserIds = [];
  const cleanupCompanyIds = [];
  const cleanupCommitteeIds = [];
  const cleanupFileIds = [];
  const cleanupHistoryIds = [];

  try {
    console.log('[SETUP] Creating test fixtures (Companies, Committees, Admin, and Files)...');

    // 1. Company A (Incomplete initially)
    const userCompanyA = await User.create({
      email: `company.a.${timestamp}@pitch.test`,
      passwordHash: hashedPassword,
      role: ROLES.COMPANY,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    cleanupUserIds.push(userCompanyA._id);

    const companyA = await Company.create({
      userId: userCompanyA._id,
      name: 'Nexus Tech Innovations',
      legalName: 'Nexus Tech Innovations Private Limited',
      description: 'Pioneering next-generation campus technology solutions',
      industry: 'Technology',
      website: 'https://nexustech.example.com',
      location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
      contact: { phone: '+919876501111', email: 'contact@nexustech.example.com' },
      socialLinks: {
        linkedin: 'https://linkedin.com/company/nexus-tech',
        instagram: 'nexus_tech_official',
        website: 'https://nexustech.example.com',
      },
      sponsorshipPreferences: {
        eventCategories: ['Technology', 'Hackathons'],
        preferredLocations: ['Bengaluru', 'Mumbai'],
        targetAudience: ['Engineering Students', 'Developers'],
        budgetMin: 50000,
        budgetMax: 200000,
        contributionTypes: ['CASH', 'MERCHANDISE'],
      },
      isProfileComplete: true,
    });
    cleanupCompanyIds.push(companyA._id);
    const tokenCompanyA = generateAccessToken(userCompanyA);

    // 2. Company B
    const userCompanyB = await User.create({
      email: `company.b.${timestamp}@pitch.test`,
      passwordHash: hashedPassword,
      role: ROLES.COMPANY,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    cleanupUserIds.push(userCompanyB._id);

    const companyB = await Company.create({
      userId: userCompanyB._id,
      name: 'Apex FMCG Brands',
      industry: 'FMCG',
      isProfileComplete: false,
    });
    cleanupCompanyIds.push(companyB._id);
    const tokenCompanyB = generateAccessToken(userCompanyB);

    // 3. Committee A
    const userCommitteeA = await User.create({
      email: `committee.a.${timestamp}@pitch.test`,
      passwordHash: hashedPassword,
      role: ROLES.COMMITTEE,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    cleanupUserIds.push(userCommitteeA._id);

    const committeeA = await Committee.create({
      userId: userCommitteeA._id,
      name: 'TSEC Entrepreneurship Cell',
      college: {
        name: 'Thadomal Shahani Engineering College',
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      },
      committeeType: 'Entrepreneurship',
      description: 'Fostering innovation, startups, and leadership among students',
      website: 'https://ecell.tsec.example.edu',
      contact: { phone: '+919876503333', email: 'ecell@tsec.example.edu' },
      socialLinks: {
        instagram: 'tsec_ecell',
        linkedin: 'https://linkedin.com/company/tsec-ecell',
        website: 'https://ecell.tsec.example.edu',
      },
      isProfileComplete: true,
    });
    cleanupCommitteeIds.push(committeeA._id);
    const tokenCommitteeA = generateAccessToken(userCommitteeA);

    // 4. Committee B
    const userCommitteeB = await User.create({
      email: `committee.b.${timestamp}@pitch.test`,
      passwordHash: hashedPassword,
      role: ROLES.COMMITTEE,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    cleanupUserIds.push(userCommitteeB._id);

    const committeeB = await Committee.create({
      userId: userCommitteeB._id,
      name: 'IIT Bombay TechFest Committee',
      college: {
        name: 'IIT Bombay',
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      },
      committeeType: 'Technical',
      description: 'Asia largest science and technology festival',
      contact: { phone: '+919876504444' },
      isProfileComplete: false,
    });
    cleanupCommitteeIds.push(committeeB._id);
    const tokenCommitteeB = generateAccessToken(userCommitteeB);

    // 5. Admin User
    const userAdmin = await User.create({
      email: `admin.${timestamp}@pitch.test`,
      passwordHash: hashedPassword,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    cleanupUserIds.push(userAdmin._id);
    const tokenAdmin = generateAccessToken(userAdmin);

    // 6. Media File Fixture
    const testFile = await File.create({
      ownerUserId: userCompanyA._id,
      provider: FILE_PROVIDER.CLOUDINARY,
      publicId: `profiles/logo-${timestamp}`,
      url: 'https://res.cloudinary.com/pitch/image/upload/v123456/logo.png',
      resourceType: FILE_RESOURCE_TYPE.IMAGE,
      purpose: FILE_PURPOSE.PROFILE_IMAGE,
    });
    cleanupFileIds.push(testFile._id);

    console.log('  ✓ Test fixtures successfully created.\n');

    // ----------------------------------------------------
    // TEST 1: Public Company Profile (GET /api/v1/companies/:id)
    // ----------------------------------------------------
    console.log('[TEST 1] Testing Public Company Profile DTO & Sanitization...');
    const pubCompRes = await request(app).get(`/api/v1/companies/${companyA._id}`);
    if (pubCompRes.status !== 200 || !pubCompRes.body.success) {
      throw new Error(`Public company GET failed: ${JSON.stringify(pubCompRes.body)}`);
    }

    const pubComp = pubCompRes.body.data.company;
    if (pubComp.name !== 'Nexus Tech Innovations') {
      throw new Error(`Unexpected name: ${pubComp.name}`);
    }
    if (pubComp.legalName !== undefined) {
      throw new Error('LEAK: Sensitive legalName exposed on public company profile!');
    }
    if (pubComp.contact !== undefined) {
      throw new Error('LEAK: Sensitive contact info exposed on public company profile!');
    }
    if (pubComp.userId !== undefined) {
      throw new Error('LEAK: Internal userId exposed on public company profile!');
    }
    if (pubComp.__v !== undefined) {
      throw new Error('LEAK: Internal __v exposed on public company profile!');
    }
    if (!pubComp._id || !pubComp.industry || !pubComp.location?.city) {
      throw new Error('Expected public fields missing from company DTO');
    }
    console.log('  ✓ Public company profile returns sanitized DTO with zero sensitive field leaks');

    // ----------------------------------------------------
    // TEST 2: Public Committee Profile (GET /api/v1/committees/:id)
    // ----------------------------------------------------
    console.log('[TEST 2] Testing Public Committee Profile DTO & Sanitization...');
    const pubCommRes = await request(app).get(`/api/v1/committees/${committeeA._id}`);
    if (pubCommRes.status !== 200 || !pubCommRes.body.success) {
      throw new Error(`Public committee GET failed: ${JSON.stringify(pubCommRes.body)}`);
    }

    const pubComm = pubCommRes.body.data.committee;
    if (pubComm.name !== 'TSEC Entrepreneurship Cell') {
      throw new Error(`Unexpected name: ${pubComm.name}`);
    }
    if (pubComm.contact !== undefined) {
      throw new Error('LEAK: Sensitive contact info exposed on public committee profile!');
    }
    if (pubComm.userId !== undefined) {
      throw new Error('LEAK: Internal userId exposed on public committee profile!');
    }
    if (!pubComm._id || !pubComm.college?.name || !pubComm.college?.location?.city) {
      throw new Error('Expected public fields missing from committee DTO');
    }
    console.log('  ✓ Public committee profile returns sanitized DTO with zero sensitive field leaks');

    // ----------------------------------------------------
    // TEST 3: Public Marketplace Listings with Search & Filters
    // ----------------------------------------------------
    console.log('[TEST 3] Testing Public Marketplace Listings (GET /companies, GET /committees)...');
    
    // 3.1 List companies with search
    const listCompRes = await request(app)
      .get('/api/v1/companies?search=Nexus&industry=Technology&page=1&limit=10');
    if (listCompRes.status !== 200 || !listCompRes.body.pagination) {
      throw new Error(`List companies failed: ${JSON.stringify(listCompRes.body)}`);
    }
    if (!Array.isArray(listCompRes.body.data) || listCompRes.body.data.length === 0) {
      throw new Error('List companies returned empty data array');
    }
    if (listCompRes.body.data[0].contact !== undefined) {
      throw new Error('LEAK: Contact exposed in company listing!');
    }

    // 3.2 List committees with filtering
    const listCommRes = await request(app)
      .get('/api/v1/committees?search=TSEC&city=Mumbai&page=1&limit=10');
    if (listCommRes.status !== 200 || !listCommRes.body.pagination) {
      throw new Error(`List committees failed: ${JSON.stringify(listCommRes.body)}`);
    }
    if (!Array.isArray(listCommRes.body.data) || listCommRes.body.data.length === 0) {
      throw new Error('List committees returned empty data array');
    }
    if (listCommRes.body.data[0].contact !== undefined) {
      throw new Error('LEAK: Contact exposed in committee listing!');
    }
    console.log('  ✓ Public marketplace listings return paginated, sanitized results with accurate filters');

    // ----------------------------------------------------
    // TEST 4: Private / Owner Profile Retrieval
    // ----------------------------------------------------
    console.log('[TEST 4] Testing Private / Owner Profile Retrieval (/me and /:id/private)...');
    
    // 4.1 Company owner GET /api/v1/companies/me
    const ownCompMeRes = await request(app)
      .get('/api/v1/companies/me')
      .set('Authorization', `Bearer ${tokenCompanyA}`);
    if (ownCompMeRes.status !== 200 || !ownCompMeRes.body.data.company) {
      throw new Error(`GET /companies/me failed: ${JSON.stringify(ownCompMeRes.body)}`);
    }
    if (ownCompMeRes.body.data.company.legalName !== 'Nexus Tech Innovations Private Limited') {
      throw new Error('Private legalName missing from /companies/me response');
    }
    if (ownCompMeRes.body.data.company.contact?.phone !== '+919876501111') {
      throw new Error('Private contact phone missing from /companies/me response');
    }
    if (!ownCompMeRes.body.data.completeness || typeof ownCompMeRes.body.data.completeness.score !== 'number') {
      throw new Error('Profile completeness metrics missing from /companies/me response');
    }

    // 4.2 Committee owner GET /api/v1/committees/me
    const ownCommMeRes = await request(app)
      .get('/api/v1/committees/me')
      .set('Authorization', `Bearer ${tokenCommitteeA}`);
    if (ownCommMeRes.status !== 200 || !ownCommMeRes.body.data.committee) {
      throw new Error(`GET /committees/me failed: ${JSON.stringify(ownCommMeRes.body)}`);
    }
    if (ownCommMeRes.body.data.committee.contact?.phone !== '+919876503333') {
      throw new Error('Private contact phone missing from /committees/me response');
    }
    if (!ownCommMeRes.body.data.completeness) {
      throw new Error('Completeness details missing from /committees/me response');
    }

    // 4.3 GET /:id/private endpoint for owner
    const privateCompRes = await request(app)
      .get(`/api/v1/companies/${companyA._id}/private`)
      .set('Authorization', `Bearer ${tokenCompanyA}`);
    if (privateCompRes.status !== 200 || !privateCompRes.body.data.company.legalName) {
      throw new Error('Owner failed to access /:id/private company endpoint');
    }

    console.log('  ✓ Owner profile retrieval endpoints (/me & /:id/private) supply full legal/contact details & completeness metrics');

    // ----------------------------------------------------
    // TEST 5: Owner Profile Updates (PATCH & PUT)
    // ----------------------------------------------------
    console.log('[TEST 5] Testing Owner Profile Updates (PATCH & PUT)...');
    
    // 5.1 Company owner updates profile via PATCH /companies/me
    const updateCompMeRes = await request(app)
      .patch('/api/v1/companies/me')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        description: 'Updated description for Nexus Tech Innovations',
        website: 'https://updated-nexus.example.com',
        location: { city: 'Bengaluru', state: 'Karnataka' },
        sponsorshipPreferences: {
          budgetMin: 75000,
          budgetMax: 250000,
          contributionTypes: ['CASH', 'PRODUCT', 'SERVICE'],
        },
      });
    if (updateCompMeRes.status !== 200 || updateCompMeRes.body.data.company.website !== 'https://updated-nexus.example.com') {
      throw new Error(`PATCH /companies/me failed: ${JSON.stringify(updateCompMeRes.body)}`);
    }

    // 5.2 Committee owner updates profile via PATCH /committees/me
    const updateCommMeRes = await request(app)
      .patch('/api/v1/committees/me')
      .set('Authorization', `Bearer ${tokenCommitteeA}`)
      .send({
        description: 'Updated committee description with extensive campus reach',
        website: 'https://new-ecell.tsec.example.edu',
        committeeType: 'Entrepreneurship & Innovation',
      });
    if (updateCommMeRes.status !== 200 || updateCommMeRes.body.data.committee.website !== 'https://new-ecell.tsec.example.edu') {
      throw new Error(`PATCH /committees/me failed: ${JSON.stringify(updateCommMeRes.body)}`);
    }

    // 5.3 Owner updates via PUT /:id
    const putCompRes = await request(app)
      .put(`/api/v1/companies/${companyA._id}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        name: 'Nexus Tech Innovations Global',
        description: 'Pioneering campus technology globally and locally',
      });
    if (putCompRes.status !== 200 || putCompRes.body.data.company.name !== 'Nexus Tech Innovations Global') {
      throw new Error(`PUT /companies/:id failed: ${JSON.stringify(putCompRes.body)}`);
    }

    console.log('  ✓ Owner profile updates (PATCH & PUT) successfully persisted to database');

    // ----------------------------------------------------
    // TEST 6: Cross-Owner Mutation Denial (403 FORBIDDEN)
    // ----------------------------------------------------
    console.log('[TEST 6] Testing Cross-Owner Mutation Denial...');
    
    // 6.1 Company B attempts to update Company A
    const crossCompPatch = await request(app)
      .patch(`/api/v1/companies/${companyA._id}`)
      .set('Authorization', `Bearer ${tokenCompanyB}`)
      .send({ name: 'Tampered by Company B' });
    if (crossCompPatch.status !== 403 || crossCompPatch.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN on cross-company mutation, got ${crossCompPatch.status}`);
    }

    // 6.2 Committee B attempts to update Committee A
    const crossCommPatch = await request(app)
      .patch(`/api/v1/committees/${committeeA._id}`)
      .set('Authorization', `Bearer ${tokenCommitteeB}`)
      .send({ name: 'Tampered by Committee B' });
    if (crossCommPatch.status !== 403 || crossCommPatch.body.error?.code !== 'FORBIDDEN') {
      throw new Error(`Expected 403 FORBIDDEN on cross-committee mutation, got ${crossCommPatch.status}`);
    }
    console.log('  ✓ Cross-owner profile mutations strictly rejected with 403 FORBIDDEN');

    // ----------------------------------------------------
    // TEST 7: Cross-Role Boundary Denial (403 FORBIDDEN)
    // ----------------------------------------------------
    console.log('[TEST 7] Testing Cross-Role Boundary Denial...');
    
    // 7.1 Company attempts to mutate Committee
    const compModComm = await request(app)
      .patch(`/api/v1/committees/${committeeA._id}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ name: 'Company Takeover' });
    if (compModComm.status !== 403) {
      throw new Error(`Expected 403 for Company modifying Committee, got ${compModComm.status}`);
    }

    // 7.2 Committee attempts to mutate Company
    const commModComp = await request(app)
      .patch(`/api/v1/companies/${companyA._id}`)
      .set('Authorization', `Bearer ${tokenCommitteeA}`)
      .send({ name: 'Committee Takeover' });
    if (commModComp.status !== 403) {
      throw new Error(`Expected 403 for Committee modifying Company, got ${commModComp.status}`);
    }

    // 7.3 Company attempts to access /committees/me
    const compAccessCommMe = await request(app)
      .get('/api/v1/committees/me')
      .set('Authorization', `Bearer ${tokenCompanyA}`);
    if (compAccessCommMe.status !== 403) {
      throw new Error(`Expected 403 for Company accessing /committees/me, got ${compAccessCommMe.status}`);
    }

    // 7.4 Committee attempts to access /companies/me
    const commAccessCompMe = await request(app)
      .get('/api/v1/companies/me')
      .set('Authorization', `Bearer ${tokenCommitteeA}`);
    if (commAccessCompMe.status !== 403) {
      throw new Error(`Expected 403 for Committee accessing /companies/me, got ${commAccessCompMe.status}`);
    }
    console.log('  ✓ Cross-role boundaries strictly enforced on resource endpoints and /me operations');

    // ----------------------------------------------------
    // TEST 8: Admin Moderation Overrides (200 OK)
    // ----------------------------------------------------
    console.log('[TEST 8] Testing Admin Moderation Overrides...');
    
    // 8.1 Admin views private Company profile
    const adminViewComp = await request(app)
      .get(`/api/v1/companies/${companyA._id}/private`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    if (adminViewComp.status !== 200 || !adminViewComp.body.data.company.legalName) {
      throw new Error('Admin failed to access private company profile');
    }

    // 8.2 Admin moderates Company
    const adminModComp = await request(app)
      .patch(`/api/v1/companies/${companyA._id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ description: 'Admin moderated company description' });
    if (adminModComp.status !== 200 || !adminModComp.body.data.company.description.includes('Admin moderated')) {
      throw new Error('Admin moderation on company failed');
    }

    // 8.3 Admin views private Committee profile
    const adminViewComm = await request(app)
      .get(`/api/v1/committees/${committeeA._id}/private`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    if (adminViewComm.status !== 200 || !adminViewComm.body.data.committee.contact) {
      throw new Error('Admin failed to access private committee profile');
    }

    // 8.4 Admin moderates Committee
    const adminModComm = await request(app)
      .patch(`/api/v1/committees/${committeeA._id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ description: 'Admin moderated committee description' });
    if (adminModComm.status !== 200 || !adminModComm.body.data.committee.description.includes('Admin moderated')) {
      throw new Error('Admin moderation on committee failed');
    }
    console.log('  ✓ Admin moderation overrides verified across Company and Committee private endpoints');

    // ----------------------------------------------------
    // TEST 9: Protected Fields & Ownership Defense
    // ----------------------------------------------------
    console.log('[TEST 9] Testing Protected Fields & Strict Whitelist Enforcement...');
    
    // 9.1 Attempt to change userId
    const newFakeUserId = new mongoose.Types.ObjectId();
    const hijackUserRes = await request(app)
      .patch('/api/v1/companies/me')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ userId: newFakeUserId });
    if (hijackUserRes.status !== 400 || hijackUserRes.body.error?.code !== 'VALIDATION_ERROR') {
      throw new Error(`Expected 400 VALIDATION_ERROR when tampering userId, got ${hijackUserRes.status}`);
    }

    // 9.2 Attempt to inject unsupported arbitrary fields
    const arbitraryRes = await request(app)
      .patch('/api/v1/companies/me')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ maliciousInjectedField: 'hackValue' });
    if (arbitraryRes.status !== 400 || arbitraryRes.body.error?.code !== 'VALIDATION_ERROR') {
      throw new Error(`Expected 400 VALIDATION_ERROR on unsupported field, got ${arbitraryRes.status}`);
    }

    // 9.3 Attempt to manually set isProfileComplete
    const spoofCompleteRes = await request(app)
      .patch('/api/v1/committees/me')
      .set('Authorization', `Bearer ${tokenCommitteeA}`)
      .send({ isProfileComplete: true });
    if (spoofCompleteRes.status !== 400 || spoofCompleteRes.body.error?.code !== 'VALIDATION_ERROR') {
      throw new Error(`Expected 400 VALIDATION_ERROR on tampering isProfileComplete, got ${spoofCompleteRes.status}`);
    }
    console.log('  ✓ Protection against tampering userId, isProfileComplete, and arbitrary fields verified');

    // ----------------------------------------------------
    // TEST 10: Validation Failure Scenarios
    // ----------------------------------------------------
    console.log('[TEST 10] Testing Input Validation Failures (URLs, Phone, Location, Budget)...');
    
    // 10.1 Invalid Website URL
    const badUrlRes = await request(app)
      .patch('/api/v1/companies/me')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ website: 'not-a-valid-url' });
    if (badUrlRes.status !== 400) {
      throw new Error(`Expected 400 for invalid URL, got ${badUrlRes.status}`);
    }

    // 10.2 Invalid Contact Phone
    const badPhoneRes = await request(app)
      .patch('/api/v1/companies/me')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ contact: { phone: '123' } });
    if (badPhoneRes.status !== 400) {
      throw new Error(`Expected 400 for short invalid phone, got ${badPhoneRes.status}`);
    }

    // 10.3 Invalid Budget Range (budgetMin > budgetMax)
    const badBudgetRes = await request(app)
      .patch('/api/v1/companies/me')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        sponsorshipPreferences: {
          budgetMin: 100000,
          budgetMax: 50000,
        },
      });
    if (badBudgetRes.status !== 400) {
      throw new Error(`Expected 400 for budgetMin > budgetMax, got ${badBudgetRes.status}`);
    }

    // 10.4 Invalid Contribution Type
    const badContribRes = await request(app)
      .patch('/api/v1/companies/me')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        sponsorshipPreferences: {
          contributionTypes: ['INVALID_CONTRIBUTION_KIND'],
        },
      });
    if (badContribRes.status !== 400) {
      throw new Error(`Expected 400 for invalid contribution type, got ${badContribRes.status}`);
    }
    console.log('  ✓ Validation failures accurately caught and reported with 400 VALIDATION_ERROR');

    // ----------------------------------------------------
    // TEST 11: Invalid & Nonexistent Resource Handling
    // ----------------------------------------------------
    console.log('[TEST 11] Testing Malformed & Nonexistent Resource Handling...');
    
    const malformedCompRes = await request(app).get('/api/v1/companies/invalid-mongo-id');
    if (malformedCompRes.status !== 400 || malformedCompRes.body.error?.code !== 'INVALID_ID') {
      throw new Error(`Expected 400 INVALID_ID, got ${malformedCompRes.status}`);
    }

    const nonexistentId = new mongoose.Types.ObjectId();
    const notFoundCompRes = await request(app).get(`/api/v1/companies/${nonexistentId}`);
    if (notFoundCompRes.status !== 404 || notFoundCompRes.body.error?.code !== 'COMPANY_NOT_FOUND') {
      throw new Error(`Expected 404 COMPANY_NOT_FOUND, got ${notFoundCompRes.status}`);
    }

    const malformedCommRes = await request(app).get('/api/v1/committees/bad-id-123');
    if (malformedCommRes.status !== 400 || malformedCommRes.body.error?.code !== 'INVALID_ID') {
      throw new Error(`Expected 400 INVALID_ID, got ${malformedCommRes.status}`);
    }
    console.log('  ✓ Malformed ObjectIds return 400 INVALID_ID; Nonexistent IDs return 404 NOT_FOUND');

    // ----------------------------------------------------
    // TEST 12: Profile Completeness Lifecycle
    // ----------------------------------------------------
    console.log('[TEST 12] Testing Profile Completeness Lifecycle...');
    
    // Initially Company B is incomplete
    const compBInitial = await request(app)
      .get('/api/v1/companies/me')
      .set('Authorization', `Bearer ${tokenCompanyB}`);
    if (compBInitial.body.data.completeness.isProfileComplete !== false) {
      throw new Error('Expected initial Company B completeness to be false');
    }
    if (compBInitial.body.data.completeness.missingFields.length === 0) {
      throw new Error('Expected missingFields list for incomplete Company B');
    }

    // Fill in all missing fields for Company B
    const completeCompBRes = await request(app)
      .patch('/api/v1/companies/me')
      .set('Authorization', `Bearer ${tokenCompanyB}`)
      .send({
        description: 'Comprehensive leading brand supporting campus events and sports festivals',
        industry: 'Beverages and FMCG',
        website: 'https://apexfmcg.example.com',
        location: { city: 'Mumbai', state: 'Maharashtra' },
        contact: { phone: '+919876543299' },
        sponsorshipPreferences: {
          eventCategories: ['Sports', 'Cultural'],
          preferredLocations: ['Mumbai', 'Pune'],
          contributionTypes: ['BEVERAGE', 'MERCHANDISE'],
          budgetMax: 500000,
        },
      });
    if (completeCompBRes.status !== 200 || completeCompBRes.body.data.completeness.isProfileComplete !== true) {
      throw new Error(`Expected Company B profile to become complete, got score: ${completeCompBRes.body.data.completeness.score}`);
    }
    if (completeCompBRes.body.data.company.isProfileComplete !== true) {
      throw new Error('isProfileComplete flag in DB not updated to true');
    }

    // Now clear a required field to verify it transitions back to incomplete
    const uncompleteCompBRes = await request(app)
      .patch('/api/v1/companies/me')
      .set('Authorization', `Bearer ${tokenCompanyB}`)
      .send({
        description: '', // Cleared required description
      });
    if (uncompleteCompBRes.body.data.completeness.isProfileComplete !== false) {
      throw new Error('Expected Company B profile completeness to transition back to false after clearing description');
    }
    console.log('  ✓ Profile completeness transitions dynamically based on field criteria');

    // ----------------------------------------------------
    // TEST 13: Self-Reported History CRUD & Distinctions
    // ----------------------------------------------------
    console.log('[TEST 13] Testing Self-Reported History CRUD & Strict Verification Distinctions...');
    
    // 13.1 Company owner creates history
    const createHistoryRes = await request(app)
      .post('/api/v1/companies/me/history')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        title: 'Sponsored National Hackathon 2025',
        eventName: 'National Campus Hack 2025',
        partnerName: 'National Tech Society',
        date: '2025-09-15',
        description: 'External historical sponsorship before joining PITCH platform',
        mediaFileIds: [testFile._id],
      });
    if (createHistoryRes.status !== 201 || !createHistoryRes.body.data.history) {
      throw new Error(`Create company history failed: ${JSON.stringify(createHistoryRes.body)}`);
    }
    const createdHistory = createHistoryRes.body.data.history;
    cleanupHistoryIds.push(createdHistory._id);

    if (createdHistory.verificationStatus !== 'SELF_REPORTED') {
      throw new Error(`Expected verificationStatus: SELF_REPORTED, got ${createdHistory.verificationStatus}`);
    }
    if (createdHistory.ownerType !== 'COMPANY') {
      throw new Error(`Expected ownerType: COMPANY, got ${createdHistory.ownerType}`);
    }

    // 13.2 Verify attempt to spoof verificationStatus is rejected
    const spoofStatusRes = await request(app)
      .post('/api/v1/companies/me/history')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        title: 'Fake Verified History',
        eventName: 'Fake Fest',
        partnerName: 'Fake Partner',
        date: '2025-01-01',
        verificationStatus: 'PITCH_VERIFIED', // Forbidden spoof attempt
      });
    if (spoofStatusRes.status !== 400 || spoofStatusRes.body.error?.code !== 'VALIDATION_ERROR') {
      throw new Error(`Expected 400 VALIDATION_ERROR on spoofing verificationStatus, got ${spoofStatusRes.status}`);
    }

    // 13.3 Public lookup of Company self-reported history
    const pubHistoryRes = await request(app).get(`/api/v1/companies/${companyA._id}/history`);
    if (pubHistoryRes.status !== 200 || !Array.isArray(pubHistoryRes.body.data.history)) {
      throw new Error(`Public company history GET failed: ${JSON.stringify(pubHistoryRes.body)}`);
    }
    if (pubHistoryRes.body.data.history.length === 0) {
      throw new Error('Public company history returned empty list');
    }
    if (pubHistoryRes.body.data.history[0].verificationStatus !== 'SELF_REPORTED') {
      throw new Error('Public history missing SELF_REPORTED status tag');
    }

    // 13.4 Owner updates history entry
    const updateHistoryRes = await request(app)
      .patch(`/api/v1/companies/me/history/${createdHistory._id}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        title: 'Updated Title: Sponsored National Hackathon 2025 (Platinum Sponsor)',
      });
    if (updateHistoryRes.status !== 200 || !updateHistoryRes.body.data.history.title.includes('Platinum Sponsor')) {
      throw new Error('Owner failed to update history entry');
    }

    // 13.5 Cross-tenant history update denial (Company B attempts to update Company A history)
    const crossHistoryUpdateRes = await request(app)
      .patch(`/api/v1/companies/me/history/${createdHistory._id}`)
      .set('Authorization', `Bearer ${tokenCompanyB}`)
      .send({ title: 'Tampered by Company B' });
    if (crossHistoryUpdateRes.status !== 404) {
      throw new Error(`Expected 404 on cross-company history update attempt, got ${crossHistoryUpdateRes.status}`);
    }

    // 13.6 Committee owner creates committee history
    const commHistoryRes = await request(app)
      .post('/api/v1/committees/me/history')
      .set('Authorization', `Bearer ${tokenCommitteeA}`)
      .send({
        title: 'Organized TechFest 2024',
        eventName: 'TechFest 2024',
        partnerName: 'State Technology Council',
        date: '2024-11-20',
        description: 'Annual intercollegiate festival prior to PITCH integration',
      });
    if (commHistoryRes.status !== 201 || commHistoryRes.body.data.history.verificationStatus !== 'SELF_REPORTED') {
      throw new Error('Committee history creation failed');
    }
    cleanupHistoryIds.push(commHistoryRes.body.data.history._id);

    // 13.7 Owner deletes history entry
    const deleteHistoryRes = await request(app)
      .delete(`/api/v1/companies/me/history/${createdHistory._id}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`);
    if (deleteHistoryRes.status !== 200 || !deleteHistoryRes.body.success) {
      throw new Error('Owner failed to delete history entry');
    }

    console.log('  ✓ Self-reported history fully operational with strict SELF_REPORTED tagging and cross-tenant protection');

    // ----------------------------------------------------
    // TEST 14: Media References Assignment & Validation
    // ----------------------------------------------------
    console.log('[TEST 14] Testing Media Reference File ID Validation & Assignment...');
    
    // 14.1 Assign valid logoFileId to Company A
    const assignLogoRes = await request(app)
      .patch('/api/v1/companies/me')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ logoFileId: testFile._id });
    if (assignLogoRes.status !== 200 || assignLogoRes.body.data.company.logoFileId !== testFile._id.toString()) {
      throw new Error('Failed to assign valid logoFileId');
    }

    // 14.2 Attempt to assign nonexistent file ID
    const fakeFileId = new mongoose.Types.ObjectId();
    const badFileRes = await request(app)
      .patch('/api/v1/companies/me')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ logoFileId: fakeFileId });
    if (badFileRes.status !== 400 || badFileRes.body.error?.code !== 'FILE_NOT_FOUND') {
      throw new Error(`Expected 400 FILE_NOT_FOUND on missing media file reference, got ${badFileRes.status}`);
    }
    console.log('  ✓ Media references validated against File collection and saved properly');

    console.log('\n====================================================');
    console.log(' ALL 14 PHASE 6 PROFILE TESTS PASSED WITH 100% SUCCESS ');
    console.log('====================================================\n');
  } finally {
    // Teardown created test fixtures
    await SelfReportedHistory.deleteMany({ _id: { $in: cleanupHistoryIds } });
    await File.deleteMany({ _id: { $in: cleanupFileIds } });
    await Company.deleteMany({ _id: { $in: cleanupCompanyIds } });
    await Committee.deleteMany({ _id: { $in: cleanupCommitteeIds } });
    await User.deleteMany({ _id: { $in: cleanupUserIds } });
    await mongoose.disconnect();
    console.log('[PITCH] MongoDB disconnected.');
  }
}

if (require.main === module) {
  runPhase6Tests().catch((err) => {
    console.error('\n❌ Phase 6 Test Suite Encountered Error:\n', err);
    process.exit(1);
  });
}

module.exports = runPhase6Tests;
