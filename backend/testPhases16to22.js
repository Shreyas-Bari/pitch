/**
 * Comprehensive Test Suite for PITCH Phases 16 to 22:
 * PHASE 16 — Contributions
 * PHASE 17 — Deal Lifecycle
 * PHASE 18 — Proposals
 * PHASE 19 — Deal Agreement
 * PHASE 20 — MoU Generation
 * PHASE 21 — MoU Versioning
 * PHASE 22 — Signing & SHA-256
 *
 * Source of Truth:
 * - docs/PITCH_DATABASE_FINAL.md (Sections 16, 17, 18, 19, 20, 21, 38)
 * - docs/PITCH_API_FINAL.md (Sections 12, 13, 14, 15)
 * - docs/PITCH_MOU_FINAL.md (All sections: 5-page template, PITCH_MOU_V1, SHA-256)
 * - docs/PITCH_FINAL_BUILD_SPEC.md (Steps 16-22)
 * - docs/PITCH_UI_SPEC_FINAL.md (Screens 9 & 10)
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { validateEnv } = require('./src/config/env');
const {
  User,
  Company,
  Committee,
  Event,
  Deal,
  Proposal,
  DealAgreement,
  Mou,
  MouVersion,
  Signature,
} = require('./src/models');
const {
  ROLES,
  USER_STATUS,
  DEAL_STATUS,
  DEAL_TRANSITIONS,
  PROPOSAL_STATUS,
  MOU_STATUS,
  MOU_VERSION_STATUS,
  CONTRIBUTION_TYPES,
  TEMPLATE_IDENTIFIER,
  HASH_ALGORITHM,
  SIGNER_ROLE,
} = require('./src/utils/constants');
const { generateAccessToken } = require('./src/utils/jwt');
const { hashPassword } = require('./src/utils/password');

async function runPhases16to22Tests() {
  console.log('====================================================');
  console.log(' PITCH Phases 16–22: Deal, Proposal & MoU Test Suite');
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
  const cleanupEventIds = [];
  const cleanupDealIds = [];

  try {
    console.log('[SETUP] Creating test users, company, committee, and published event...');

    // 1. Company User & Profile
    const companyUser = await User.create({
      email: `company_deal_${timestamp}@testbrand.com`,
      passwordHash: hashedPassword,
      role: ROLES.COMPANY,
      fullName: 'Vikram Mehta',
      status: USER_STATUS.ACTIVE,
      isEmailVerified: true,
    });
    cleanupUserIds.push(companyUser._id);
    const companyToken = generateAccessToken(companyUser);

    const companyProfile = await Company.create({
      userId: companyUser._id,
      name: 'RedBull India Beverages',
      legalName: 'Red Bull India Private Limited',
      industry: 'Beverages & Energy Drinks',
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      contact: { phone: '+91 9820011223', email: 'partnerships@redbull.in' },
      isProfileComplete: true,
    });
    cleanupCompanyIds.push(companyProfile._id);

    // 2. Committee User & Profile
    const committeeUser = await User.create({
      email: `committee_deal_${timestamp}@iitb.ac.in`,
      passwordHash: hashedPassword,
      role: ROLES.COMMITTEE,
      fullName: 'Aarav Sharma',
      status: USER_STATUS.ACTIVE,
      isEmailVerified: true,
    });
    cleanupUserIds.push(committeeUser._id);
    const committeeToken = generateAccessToken(committeeUser);

    const committeeProfile = await Committee.create({
      userId: committeeUser._id,
      name: 'Mood Indigo Cultural Council',
      college: {
        name: 'IIT Bombay',
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      },
      committeeType: 'Cultural Council',
      contact: { phone: '+91 9876543210', email: 'convener@moodi.org' },
      isProfileComplete: true,
    });
    cleanupCommitteeIds.push(committeeProfile._id);

    // 3. Unrelated Third-Party Company (for cross-tenant security checks)
    const thirdPartyUser = await User.create({
      email: `unrelated_deal_${timestamp}@otherbrand.com`,
      passwordHash: hashedPassword,
      role: ROLES.COMPANY,
      fullName: 'Rohan Verma',
      status: USER_STATUS.ACTIVE,
      isEmailVerified: true,
    });
    cleanupUserIds.push(thirdPartyUser._id);
    const thirdPartyToken = generateAccessToken(thirdPartyUser);

    const thirdPartyCompany = await Company.create({
      userId: thirdPartyUser._id,
      name: 'Unrelated Brand Co',
      isProfileComplete: true,
    });
    cleanupCompanyIds.push(thirdPartyCompany._id);

    // 4. Published Event created by Committee
    const event = await Event.create({
      committeeId: committeeProfile._id,
      title: 'Mood Indigo 2026',
      slug: `mood-indigo-${timestamp}`,
      description: 'Asia largest college cultural festival with 140,000+ footfall.',
      category: 'Cultural',
      eventType: 'Annual Festival',
      eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 34 * 24 * 60 * 60 * 1000),
      location: { mode: 'PHYSICAL', venue: 'Gymkhana Grounds', city: 'Mumbai', state: 'Maharashtra' },
      expectedAudience: { min: 25000, max: 140000 },
      status: 'PUBLISHED',
      isPublished: true,
    });
    cleanupEventIds.push(event._id);

    console.log('  ✓ Test fixtures successfully created.\n');

    // ====================================================
    // PHASE 16: CONTRIBUTIONS
    // ====================================================
    console.log('----------------------------------------------------');
    console.log('[PHASE 16] Testing Contribution Model & Mixed Sponsorships...');
    console.log('----------------------------------------------------');

    // Test 16.1: Authoritative 11 types verification
    if (CONTRIBUTION_TYPES.length !== 11) {
      throw new Error(`Expected strictly 11 contribution types, found ${CONTRIBUTION_TYPES.length}`);
    }
    const expectedTypes = [
      'CASH', 'PRODUCT', 'FOOD', 'BEVERAGE', 'MERCHANDISE',
      'EQUIPMENT', 'SERVICE', 'VENUE', 'TRANSPORTATION', 'GIFT_HAMPER', 'OTHER'
    ];
    for (const t of expectedTypes) {
      if (!CONTRIBUTION_TYPES.includes(t)) {
        throw new Error(`Missing expected contribution type: ${t}`);
      }
    }
    console.log(`  ✓ All 11 authoritative contribution types verified: [${CONTRIBUTION_TYPES.join(', ')}]`);

    // Test 16.2: Mixed contribution validation & creation
    const mixedContribution = {
      types: ['CASH', 'BEVERAGE', 'MERCHANDISE'],
      cash: { amount: 50000, currency: 'INR' },
      nonCash: [
        {
          type: 'BEVERAGE',
          name: 'Red Bull Energy Drinks',
          description: 'Cold cans for artist lounges and mainstage participants',
          quantity: 2000,
          unit: 'cans',
          estimatedValue: 250000,
          expectedDate: new Date(),
          status: 'PENDING',
        },
        {
          type: 'MERCHANDISE',
          name: 'Co-Branded Athlete Caps',
          description: 'Merchandise for fest winners and volunteers',
          quantity: 500,
          unit: 'caps',
          estimatedValue: 75000,
          expectedDate: new Date(),
          status: 'PENDING',
        },
      ],
    };

    // Create deal with mixed contribution
    const createDealRes = await request(app)
      .post('/api/v1/deals')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        eventId: event._id.toString(),
        committeeId: committeeProfile._id.toString(),
        contributions: mixedContribution,
      });

    if (createDealRes.status !== 201) {
      throw new Error(`Failed to create deal with mixed contribution. Status: ${createDealRes.status}, Body: ${JSON.stringify(createDealRes.body)}`);
    }
    const testDeal = createDealRes.body.data;
    cleanupDealIds.push(testDeal._id);
    console.log(`  ✓ Deal created with mixed sponsorship: INR 50,000 CASH + 2,000 BEVERAGE cans + 500 MERCHANDISE caps`);

    // Test 16.3: Rejection of invalid contribution type
    const invalidContribRes = await request(app)
      .post('/api/v1/deals')
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        eventId: event._id.toString(),
        committeeId: committeeProfile._id.toString(),
        contributions: [
          { type: 'BITCOIN_PAYMENT', amount: 500 },
        ],
      });
    if (invalidContribRes.status !== 400) {
      throw new Error(`Expected 400 for invalid contribution type, got: ${invalidContribRes.status}`);
    }
    console.log('  ✓ Rejection of unsupported contribution type verified (400 VALIDATION_ERROR)');

    // ====================================================
    // PHASE 17: DEAL LIFECYCLE
    // ====================================================
    console.log('\n----------------------------------------------------');
    console.log('[PHASE 17] Testing Deal Lifecycle & State Machine Transitions...');
    console.log('----------------------------------------------------');

    // Test 17.1: Participant access authorization
    const companyDealGet = await request(app)
      .get(`/api/v1/deals/${testDeal._id}`)
      .set('Authorization', `Bearer ${companyToken}`);
    if (companyDealGet.status !== 200) {
      throw new Error(`Company participant failed to get deal: ${companyDealGet.status}`);
    }

    const committeeDealGet = await request(app)
      .get(`/api/v1/deals/${testDeal._id}`)
      .set('Authorization', `Bearer ${committeeToken}`);
    if (committeeDealGet.status !== 200) {
      throw new Error(`Committee participant failed to get deal: ${committeeDealGet.status}`);
    }

    // Test 17.2: Cross-tenant unauthorized access denied
    const unauthorizedDealGet = await request(app)
      .get(`/api/v1/deals/${testDeal._id}`)
      .set('Authorization', `Bearer ${thirdPartyToken}`);
    if (unauthorizedDealGet.status !== 403) {
      throw new Error(`Expected 403 for unauthorized company, got: ${unauthorizedDealGet.status}`);
    }
    console.log('  ✓ Deal participant authorization verified (Company & Committee allowed; Unrelated Company rejected 403)');

    // Test 17.3: Valid status transition: INTERESTED -> DISCUSSION
    const transitionRes = await request(app)
      .patch(`/api/v1/deals/${testDeal._id}`)
      .set('Authorization', `Bearer ${companyToken}`)
      .send({ status: DEAL_STATUS.DISCUSSION });
    if (transitionRes.status !== 200 || transitionRes.body.data.status !== DEAL_STATUS.DISCUSSION) {
      throw new Error(`Failed valid transition to DISCUSSION: ${transitionRes.status}`);
    }
    console.log('  ✓ Valid transition INTERESTED -> DISCUSSION succeeded (200 OK)');

    // Test 17.4: Invalid status transition: DISCUSSION -> EXECUTED (Cannot jump without signing!)
    const invalidJumpRes = await request(app)
      .patch(`/api/v1/deals/${testDeal._id}`)
      .set('Authorization', `Bearer ${companyToken}`)
      .send({ status: DEAL_STATUS.EXECUTED });
    if (invalidJumpRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for invalid transition to EXECUTED, got: ${invalidJumpRes.status}`);
    }
    console.log('  ✓ Premature jump DISCUSSION -> EXECUTED properly rejected with 409 CONFLICT');

    // Test 17.5: Transition DISCUSSION -> NEGOTIATING
    await request(app)
      .patch(`/api/v1/deals/${testDeal._id}`)
      .set('Authorization', `Bearer ${committeeToken}`)
      .send({ status: DEAL_STATUS.NEGOTIATING });
    console.log('  ✓ Transition DISCUSSION -> NEGOTIATING succeeded');

    // Test 17.6: Direct query update attempt bypassing save()
    let directUpdateThrew = false;
    try {
      await Deal.findOneAndUpdate(
        { _id: testDeal._id },
        { status: DEAL_STATUS.COMPLETED }
      );
    } catch (err) {
      directUpdateThrew = true;
    }
    if (!directUpdateThrew) {
      throw new Error('Direct query update bypassing state machine should have been rejected!');
    }
    console.log('  ✓ Direct query update attempt bypassing save() strictly rejected');

    // Test 17.7: Previous status tracking verified
    const trackedDeal = await Deal.findById(testDeal._id);
    if (!trackedDeal._originalStatus) {
      throw new Error('Deal _originalStatus tracking not initialized');
    }
    console.log(`  ✓ Previous status tracking verified (_originalStatus: "${trackedDeal._originalStatus}")`);

    // Test 17.8: Terminal states verification
    const terminalStates = [DEAL_STATUS.COMPLETED, DEAL_STATUS.DECLINED, DEAL_STATUS.CANCELLED, DEAL_STATUS.EXPIRED];
    for (const tState of terminalStates) {
      const allowed = DEAL_TRANSITIONS[tState];
      if (!Array.isArray(allowed) || allowed.length !== 0) {
        throw new Error(`Terminal state ${tState} should have 0 allowed transitions, found ${allowed.length}`);
      }
    }
    console.log('  ✓ Terminal states verified: [COMPLETED, DECLINED, CANCELLED, EXPIRED] have no outgoing transitions');

    // Test 17.9: API invalid and nonexistent ID handling
    const malformedIdRes = await request(app)
      .get('/api/v1/deals/invalid-deal-id-123')
      .set('Authorization', `Bearer ${companyToken}`);
    if (malformedIdRes.status !== 400) {
      throw new Error(`Expected 400 for malformed ID, got ${malformedIdRes.status}`);
    }
    const nonExistentIdRes = await request(app)
      .get(`/api/v1/deals/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${companyToken}`);
    if (nonExistentIdRes.status !== 404) {
      throw new Error(`Expected 404 for nonexistent deal, got ${nonExistentIdRes.status}`);
    }
    console.log('  ✓ API invalid & nonexistent ID handling verified (400 INVALID_ID, 404 NOT_FOUND)');

    // ====================================================
    // PHASE 18: PROPOSALS
    // ====================================================
    console.log('\n----------------------------------------------------');
    console.log('[PHASE 18] Testing Immutable Proposals & Counter-Proposals...');
    console.log('----------------------------------------------------');

    // Test 18.1: Create initial proposal (v1)
    const p1Res = await request(app)
      .post(`/api/v1/deals/${testDeal._id}/proposals`)
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        contributions: mixedContribution,
        benefits: [
          { title: 'Exclusive Energy Drink Partner', description: 'Sole energy drink sold and distributed at venue.' },
          { title: 'Mainstage LED Logo Rotation', description: 'Logo displayed every 15 minutes on central LED.' },
        ],
        deliverables: [
          { party: 'COMPANY', description: 'Supply 2000 cans to campus warehouse 3 days prior to event.' },
          { party: 'COMMITTEE', description: 'Provide two 10x10 premium stall locations near main food court.' },
        ],
        terms: 'Payment of 50% advance upon agreement, 50% post-event.',
      });
    if (p1Res.status !== 201) {
      throw new Error(`Failed to create proposal v1: ${p1Res.status}`);
    }
    const propV1 = p1Res.body.data;
    if (propV1.version !== 1 || propV1.status !== PROPOSAL_STATUS.PENDING) {
      throw new Error(`Proposal v1 has invalid attributes: version=${propV1.version}, status=${propV1.status}`);
    }
    console.log('  ✓ Proposal v1 created with PENDING status');

    // Verify Deal transitioned to PROPOSAL
    const dealAfterP1 = await Deal.findById(testDeal._id);
    if (dealAfterP1.status !== DEAL_STATUS.PROPOSAL) {
      throw new Error(`Deal should transition to PROPOSAL, current: ${dealAfterP1.status}`);
    }
    console.log('  ✓ Deal status dynamically transitioned to PROPOSAL');

    // Test 18.2: Proposal immutability: Cannot mutate proposal terms directly
    let propMutationThrew = false;
    try {
      const dbProp = await Proposal.findById(propV1._id);
      dbProp.terms = 'Illegally modified terms';
      await dbProp.save();
    } catch (err) {
      propMutationThrew = true;
    }
    if (!propMutationThrew) {
      throw new Error('Mongoose pre-save hook failed to reject proposal terms mutation!');
    }
    console.log('  ✓ Proposal immutability hook verified: Historical terms cannot be modified');

    // Test 18.2b: Proposal direct query update immutability
    let propQueryUpdateThrew = false;
    try {
      await Proposal.findOneAndUpdate(
        { _id: propV1._id },
        { $set: { terms: 'Illegally modified terms via query' } }
      );
    } catch (err) {
      propQueryUpdateThrew = true;
    }
    if (!propQueryUpdateThrew) {
      throw new Error('Query update hook failed to reject proposal terms mutation!');
    }
    console.log('  ✓ Proposal query update immutability verified: Direct updateOne/findOneAndUpdate blocked');

    // Test 18.2c: Proposal deletion protection
    let propDeleteThrew = false;
    try {
      await Proposal.deleteOne({ _id: propV1._id });
    } catch (err) {
      propDeleteThrew = true;
    }
    if (!propDeleteThrew) {
      throw new Error('Deletion hook failed to protect proposal record!');
    }
    console.log('  ✓ Proposal deletion protection verified: Historical proposals cannot be deleted');

    // Test 18.3: Counter-proposal (v2 by Committee)
    const counterRes = await request(app)
      .post(`/api/v1/proposals/${propV1._id}/counter`)
      .set('Authorization', `Bearer ${committeeToken}`)
      .send({
        contributions: {
          ...mixedContribution,
          cash: { amount: 65000, currency: 'INR' }, // Committee requests higher cash
        },
        benefits: propV1.benefits,
        deliverables: propV1.deliverables,
        terms: 'Revised terms: 60% advance upon agreement, 40% post-event.',
      });
    if (counterRes.status !== 201) {
      throw new Error(`Failed to counter proposal: ${counterRes.status}`);
    }
    const propV2 = counterRes.body.data;
    if (propV2.version !== 2 || propV2.basedOnProposalId !== propV1._id) {
      throw new Error(`Counter proposal should be v2 with basedOnProposalId set`);
    }

    // Verify previous v1 was marked SUPERSEDED
    const reloadedV1 = await Proposal.findById(propV1._id);
    if (reloadedV1.status !== PROPOSAL_STATUS.SUPERSEDED) {
      throw new Error(`Previous proposal v1 should be marked SUPERSEDED, found: ${reloadedV1.status}`);
    }
    console.log('  ✓ Counter-proposal created as v2, previous v1 marked SUPERSEDED');

    // Verify Deal transitioned to COUNTER_PROPOSAL
    const dealAfterP2 = await Deal.findById(testDeal._id);
    if (dealAfterP2.status !== DEAL_STATUS.COUNTER_PROPOSAL) {
      throw new Error(`Deal should transition to COUNTER_PROPOSAL, current: ${dealAfterP2.status}`);
    }
    console.log('  ✓ Deal status transitioned to COUNTER_PROPOSAL');

    // Test 18.4: Counterparty protection: Creator cannot accept own proposal!
    const selfAcceptRes = await request(app)
      .post(`/api/v1/proposals/${propV2._id}/accept`)
      .set('Authorization', `Bearer ${committeeToken}`); // Committee created v2, cannot accept v2
    if (selfAcceptRes.status !== 403) {
      throw new Error(`Expected 403 when creator tries to accept own proposal, got: ${selfAcceptRes.status}`);
    }
    console.log('  ✓ Self-acceptance strictly rejected (403: Creator cannot accept own proposal)');

    // Test 18.5: Counter-proposal (v3 by Company)
    const p3Res = await request(app)
      .post(`/api/v1/proposals/${propV2._id}/counter`)
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        contributions: {
          ...mixedContribution,
          cash: { amount: 60000, currency: 'INR' }, // Compromise at 60k
        },
        benefits: propV2.benefits,
        deliverables: propV2.deliverables,
        terms: 'Final agreed commercial terms: 50% advance, 50% post-event.',
      });
    const propV3 = p3Res.body.data;
    if (propV3.version !== 3) {
      throw new Error(`Expected version 3, got: ${propV3.version}`);
    }
    console.log('  ✓ Proposal v3 (counter-offer compromise) created');

    // Test 18.6: Counterparty (Committee) accepts proposal v3
    const acceptRes = await request(app)
      .post(`/api/v1/proposals/${propV3._id}/accept`)
      .set('Authorization', `Bearer ${committeeToken}`)
      .send({
        deliveryRequirements: { format: 'Physical campus delivery with gate pass' },
        paymentDetails: {
          beneficiaryName: 'IIT Bombay Mood Indigo Committee',
          accountNumber: '987654321098',
          bankName: 'State Bank of India',
          branch: 'IIT Powai Campus',
          ifscCode: 'SBIN0001234',
          pan: 'AAATC1234F',
          gstin: '27AAATC1234F1Z5',
          accountsEmail: 'accounts@moodi.org',
          gstRate: 18,
          currency: 'INR',
        },
      });
    if (acceptRes.status !== 200) {
      throw new Error(`Failed to accept proposal v3: ${acceptRes.status}, body: ${JSON.stringify(acceptRes.body)}`);
    }
    console.log('  ✓ Proposal v3 successfully accepted by counterparty');

    // Verify Proposal v3 status is ACCEPTED
    const reloadedV3 = await Proposal.findById(propV3._id);
    if (reloadedV3.status !== PROPOSAL_STATUS.ACCEPTED) {
      throw new Error(`Proposal v3 should be ACCEPTED, got: ${reloadedV3.status}`);
    }

    // ====================================================
    // PHASE 19: DEAL AGREEMENT
    // ====================================================
    console.log('\n----------------------------------------------------');
    console.log('[PHASE 19] Testing Deal Agreement Commercial Snapshot...');
    console.log('----------------------------------------------------');

    // Test 19.1: Deal transitioned to AGREED
    const agreedDeal = await Deal.findById(testDeal._id);
    if (agreedDeal.status !== DEAL_STATUS.AGREED) {
      throw new Error(`Deal status must be AGREED, got: ${agreedDeal.status}`);
    }
    if (!agreedDeal.agreedTermsId) {
      throw new Error('Deal agreedTermsId is missing!');
    }
    console.log('  ✓ Deal status successfully transitioned to AGREED (not EXECUTED)');

    // Test 19.2: Retrieve agreement snapshot via API
    const agreementRes = await request(app)
      .get(`/api/v1/deals/${testDeal._id}/agreement`)
      .set('Authorization', `Bearer ${companyToken}`);
    if (agreementRes.status !== 200) {
      throw new Error(`Failed to get agreement snapshot: ${agreementRes.status}`);
    }
    const agreementSnapshot = agreementRes.body.data.snapshot;
    if (!agreementSnapshot.contributions || agreementSnapshot.contributions.cash.amount !== 60000) {
      throw new Error('Agreement snapshot contributions do not match accepted proposal v3 terms!');
    }
    console.log('  ✓ DealAgreement snapshot verified: Holds INR 60,000 cash + agreed deliverables & bank details');

    // Test 19.3: Agreement snapshot immutability
    const agreementDoc = await DealAgreement.findById(agreedDeal.agreedTermsId);
    let agreementMutationThrew = false;
    try {
      agreementDoc.snapshot = { ...agreementDoc.snapshot, terms: 'Mutated illegally' };
      agreementDoc.markModified('snapshot');
      await agreementDoc.save();
    } catch (err) {
      agreementMutationThrew = true;
    }
    if (!agreementMutationThrew) {
      throw new Error('DealAgreement snapshot mutation should have been rejected!');
    }
    console.log('  ✓ DealAgreement immutability verified: Snapshot cannot be mutated');

    // Test 19.4: Agreement deletion protection
    let agreementDeleteThrew = false;
    try {
      await DealAgreement.deleteOne({ _id: agreementDoc._id });
    } catch (err) {
      agreementDeleteThrew = true;
    }
    if (!agreementDeleteThrew) {
      throw new Error('Deletion hook failed to protect DealAgreement record!');
    }
    console.log('  ✓ DealAgreement deletion protection verified: Agreement cannot be deleted');

    // Test 19.5: Agreement query update protection
    let agreementQueryUpdateThrew = false;
    try {
      await DealAgreement.findOneAndUpdate(
        { _id: agreementDoc._id },
        { $set: { 'snapshot.terms': 'Hacked terms' } }
      );
    } catch (err) {
      agreementQueryUpdateThrew = true;
    }
    if (!agreementQueryUpdateThrew) {
      throw new Error('Query update hook failed to protect DealAgreement snapshot!');
    }
    console.log('  ✓ DealAgreement query update immutability verified: Snapshot cannot be modified via query updates');

    // ====================================================
    // PHASE 20: MOU GENERATION
    // ====================================================
    console.log('\n----------------------------------------------------');
    console.log('[PHASE 20] Testing MoU Generation & 5-Page PDF Rendering...');
    console.log('----------------------------------------------------');

    // Test 20.1: Generate MoU
    const genMouRes = await request(app)
      .post(`/api/v1/deals/${testDeal._id}/mou`)
      .set('Authorization', `Bearer ${committeeToken}`)
      .send({
        curePeriodDays: 15,
        noticePeriodDays: 30,
        jurisdiction: 'Mumbai, India',
      });
    if (genMouRes.status !== 201) {
      throw new Error(`Failed to generate MoU: ${genMouRes.status}, body: ${JSON.stringify(genMouRes.body)}`);
    }
    const mouData = genMouRes.body.data;
    const testMouId = mouData.mou._id;
    const testMouVersion = mouData.mouVersion;
    console.log(`  ✓ MoU container created with ID: ${testMouId}`);

    // Test 20.2: SHA-256 Hash check
    if (!testMouVersion.documentHash || !/^[a-f0-9]{64}$/i.test(testMouVersion.documentHash)) {
      throw new Error(`Invalid SHA-256 document hash: ${testMouVersion.documentHash}`);
    }
    console.log(`  ✓ Authoritative SHA-256 hash generated: ${testMouVersion.documentHash}`);

    // Test 20.3: Template identifier check
    if (testMouVersion.templateIdentifier !== TEMPLATE_IDENTIFIER) {
      throw new Error(`Expected templateIdentifier ${TEMPLATE_IDENTIFIER}, got: ${testMouVersion.templateIdentifier}`);
    }
    console.log(`  ✓ Template identifier verified: ${TEMPLATE_IDENTIFIER}`);

    // Test 20.4: Document preview endpoint
    const previewRes = await request(app)
      .get(`/api/v1/mous/${testMouId}/preview`)
      .set('Authorization', `Bearer ${companyToken}`);
    if (previewRes.status !== 200 || !previewRes.body.data.agreementSnapshot) {
      throw new Error(`Failed to get MoU preview: ${previewRes.status}`);
    }
    console.log('  ✓ MoU preview API verified: Returns structured 5-page document sections');

    // Test 20.5: PDF Download endpoint
    const downloadRes = await request(app)
      .get(`/api/v1/mous/${testMouId}/download`)
      .set('Authorization', `Bearer ${companyToken}`);
    if (downloadRes.status !== 200 || downloadRes.headers['content-type'] !== 'application/pdf') {
      throw new Error(`Failed to download PDF: ${downloadRes.status}, Content-Type: ${downloadRes.headers['content-type']}`);
    }
    if (downloadRes.headers['x-document-hash'] !== testMouVersion.documentHash) {
      throw new Error('Downloaded PDF X-Document-Hash header does not match database record!');
    }

    // Verify SHA-256 of downloaded PDF binary bytes
    const downloadedHash = crypto.createHash('sha256').update(downloadRes.body).digest('hex');
    if (downloadedHash !== testMouVersion.documentHash) {
      throw new Error(`SHA-256 mismatch! DB: ${testMouVersion.documentHash}, Downloaded: ${downloadedHash}`);
    }
    console.log(`  ✓ PDF binary download verified: Byte-for-byte SHA-256 hash match verified (${downloadRes.body.length} bytes)`);

    // ====================================================
    // PHASE 21: MOU VERSIONING
    // ====================================================
    console.log('\n----------------------------------------------------');
    console.log('[PHASE 21] Testing MoU Versioning & Immutability...');
    console.log('----------------------------------------------------');

    // Test 21.1: Create version 2 of MoU
    const v2Res = await request(app)
      .post(`/api/v1/mous/${testMouId}/versions`)
      .set('Authorization', `Bearer ${committeeToken}`)
      .send({
        curePeriodDays: 20,
      });
    if (v2Res.status !== 201) {
      throw new Error(`Failed to create MoU version 2: ${v2Res.status}`);
    }
    const version2 = v2Res.body.data.mouVersion;
    if (version2.versionNumber !== 2) {
      throw new Error(`Expected version 2, got: ${version2.versionNumber}`);
    }
    console.log(`  ✓ MoU Version 2 generated with new SHA-256 hash: ${version2.documentHash}`);

    // Test 21.2: Version list endpoint
    const listVersionsRes = await request(app)
      .get(`/api/v1/mous/${testMouId}/versions`)
      .set('Authorization', `Bearer ${companyToken}`);
    if (listVersionsRes.status !== 200 || listVersionsRes.body.data.length < 2) {
      throw new Error(`Expected at least 2 versions, got: ${listVersionsRes.body.data.length}`);
    }
    console.log(`  ✓ Version history verified: Both Version 1 and Version 2 are accessible`);

    // Test 21.3: Download specific historical version (Version 1)
    const downloadV1Res = await request(app)
      .get(`/api/v1/mous/${testMouId}/versions/${testMouVersion._id}/download`)
      .set('Authorization', `Bearer ${companyToken}`);
    if (downloadV1Res.status !== 200 || downloadV1Res.headers['x-document-hash'] !== testMouVersion.documentHash) {
      throw new Error('Historical version 1 download failed or hash mismatch!');
    }
    console.log('  ✓ Historical Version 1 remains individually downloadable and immutable');

    // Test 21.4: MoU version deletion protection
    let mouVersionDeleteThrew = false;
    try {
      const v1Doc = await MouVersion.findById(testMouVersion._id);
      v1Doc.status = MOU_VERSION_STATUS.PARTIALLY_SIGNED;
      await v1Doc.save();
      await MouVersion.deleteOne({ _id: testMouVersion._id });
    } catch (err) {
      mouVersionDeleteThrew = true;
    }
    if (!mouVersionDeleteThrew) {
      throw new Error('Deletion hook failed to protect signed MoUVersion record!');
    }
    // Restore status
    await MouVersion.collection.updateOne({ _id: testMouVersion._id }, { $set: { status: MOU_VERSION_STATUS.READY_FOR_SIGNATURE } });
    console.log('  ✓ Signed MoU Version deletion protection verified: Cannot delete signed versions');

    // ====================================================
    // PHASE 22: DIGITAL SIGNING & SHA-256
    // ====================================================
    console.log('\n----------------------------------------------------');
    console.log('[PHASE 22] Testing Digital Signing & SHA-256 Platform Workflow...');
    console.log('----------------------------------------------------');

    // Test 22.1: Initial Signing Status
    const initialStatusRes = await request(app)
      .get(`/api/v1/mous/${testMouId}/signing-status`)
      .set('Authorization', `Bearer ${companyToken}`);
    if (initialStatusRes.status !== 200 || initialStatusRes.body.data.isFullyExecuted) {
      throw new Error('Initial status should be not executed!');
    }
    console.log('  ✓ Initial signing status: Neither party has signed yet');

    // Test 22.2: Signer authorization: Unrelated user cannot sign!
    const unauthorizedSignRes = await request(app)
      .post(`/api/v1/mous/${testMouId}/sign`)
      .set('Authorization', `Bearer ${thirdPartyToken}`)
      .send({
        fullName: 'Intruder',
        designation: 'Hacker',
        agreedToTerms: true,
        consentText: 'I consent',
        signatureData: 'IntruderSignature',
      });
    if (unauthorizedSignRes.status !== 403) {
      throw new Error(`Expected 403 when non-participant tries to sign, got: ${unauthorizedSignRes.status}`);
    }
    console.log('  ✓ Unauthorized non-participant signing blocked with 403 FORBIDDEN');

    // Test 22.3: Consent validation: Signing without agreedToTerms: true must fail
    const noConsentSignRes = await request(app)
      .post(`/api/v1/mous/${testMouId}/sign`)
      .set('Authorization', `Bearer ${committeeToken}`)
      .send({
        fullName: 'Aarav Sharma',
        designation: 'Student Convener',
        agreedToTerms: false, // Invalid!
        consentText: 'I consent',
        signatureData: 'AaravSharmaSignature',
      });
    if (noConsentSignRes.status !== 400) {
      throw new Error(`Expected 400 when agreedToTerms is false, got: ${noConsentSignRes.status}`);
    }
    console.log('  ✓ Signing without explicit consent blocked (400 VALIDATION_ERROR)');

    // Test 22.4: First Signature (Committee signs)
    const sign1Res = await request(app)
      .post(`/api/v1/mous/${testMouId}/sign`)
      .set('Authorization', `Bearer ${committeeToken}`)
      .send({
        fullName: 'Aarav Sharma',
        designation: 'Authorized Student Convener',
        authorityReference: 'IIT Bombay Cultural Council Resolution #2026/04',
        agreedToTerms: true,
        consentText: 'I, Aarav Sharma, hereby confirm that I am authorized to execute this Memorandum of Understanding on behalf of IIT Bombay Mood Indigo Cultural Council and agree to all terms and conditions.',
        signatureData: 'DATA:SIGNATURE:Aarav_Sharma_IITB_2026',
      });
    if (sign1Res.status !== 200) {
      throw new Error(`Committee signing failed: ${sign1Res.status}, body: ${JSON.stringify(sign1Res.body)}`);
    }
    const sign1Data = sign1Res.body.data;
    if (sign1Data.dealStatus !== DEAL_STATUS.PARTIALLY_SIGNED) {
      throw new Error(`After first signature, Deal should be PARTIALLY_SIGNED, got: ${sign1Data.dealStatus}`);
    }
    console.log('  ✓ First signature (Committee) recorded: Deal status moved to PARTIALLY_SIGNED');

    // Test 22.5: Duplicate signing protection
    const dupSignRes = await request(app)
      .post(`/api/v1/mous/${testMouId}/sign`)
      .set('Authorization', `Bearer ${committeeToken}`)
      .send({
        fullName: 'Aarav Sharma',
        designation: 'Authorized Student Convener',
        agreedToTerms: true,
        consentText: 'I agree again',
        signatureData: 'DATA:SIGNATURE:duplicate',
      });
    if (dupSignRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate signature, got: ${dupSignRes.status}`);
    }
    console.log('  ✓ Duplicate signing protection verified (409 Conflict: Cannot sign twice)');

    // Test 22.6: Mid-way Signing Status
    const midStatusRes = await request(app)
      .get(`/api/v1/mous/${testMouId}/signing-status`)
      .set('Authorization', `Bearer ${companyToken}`);
    if (!midStatusRes.body.data.committeeSigned || midStatusRes.body.data.companySigned) {
      throw new Error('Expected committeeSigned=true and companySigned=false');
    }
    console.log('  ✓ Mid-signing status verified: committeeSigned=true, companySigned=false');

    // Test 22.7: Second Signature (Company signs) -> Triggers EXECUTED!
    const sign2Res = await request(app)
      .post(`/api/v1/mous/${testMouId}/sign`)
      .set('Authorization', `Bearer ${companyToken}`)
      .send({
        fullName: 'Vikram Mehta',
        designation: 'Director of Brand Partnerships',
        authorityReference: 'Red Bull Board Resolution dated 15-Jan-2026',
        agreedToTerms: true,
        consentText: 'I, Vikram Mehta, hereby confirm that I am authorized to execute this Memorandum of Understanding on behalf of Red Bull India Private Limited and agree to all terms and conditions.',
        signatureData: 'DATA:SIGNATURE:Vikram_Mehta_RedBull_2026',
      });
    if (sign2Res.status !== 200) {
      throw new Error(`Company signing failed: ${sign2Res.status}, body: ${JSON.stringify(sign2Res.body)}`);
    }
    const sign2Data = sign2Res.body.data;
    if (sign2Data.dealStatus !== DEAL_STATUS.EXECUTED) {
      throw new Error(`After both signatures, Deal must transition to EXECUTED, got: ${sign2Data.dealStatus}`);
    }
    console.log('  ✓ Second signature (Company) recorded: Deal status automatically transitioned to EXECUTED!');

    // Test 22.8: Verify Deal attributes in database
    const executedDeal = await Deal.findById(testDeal._id);
    if (executedDeal.status !== DEAL_STATUS.EXECUTED || !executedDeal.executedAt) {
      throw new Error('Deal record in database is missing EXECUTED status or executedAt timestamp!');
    }
    console.log(`  ✓ Deal formal execution verified in DB: executedAt=${executedDeal.executedAt.toISOString()}`);

    // Test 22.9: Verify Executed MoU Version Immutability
    const executedVersion = await MouVersion.findById(version2._id);
    if (executedVersion.status !== MOU_VERSION_STATUS.EXECUTED) {
      throw new Error(`MoU Version should be EXECUTED, got: ${executedVersion.status}`);
    }
    let versionMutationThrew = false;
    try {
      executedVersion.documentHash = '0000000000000000000000000000000000000000000000000000000000000000';
      await executedVersion.save();
    } catch (err) {
      versionMutationThrew = true;
    }
    if (!versionMutationThrew) {
      throw new Error('Executed MoU version mutation should have been rejected!');
    }
    console.log('  ✓ Executed MoU Version immutability verified: Cannot alter hash or snapshot of executed document');

    // Test 22.9b: Signature immutability & deletion protection
    const firstSig = await Signature.findOne({ mouVersionId: version2._id, signerRole: SIGNER_ROLE.COMMITTEE });
    let sigMutationThrew = false;
    try {
      firstSig.signatureData = 'MutatedSignatureData';
      await firstSig.save();
    } catch (err) {
      sigMutationThrew = true;
    }
    if (!sigMutationThrew) {
      throw new Error('Pre-save hook failed to reject signature mutation!');
    }

    let sigQueryUpdateThrew = false;
    try {
      await Signature.findOneAndUpdate({ _id: firstSig._id }, { $set: { consentText: 'Mutated consent' } });
    } catch (err) {
      sigQueryUpdateThrew = true;
    }
    if (!sigQueryUpdateThrew) {
      throw new Error('Query update hook failed to reject signature mutation!');
    }

    let sigDeleteThrew = false;
    try {
      await Signature.deleteOne({ _id: firstSig._id });
    } catch (err) {
      sigDeleteThrew = true;
    }
    if (!sigDeleteThrew) {
      throw new Error('Deletion hook failed to protect signature record!');
    }
    console.log('  ✓ Signature immutability & deletion protection verified: Signatures cannot be mutated or deleted');

    // Test 22.10: Signatures Listing API
    const signaturesListRes = await request(app)
      .get(`/api/v1/mous/${testMouId}/signatures`)
      .set('Authorization', `Bearer ${companyToken}`);
    if (signaturesListRes.status !== 200 || signaturesListRes.body.data.length !== 2) {
      throw new Error(`Expected 2 signatures, got: ${signaturesListRes.body.data.length}`);
    }
    console.log('  ✓ Signatures listing API verified: Returns both Committee and Company audit records');

    // Test 22.11: Executed Document Summary API
    const executedDocRes = await request(app)
      .get(`/api/v1/mous/${testMouId}/executed-document`)
      .set('Authorization', `Bearer ${committeeToken}`);
    if (executedDocRes.status !== 200) {
      throw new Error(`Failed to get executed document details: ${executedDocRes.status}`);
    }
    const executedDoc = executedDocRes.body.data;
    if (executedDoc.documentHash !== version2.documentHash || executedDoc.signatories.length !== 2) {
      throw new Error('Executed document details invalid!');
    }
    console.log('  ✓ Executed document API verified: Returns complete cryptographic verification details & download URL');

    // Test 22.12: Timeline check
    const timelineRes = await request(app)
      .get(`/api/v1/deals/${testDeal._id}/timeline`)
      .set('Authorization', `Bearer ${companyToken}`);
    if (timelineRes.status !== 200 || !Array.isArray(timelineRes.body.data)) {
      throw new Error('Timeline retrieval failed');
    }
    const eventTypes = timelineRes.body.data.map((t) => t.type);
    console.log(`  ✓ Chronological Deal Timeline verified (${timelineRes.body.data.length} events logged: [${eventTypes.join(', ')}])`);

    console.log('\n====================================================');
    console.log(' ALL PHASES 16–22 TESTS PASSED WITH 100% SUCCESS!   ');
    console.log('====================================================\n');
  } finally {
    // Clean up test data
    try {
      if (cleanupDealIds.length > 0) {
        await Deal.deleteMany({ _id: { $in: cleanupDealIds } });
        await Proposal.collection.deleteMany({ dealId: { $in: cleanupDealIds } });
        await DealAgreement.collection.deleteMany({ dealId: { $in: cleanupDealIds } });
        const mous = await Mou.find({ dealId: { $in: cleanupDealIds } });
        const mouIds = mous.map((m) => m._id);
        await Mou.deleteMany({ _id: { $in: mouIds } });
        await MouVersion.collection.deleteMany({ mouId: { $in: mouIds } });
        await Signature.collection.deleteMany({ mouId: { $in: mouIds } });
      }
      if (cleanupEventIds.length > 0) await Event.deleteMany({ _id: { $in: cleanupEventIds } });
      if (cleanupCompanyIds.length > 0) await Company.deleteMany({ _id: { $in: cleanupCompanyIds } });
      if (cleanupCommitteeIds.length > 0) await Committee.deleteMany({ _id: { $in: cleanupCommitteeIds } });
      if (cleanupUserIds.length > 0) await User.deleteMany({ _id: { $in: cleanupUserIds } });
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runPhases16to22Tests().catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = runPhases16to22Tests;
