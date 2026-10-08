const mongoose = require('mongoose');
const request = require('supertest');
const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/db');
const { validateEnv } = require('./src/config/env');
const {
  User,
  Company,
  Committee,
  Event,
  Deal,
  Fulfillment,
  FulfillmentEvidence,
  Review,
  Report,
  Dispute,
  AuditLog,
  File,
  SelfReportedHistory,
} = require('./src/models');
const {
  ROLES,
  USER_STATUS,
  EVENT_STATUS,
  EVENT_LOCATION_MODE,
  DEAL_STATUS,
  FULFILLMENT_RESPONSIBLE_PARTY,
  FULFILLMENT_TYPE,
  FULFILLMENT_STATUS,
  FILE_PROVIDER,
  FILE_RESOURCE_TYPE,
  FILE_PURPOSE,
} = require('./src/utils/constants');
const { generateAccessToken } = require('./src/utils/jwt');
const { hashPassword } = require('./src/utils/password');
const auditService = require('./src/services/auditService');

/**
 * PITCH Phase 23–31 Test Suite:
 * Fulfillment, Completion, Reviews & Reputation, Self-Reported History Separation,
 * Admin, Reports/Disputes, Audit Logs, and Security Hardening.
 */

async function runPostAgreementTests() {
  console.log('====================================================');
  console.log(' PITCH Post-Agreement & Hardening Test Suite        ');
  console.log(' Phases 23 to 31 (Fulfillment, Completion, Admin)   ');
  console.log('====================================================\n');

  validateEnv();
  await connectDB();
  console.log('✓ Database connection established\n');

  const timestamp = Date.now();
  const hashedPassword = await hashPassword('TestPassword123!');

  // Cleanup tracking
  const createdUserIds = [];
  const createdCompanyIds = [];
  const createdCommitteeIds = [];
  const createdEventIds = [];
  const createdDealIds = [];
  const createdFileIds = [];

  try {
    console.log('[SETUP] Creating test users, organizations, and events...');

    // 1. Admin
    const userAdmin = await User.create({
      name: 'Test Administrator',
      email: `admin.${timestamp}@pitch.test`,
      passwordHash: hashedPassword,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    createdUserIds.push(userAdmin._id);
    const tokenAdmin = generateAccessToken(userAdmin);

    // 2. Company A (Participant)
    const userCompanyA = await User.create({
      name: 'Tech Ventures Lead',
      email: `company.a.${timestamp}@pitch.test`,
      passwordHash: hashedPassword,
      role: ROLES.COMPANY,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    createdUserIds.push(userCompanyA._id);
    const companyA = await Company.create({
      userId: userCompanyA._id,
      name: 'Tech Ventures Ltd',
      industry: 'Technology',
    });
    createdCompanyIds.push(companyA._id);
    const tokenCompanyA = generateAccessToken(userCompanyA);

    // 3. Company B (Non-Participant)
    const userCompanyB = await User.create({
      name: 'Outsider Corp Lead',
      email: `company.b.${timestamp}@pitch.test`,
      passwordHash: hashedPassword,
      role: ROLES.COMPANY,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    createdUserIds.push(userCompanyB._id);
    const companyB = await Company.create({
      userId: userCompanyB._id,
      name: 'Outsider Corp',
      industry: 'Finance',
    });
    createdCompanyIds.push(companyB._id);
    const tokenCompanyB = generateAccessToken(userCompanyB);

    // 4. Committee A (Participant)
    const userCommitteeA = await User.create({
      name: 'IITB TechFest Convenor',
      email: `committee.a.${timestamp}@pitch.test`,
      passwordHash: hashedPassword,
      role: ROLES.COMMITTEE,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    createdUserIds.push(userCommitteeA._id);
    const committeeA = await Committee.create({
      userId: userCommitteeA._id,
      name: 'TechFest Council',
      college: {
        name: 'IIT Bombay',
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      },
    });
    createdCommitteeIds.push(committeeA._id);
    const tokenCommitteeA = generateAccessToken(userCommitteeA);

    // 5. Committee B (Non-Participant)
    const userCommitteeB = await User.create({
      name: 'Outsider Cultural Head',
      email: `committee.b.${timestamp}@pitch.test`,
      passwordHash: hashedPassword,
      role: ROLES.COMMITTEE,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    createdUserIds.push(userCommitteeB._id);
    const committeeB = await Committee.create({
      userId: userCommitteeB._id,
      name: 'Outsider Cultural Club',
      college: {
        name: 'Other College',
        location: { city: 'Delhi', state: 'Delhi', country: 'India' },
      },
    });
    createdCommitteeIds.push(committeeB._id);
    const tokenCommitteeB = generateAccessToken(userCommitteeB);

    // 6. Event under Committee A
    const eventA = await Event.create({
      committeeId: committeeA._id,
      title: 'Technovanza 2026',
      slug: `technovanza-${timestamp}`,
      description: 'Annual technical fest',
      category: 'TECHNICAL',
      eventDate: new Date(Date.now() + 10 * 86400000),
      location: { mode: EVENT_LOCATION_MODE.PHYSICAL, city: 'Mumbai' },
      status: EVENT_STATUS.PUBLISHED,
    });
    createdEventIds.push(eventA._id);

    // 7. Evidence File
    const evidenceFile = await File.create({
      ownerUserId: userCompanyA._id,
      provider: FILE_PROVIDER.CLOUDINARY,
      publicId: `test/evidence_${timestamp}`,
      url: 'https://res.cloudinary.com/test/evidence.jpg',
      originalName: 'evidence.jpg',
      mimeType: 'image/jpeg',
      resourceType: FILE_RESOURCE_TYPE.IMAGE,
      purpose: FILE_PURPOSE.FULFILLMENT_EVIDENCE,
    });
    createdFileIds.push(evidenceFile._id);

    // 8. Test Deal 1 (for Fulfillment & Completion)
    const deal1 = await Deal.create({
      eventId: eventA._id,
      companyId: companyA._id,
      committeeId: committeeA._id,
      status: DEAL_STATUS.EXECUTED,
      executedAt: new Date(),
    });
    createdDealIds.push(deal1._id);

    console.log('  ✓ Test fixtures successfully initialized.\n');

    // ====================================================
    // TEST 1: Phase 23 — Fulfillment CRUD & Progress Tracking
    // ====================================================
    console.log('[TEST 1] Testing Fulfillment Obligations (Cash & Non-Cash), Progress & Evidence...');

    // 1.1 Non-participant rejected from adding fulfillment -> 403
    const nonPartFulfillment = await request(app)
      .post(`/api/v1/deals/${deal1._id}/fulfillment`)
      .set('Authorization', `Bearer ${tokenCompanyB}`)
      .send({
        responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMPANY,
        type: FULFILLMENT_TYPE.CASH,
        description: 'Unauthorized cash sponsorship',
        quantity: 50000,
        unit: 'INR',
      });
    if (nonPartFulfillment.status !== 403) {
      throw new Error(`Expected 403 for non-participant adding fulfillment, got ${nonPartFulfillment.status}`);
    }

    // 1.2 Company adds Cash Obligation -> 201 (Deal transitions to FULFILLMENT)
    const cashFulfillmentRes = await request(app)
      .post(`/api/v1/deals/${deal1._id}/fulfillment`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMPANY,
        type: FULFILLMENT_TYPE.CASH,
        description: 'Payment of ₹1,00,000 cash grant to student committee account',
        quantity: 100000,
        unit: 'INR',
      });
    if (cashFulfillmentRes.status !== 201 || !cashFulfillmentRes.body.data._id) {
      throw new Error(`Failed to create cash fulfillment: ${JSON.stringify(cashFulfillmentRes.body)}`);
    }
    const cashFulfillmentId = cashFulfillmentRes.body.data._id;

    // Verify Deal automatically transitioned to FULFILLMENT
    const updatedDeal1 = await Deal.findById(deal1._id);
    if (updatedDeal1.status !== DEAL_STATUS.FULFILLMENT) {
      throw new Error(`Expected deal to be in FULFILLMENT status, got ${updatedDeal1.status}`);
    }

    // 1.3 Committee adds Non-Cash Product & Booth Obligations -> 201
    const productFulfillmentRes = await request(app)
      .post(`/api/v1/deals/${deal1._id}/fulfillment`)
      .set('Authorization', `Bearer ${tokenCommitteeA}`)
      .send({
        responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMPANY,
        type: FULFILLMENT_TYPE.PRODUCT,
        description: 'Supply 500 Energy Bars for hackathon snack bags',
        quantity: 500,
        unit: 'bars',
      });
    if (productFulfillmentRes.status !== 201) {
      throw new Error(`Failed to create product fulfillment: ${JSON.stringify(productFulfillmentRes.body)}`);
    }
    const productFulfillmentId = productFulfillmentRes.body.data._id;

    const boothFulfillmentRes = await request(app)
      .post(`/api/v1/deals/${deal1._id}/fulfillment`)
      .set('Authorization', `Bearer ${tokenCommitteeA}`)
      .send({
        responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMMITTEE,
        type: FULFILLMENT_TYPE.BOOTH,
        description: 'Provide 10x10 prime booth with power supply in main hall',
        quantity: 1,
        unit: 'stall',
      });
    const boothFulfillmentId = boothFulfillmentRes.body.data._id;

    // 1.4 Get Fulfillment List & Verify Summary Metrics
    const fulfillmentListRes = await request(app)
      .get(`/api/v1/deals/${deal1._id}/fulfillment`)
      .set('Authorization', `Bearer ${tokenCompanyA}`);
    if (fulfillmentListRes.status !== 200 || fulfillmentListRes.body.data.fulfillments.length !== 3) {
      throw new Error(`Expected 3 fulfillment obligations, got ${fulfillmentListRes.body.data?.fulfillments?.length}`);
    }
    const summaryBefore = fulfillmentListRes.body.data.summary;
    if (summaryBefore.total !== 3 || summaryBefore.completed !== 0 || summaryBefore.progressPercentage !== 0) {
      throw new Error(`Summary metrics mismatch before completion: ${JSON.stringify(summaryBefore)}`);
    }

    // 1.5 Upload Evidence for Cash Fulfillment -> 201
    const evidenceRes = await request(app)
      .post(`/api/v1/fulfillment/${cashFulfillmentId}/evidence`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        fileId: evidenceFile._id.toString(),
        description: 'Bank transfer counterfoil receipt acknowledgement',
      });
    if (evidenceRes.status !== 201 || !evidenceRes.body.data._id) {
      throw new Error(`Failed to attach fulfillment evidence: ${JSON.stringify(evidenceRes.body)}`);
    }

    // 1.6 Get Evidence List -> 200
    const getEvidenceRes = await request(app)
      .get(`/api/v1/fulfillment/${cashFulfillmentId}/evidence`)
      .set('Authorization', `Bearer ${tokenCommitteeA}`);
    if (getEvidenceRes.status !== 200 || getEvidenceRes.body.data.length !== 1) {
      throw new Error('Failed to retrieve attached fulfillment evidence');
    }

    // 1.7 Partial Delivery: Update product quantity delivered & status to IN_PROGRESS -> 200
    const partialUpdateRes = await request(app)
      .patch(`/api/v1/fulfillment/${productFulfillmentId}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        status: FULFILLMENT_STATUS.IN_PROGRESS,
        description: 'Partial delivery: 250 of 500 Energy Bars delivered at reception',
      });
    if (partialUpdateRes.status !== 200 || partialUpdateRes.body.data.status !== FULFILLMENT_STATUS.IN_PROGRESS) {
      throw new Error('Failed to update fulfillment obligation for partial progress');
    }

    // 1.8 Complete individual obligations
    const completeCashRes = await request(app)
      .post(`/api/v1/fulfillment/${cashFulfillmentId}/complete`)
      .set('Authorization', `Bearer ${tokenCommitteeA}`);
    if (completeCashRes.status !== 200 || completeCashRes.body.data.status !== FULFILLMENT_STATUS.COMPLETED) {
      throw new Error('Failed to mark cash obligation completed');
    }

    const completeBoothRes = await request(app)
      .post(`/api/v1/fulfillment/${boothFulfillmentId}/complete`)
      .set('Authorization', `Bearer ${tokenCompanyA}`);
    if (completeBoothRes.status !== 200 || completeBoothRes.body.data.status !== FULFILLMENT_STATUS.COMPLETED) {
      throw new Error('Failed to mark booth obligation completed');
    }

    console.log('  ✓ Cash, Product, and Booth obligations created, evidence uploaded, and partial delivery recorded.');

    // ====================================================
    // TEST 2: Phase 24 — Deal Completion Workflow & Authorization
    // ====================================================
    console.log('[TEST 2] Testing Deal Completion Validation & Lifecycle Rules...');

    // 2.1 Attempt completion while obligations are pending without confirmIncomplete -> 400 OBLIGATIONS_PENDING
    const prematureComplete = await request(app)
      .post(`/api/v1/deals/${deal1._id}/complete`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ confirmIncomplete: false });
    if (prematureComplete.status !== 400 || prematureComplete.body.error?.code !== 'OBLIGATIONS_PENDING') {
      throw new Error(
        `Expected 400 OBLIGATIONS_PENDING on premature completion, got ${prematureComplete.status} : ${JSON.stringify(prematureComplete.body)}`
      );
    }

    // 2.2 Non-participant completion attempt -> 403 FORBIDDEN
    const nonPartComplete = await request(app)
      .post(`/api/v1/deals/${deal1._id}/complete`)
      .set('Authorization', `Bearer ${tokenCompanyB}`)
      .send({ confirmIncomplete: true });
    if (nonPartComplete.status !== 403) {
      throw new Error(`Expected 403 for non-participant complete attempt, got ${nonPartComplete.status}`);
    }

    // 2.3 Fulfill the remaining product obligation
    await request(app)
      .post(`/api/v1/fulfillment/${productFulfillmentId}/complete`)
      .set('Authorization', `Bearer ${tokenCommitteeA}`);

    // 2.4 Verify Completion Status endpoint (/api/v1/deals/:dealId/completion)
    const completionStatusRes = await request(app)
      .get(`/api/v1/deals/${deal1._id}/completion`)
      .set('Authorization', `Bearer ${tokenCompanyA}`);
    if (
      completionStatusRes.status !== 200 ||
      !completionStatusRes.body.data.isFullyFulfilled ||
      !completionStatusRes.body.data.canComplete
    ) {
      throw new Error(`Completion status check failed: ${JSON.stringify(completionStatusRes.body)}`);
    }

    // 2.5 Complete deal -> 200 OK
    const completeDealRes = await request(app)
      .post(`/api/v1/deals/${deal1._id}/complete`)
      .set('Authorization', `Bearer ${tokenCommitteeA}`)
      .send({ confirmIncomplete: false });
    if (completeDealRes.status !== 200 || completeDealRes.body.data.status !== DEAL_STATUS.COMPLETED) {
      throw new Error(`Failed to complete deal: ${JSON.stringify(completeDealRes.body)}`);
    }
    if (!completeDealRes.body.data.completedAt) {
      throw new Error('completedAt timestamp was not recorded on deal completion');
    }

    // 2.6 Second completion attempt on already completed deal -> 400 DEAL_ALREADY_COMPLETED
    const duplicateComplete = await request(app)
      .post(`/api/v1/deals/${deal1._id}/complete`)
      .set('Authorization', `Bearer ${tokenCommitteeA}`)
      .send({ confirmIncomplete: true });
    if (duplicateComplete.status !== 400) {
      throw new Error(`Expected 400 on duplicate deal completion, got ${duplicateComplete.status}`);
    }

    console.log('  ✓ Deal completion verified: Pending warning enforced, timestamp recorded, and duplicate blocked.');

    // ====================================================
    // TEST 3: Phase 25 — Reviews & Verified Reputation
    // ====================================================
    console.log('[TEST 3] Testing Reviews & Verified Reputation (Completed Deal Requirement)...');

    // 3.1 Non-completed deal review attempt must fail
    const uncompletedDeal = await Deal.create({
      eventId: eventA._id,
      companyId: companyA._id,
      committeeId: committeeA._id,
      status: DEAL_STATUS.EXECUTED,
    });
    createdDealIds.push(uncompletedDeal._id);

    const prematureReview = await request(app)
      .post(`/api/v1/deals/${uncompletedDeal._id}/reviews`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ rating: 5, comment: 'Too early review' });
    if (prematureReview.status !== 400 || prematureReview.body.error?.code !== 'DEAL_NOT_COMPLETED') {
      throw new Error(`Expected 400 DEAL_NOT_COMPLETED, got ${prematureReview.status}`);
    }

    // 3.2 Non-participant review attempt on completed deal -> 403 FORBIDDEN
    const nonPartReview = await request(app)
      .post(`/api/v1/deals/${deal1._id}/reviews`)
      .set('Authorization', `Bearer ${tokenCompanyB}`)
      .send({ rating: 4, comment: 'Fake review' });
    if (nonPartReview.status !== 403) {
      throw new Error(`Expected 403 for non-participant review, got ${nonPartReview.status}`);
    }

    // 3.3 Invalid rating (out of 1-5 range) -> 400 VALIDATION_ERROR
    const invalidRatingReview = await request(app)
      .post(`/api/v1/deals/${deal1._id}/reviews`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ rating: 6, comment: 'Invalid 6 star rating' });
    if (invalidRatingReview.status !== 400) {
      throw new Error(`Expected 400 for rating 6, got ${invalidRatingReview.status}`);
    }

    // 3.4 Company reviews Committee -> 201 Created
    const companyReviewRes = await request(app)
      .post(`/api/v1/deals/${deal1._id}/reviews`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        rating: 5,
        title: 'Exceptional collegiate festival partner',
        comment: 'High student engagement and proactive organization from start to finish.',
      });
    if (companyReviewRes.status !== 201 || !companyReviewRes.body.data._id) {
      throw new Error(`Failed to create company review: ${JSON.stringify(companyReviewRes.body)}`);
    }
    const companyReviewId = companyReviewRes.body.data._id;

    // Verify target of company review is revieweeCommitteeId
    if (companyReviewRes.body.data.revieweeCommitteeId !== committeeA._id.toString()) {
      throw new Error('Review target should be the committee');
    }

    // 3.5 Duplicate review in same direction -> 409 DUPLICATE_REVIEW
    const duplicateReviewRes = await request(app)
      .post(`/api/v1/deals/${deal1._id}/reviews`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ rating: 5, comment: 'Duplicate attempt' });
    if (duplicateReviewRes.status !== 409 || duplicateReviewRes.body.error?.code !== 'DUPLICATE_REVIEW') {
      throw new Error(`Expected 409 DUPLICATE_REVIEW, got ${duplicateReviewRes.status}`);
    }

    // 3.6 Committee reviews Company -> 201 Created (reverse direction permitted)
    const committeeReviewRes = await request(app)
      .post(`/api/v1/deals/${deal1._id}/reviews`)
      .set('Authorization', `Bearer ${tokenCommitteeA}`)
      .send({
        rating: 5,
        title: 'Prompt and generous corporate sponsor',
        comment: 'Delivered collateral early and supported our hackathon tracks generously.',
      });
    if (committeeReviewRes.status !== 201) {
      throw new Error(`Failed to create committee review: ${JSON.stringify(committeeReviewRes.body)}`);
    }

    // 3.7 Update review by reviewer -> 200
    const updateReviewRes = await request(app)
      .patch(`/api/v1/reviews/${companyReviewId}`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({ title: 'Updated: Exceptional collegiate partner' });
    if (updateReviewRes.status !== 200 || !updateReviewRes.body.data.title.startsWith('Updated:')) {
      throw new Error('Failed to update review title');
    }

    // 3.8 Non-author review update attempt -> 403 FORBIDDEN
    const nonAuthorUpdate = await request(app)
      .patch(`/api/v1/reviews/${companyReviewId}`)
      .set('Authorization', `Bearer ${tokenCompanyB}`)
      .send({ comment: 'Tampered comment' });
    if (nonAuthorUpdate.status !== 403) {
      throw new Error(`Expected 403 for non-author review update, got ${nonAuthorUpdate.status}`);
    }

    // 3.9 Check Organization Reviews & Reputation Aggregation
    const committeeReviewsRes = await request(app).get(`/api/v1/committees/${committeeA._id}/reviews`);
    if (committeeReviewsRes.status !== 200) {
      throw new Error('Failed to fetch committee reviews');
    }
    const committeeSummary = committeeReviewsRes.body.pagination?.summary;
    if (!committeeSummary || committeeSummary.averageRating !== 5 || committeeSummary.totalReviews !== 1) {
      throw new Error(`Committee reputation summary mismatch: ${JSON.stringify(committeeSummary)}`);
    }

    console.log('  ✓ Reviews enforced: Completed-deal check, single-review constraint, and rating aggregation verified.');

    // ====================================================
    // TEST 4: Phase 26 — Self-Reported vs PITCH-Verified Separation
    // ====================================================
    console.log('[TEST 4] Testing Strict Separation of Self-Reported vs PITCH-Verified History...');

    // 4.1 Create Self-Reported History item for Company A
    const selfReportedRes = await request(app)
      .post('/api/v1/companies/me/history')
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        title: 'HackCampus 2024 Past Sponsor',
        eventName: 'HackCampus 2024',
        partnerName: 'State Tech University',
        date: '2024-05-10',
        description: 'External past sponsorship outside PITCH',
      });
    if (selfReportedRes.status !== 201) {
      throw new Error(`Failed to create self-reported history: ${JSON.stringify(selfReportedRes.body)}`);
    }
    const historyItem = selfReportedRes.body.data?.history || selfReportedRes.body.data;
    if (historyItem.verificationStatus !== 'SELF_REPORTED') {
      throw new Error(`Self-reported history must be explicitly labeled SELF_REPORTED, got: ${historyItem.verificationStatus}`);
    }

    // 4.2 Query PITCH-Verified History for Company A
    const verifiedHistoryRes = await request(app).get(`/api/v1/companies/${companyA._id}/verified-history`);
    if (verifiedHistoryRes.status !== 200) {
      throw new Error('Failed to query company verified history');
    }
    const verifiedList = verifiedHistoryRes.body.data;
    if (!Array.isArray(verifiedList) || verifiedList.length !== 1) {
      throw new Error(`Expected exactly 1 verified completed deal, got ${verifiedList.length}`);
    }
    if (verifiedList[0].verificationStatus !== 'PITCH_VERIFIED') {
      throw new Error(`PITCH completed deal must be labeled PITCH_VERIFIED, got: ${verifiedList[0].verificationStatus}`);
    }

    // 4.3 Verify Self-Reported history is NOT included in Verified History
    const containsSelfReported = verifiedList.some((item) => item.eventName === 'HackCampus 2024');
    if (containsSelfReported) {
      throw new Error('CRITICAL VIOLATION: Self-reported history leaked into PITCH-verified history!');
    }

    // 4.4 Verify Self-Reported history did not alter review count or average rating
    const companyReviewsRes = await request(app).get(`/api/v1/companies/${companyA._id}/reviews`);
    if (companyReviewsRes.body.pagination?.summary?.totalReviews !== 1) {
      throw new Error('Self-reported history must never count toward review totals');
    }

    console.log('  ✓ Strict boundary verified: Self-Reported history labeled distinctly and excluded from PITCH verified history.');

    // ====================================================
    // TEST 5: Phase 28 — Disputes, Reports & Audit Logging
    // ====================================================
    console.log('[TEST 5] Testing Disputes, Reports & Audit Trail...');

    // 5.1 Create Deal for Dispute
    const dealForDispute = await Deal.create({
      eventId: eventA._id,
      companyId: companyA._id,
      committeeId: committeeA._id,
      status: DEAL_STATUS.FULFILLMENT,
    });
    createdDealIds.push(dealForDispute._id);

    // 5.2 Open Dispute on deal -> 201
    const disputeRes = await request(app)
      .post(`/api/v1/deals/${dealForDispute._id}/dispute`)
      .set('Authorization', `Bearer ${tokenCompanyA}`)
      .send({
        reason: 'Sponsorship banner missing from conference stage',
        description: 'Banner was agreed upon in MoU deliverables but was omitted on day 1 of the event.',
      });
    if (disputeRes.status !== 201 || !disputeRes.body.data._id) {
      throw new Error(`Failed to create deal dispute: ${JSON.stringify(disputeRes.body)}`);
    }

    // Check deal status transitioned to DISPUTED
    const disputedDealDoc = await Deal.findById(dealForDispute._id);
    if (disputedDealDoc.status !== DEAL_STATUS.DISPUTED) {
      throw new Error(`Expected deal status to be DISPUTED, got ${disputedDealDoc.status}`);
    }

    // 5.3 User submits general platform report -> 201
    const userReportRes = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${tokenCommitteeA}`)
      .send({
        targetType: 'USER',
        targetId: userCompanyB._id.toString(),
        reason: 'Unsolicited spam messages received',
        description: 'Sending repetitive promotional solicitations.',
      });
    if (userReportRes.status !== 201 || !userReportRes.body.data._id) {
      throw new Error(`Failed to create platform report: ${JSON.stringify(userReportRes.body)}`);
    }
    const reportId = userReportRes.body.data._id;

    // 5.4 Get My Reports -> 200
    const myReportsRes = await request(app)
      .get('/api/v1/reports/me')
      .set('Authorization', `Bearer ${tokenCommitteeA}`);
    if (myReportsRes.status !== 200 || myReportsRes.body.data.length !== 1) {
      throw new Error('Failed to retrieve user reports');
    }

    // 5.5 Audit Log secret redaction test
    const testLog = await auditService.logAction({
      actorUserId: userAdmin._id,
      action: 'SECURITY_TEST_AUDIT',
      entityType: 'TEST',
      metadata: {
        username: 'alice',
        password: 'SuperSecretPassword123!',
        token: 'eyJhGciOi...sensitive_token',
        nested: {
          refreshToken: 'refresh_secret_value',
          publicInfo: 'visible_data',
        },
      },
    });

    if (
      testLog.metadata.password !== '[REDACTED]' ||
      testLog.metadata.token !== '[REDACTED]' ||
      testLog.metadata.nested.refreshToken !== '[REDACTED]' ||
      testLog.metadata.nested.publicInfo !== 'visible_data'
    ) {
      throw new Error(`Sensitive credential redaction failed in audit log: ${JSON.stringify(testLog.metadata)}`);
    }

    console.log('  ✓ Deal dispute, user report, and immutable audit log with secret redaction verified.');

    // ====================================================
    // TEST 6: Phase 27 — Admin Dashboard, Moderation & Analytics
    // ====================================================
    console.log('[TEST 6] Testing Admin Access Controls, Analytics & Moderation...');

    // 6.1 Non-admin access to admin endpoints strictly rejected -> 403
    const companyToAdmin = await request(app)
      .get('/api/v1/admin/analytics/overview')
      .set('Authorization', `Bearer ${tokenCompanyA}`);
    if (companyToAdmin.status !== 403) {
      throw new Error(`Expected 403 for company accessing admin analytics, got ${companyToAdmin.status}`);
    }

    const committeeToAdmin = await request(app)
      .get('/api/v1/admin/deals')
      .set('Authorization', `Bearer ${tokenCommitteeA}`);
    if (committeeToAdmin.status !== 403) {
      throw new Error(`Expected 403 for committee accessing admin deals, got ${committeeToAdmin.status}`);
    }

    // 6.2 Admin access to Analytics Overview -> 200
    const analyticsRes = await request(app)
      .get('/api/v1/admin/analytics/overview')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    if (analyticsRes.status !== 200 || !analyticsRes.body.data.deals) {
      throw new Error(`Admin analytics check failed: ${JSON.stringify(analyticsRes.body)}`);
    }

    // 6.3 Admin access to Event & Deal Analytics -> 200
    const eventAnalyticsRes = await request(app)
      .get('/api/v1/admin/analytics/events')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    if (eventAnalyticsRes.status !== 200 || !eventAnalyticsRes.body.data.byStatus) {
      throw new Error('Event analytics check failed');
    }

    const dealAnalyticsRes = await request(app)
      .get('/api/v1/admin/analytics/deals')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    if (dealAnalyticsRes.status !== 200 || !dealAnalyticsRes.body.data.dealsByStatus) {
      throw new Error('Deal analytics check failed');
    }

    // 6.4 Admin Deal Inspector -> 200
    const inspectDealRes = await request(app)
      .get(`/api/v1/admin/deals/${deal1._id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    if (
      inspectDealRes.status !== 200 ||
      !inspectDealRes.body.data.deal ||
      !inspectDealRes.body.data.fulfillments
    ) {
      throw new Error('Admin deal inspector failed to return comprehensive data');
    }

    // 6.5 Admin resolves report -> 200
    const resolveReportRes = await request(app)
      .patch(`/api/v1/admin/reports/${reportId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        status: 'RESOLVED',
        resolution: 'Warning issued to reported user regarding message etiquette.',
      });
    if (resolveReportRes.status !== 200 || resolveReportRes.body.data.status !== 'RESOLVED') {
      throw new Error('Failed to resolve report via admin moderation');
    }

    // 6.6 Admin queries audit logs -> 200
    const adminLogsRes = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    if (adminLogsRes.status !== 200 || !Array.isArray(adminLogsRes.body.data.logs)) {
      throw new Error('Admin audit log listing failed');
    }

    console.log('  ✓ Admin role enforcement, analytics, deal inspection, and report moderation verified.');

    // ====================================================
    // TEST 7: Phase 29 & 31 — Security Hardening & Health Endpoints
    // ====================================================
    console.log('[TEST 7] Testing Security Hardening, ID Validation & Health Check APIs...');

    // 7.1 Malformed ObjectIds return 400 INVALID_ID
    const malformedDeal = await request(app)
      .get('/api/v1/deals/not-a-valid-object-id')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    if (malformedDeal.status !== 400 || malformedDeal.body.error?.code !== 'INVALID_ID') {
      throw new Error(`Expected 400 INVALID_ID on malformed deal ID, got ${malformedDeal.status}`);
    }

    const malformedFulfillment = await request(app)
      .patch('/api/v1/fulfillment/xyz123')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: 'COMPLETED' });
    if (malformedFulfillment.status !== 400 || malformedFulfillment.body.error?.code !== 'INVALID_ID') {
      throw new Error(`Expected 400 INVALID_ID on malformed fulfillment ID, got ${malformedFulfillment.status}`);
    }

    // 7.2 Nonexistent ObjectIds return 404 NOT_FOUND
    const nonExistentDealId = new mongoose.Types.ObjectId();
    const notFoundDeal = await request(app)
      .get(`/api/v1/deals/${nonExistentDealId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    if (notFoundDeal.status !== 404 || notFoundDeal.body.error?.code !== 'DEAL_NOT_FOUND') {
      throw new Error(`Expected 404 DEAL_NOT_FOUND, got ${notFoundDeal.status}`);
    }

    // 7.3 Health endpoints remain operational (Deployment readiness)
    const healthRes = await request(app).get('/api/v1/health');
    if (healthRes.status !== 200 || healthRes.body.data?.status !== 'ok') {
      throw new Error(`Health check /api/v1/health failed: ${healthRes.status}`);
    }

    const healthDbRes = await request(app).get('/api/v1/health/db');
    if (healthDbRes.status !== 200 || healthDbRes.body.data?.database !== 'connected') {
      throw new Error(`DB health check /api/v1/health/db failed: ${healthDbRes.status}`);
    }

    console.log('  ✓ Security hardening confirmed: 400 INVALID_ID, 404 NOT_FOUND, and Health APIs operating.');

    console.log('\n====================================================');
    console.log(' ALL 7 POST-AGREEMENT TEST SUITES PASSED (100%)     ');
    console.log('====================================================\n');
  } finally {
    // Teardown test entities
    await Promise.all([
      FulfillmentEvidence.deleteMany({ uploadedByUserId: { $in: createdUserIds } }),
      Fulfillment.deleteMany({ dealId: { $in: createdDealIds } }),
      Review.deleteMany({ dealId: { $in: createdDealIds } }),
      Dispute.deleteMany({ dealId: { $in: createdDealIds } }),
      Report.deleteMany({ reporterUserId: { $in: createdUserIds } }),
      SelfReportedHistory.deleteMany({ ownerId: { $in: createdCompanyIds } }),
      Deal.deleteMany({ _id: { $in: createdDealIds } }),
      Event.deleteMany({ _id: { $in: createdEventIds } }),
      Company.deleteMany({ _id: { $in: createdCompanyIds } }),
      Committee.deleteMany({ _id: { $in: createdCommitteeIds } }),
      File.deleteMany({ _id: { $in: createdFileIds } }),
      User.deleteMany({ _id: { $in: createdUserIds } }),
    ]);
    await disconnectDB();
  }
}

if (require.main === module) {
  runPostAgreementTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[TEST SUITE FAILURE]', err);
      process.exit(1);
    });
}

module.exports = { runPostAgreementTests };
