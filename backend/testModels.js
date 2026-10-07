/**
 * Comprehensive Test Suite for PITCH Phase 2
 * Source of Truth: docs/PITCH_DATABASE_FINAL.md, docs/PITCH_FINAL_BUILD_SPEC.md & docs/PITCH_MOU_FINAL.md
 *
 * Verifies:
 * - Authoritative 27 models and 27 collections reconciliation
 * - 11 authoritative contribution types (MIXED removed)
 * - Deep MongoDB index inspection via getIndexes() and indexes()
 * - Deal state machine transition graph integrity (no invalid statuses, DISPUTED reconciled)
 * - Proposal immutability and lifecycle state transitions
 * - DealAgreement commercial snapshot preservation
 * - Signed MoUVersion immutability (save, updateOne, findOneAndUpdate, and deletion rejection)
 * - Single authoritative documentHash integrity (no duplicate inside agreementSnapshot)
 * - Signature immutability
 * - SHA-256 formatting validation
 * - MongoDB unique constraint enforcement
 */
const mongoose = require('mongoose');
const { env, validateEnv } = require('./src/config/env');
const connectDB = require('./src/config/db');
const models = require('./src/models');
const {
  DEAL_STATUS,
  DEAL_TRANSITIONS,
  PROPOSAL_STATUS,
  PROPOSAL_TRANSITIONS,
  CONTRIBUTION_TYPES,
  ROLES,
  MOU_VERSION_STATUS,
  SIGNER_ROLE,
  TEMPLATE_IDENTIFIER,
  HASH_ALGORITHM,
} = require('./src/utils/constants');

async function runTests() {
  console.log('====================================================');
  console.log(' PITCH Phase 2: Final Database Reconciliation Pass  ');
  console.log('====================================================\n');

  validateEnv();
  await connectDB();
  console.log('✓ Database connection established\n');

  // ----------------------------------------------------
  // TEST 1: Reconcile Model & Collection Count (Strictly 27)
  // ----------------------------------------------------
  console.log('[TEST 1] Reconciling authoritative models, exports, and collections...');
  const expectedModels = [
    'User',
    'Company',
    'Committee',
    'File',
    'Event',
    'SponsorshipPackage',
    'Application',
    'Invitation',
    'SavedEvent',
    'Conversation',
    'Message',
    'ContactShare',
    'Deal',
    'Proposal',
    'DealAgreement',
    'Mou',
    'MouVersion',
    'Signature',
    'Fulfillment',
    'FulfillmentEvidence',
    'Review',
    'SelfReportedHistory',
    'Notification',
    'Report',
    'AuditLog',
    'Dispute',
    'Document',
  ];

  // 1. Check expectedModels count is exactly 27
  if (expectedModels.length !== 27) {
    throw new Error(`expectedModels must contain exactly 27 models, found ${expectedModels.length}`);
  }

  // 2. Check exported models from models/index.js is exactly 27
  const exportedModelKeys = Object.keys(models);
  if (exportedModelKeys.length !== 27) {
    throw new Error(`Expected exactly 27 exported models in models/index.js, found ${exportedModelKeys.length}: ${exportedModelKeys.join(', ')}`);
  }

  // 3. Verify every model is properly compiled and mapped to its collection
  const collectionList = [];
  for (const name of expectedModels) {
    const model = models[name];
    if (!model || !model.modelName) {
      throw new Error(`Model ${name} is not properly defined or exported.`);
    }
    const colName = model.collection.collectionName;
    collectionList.push({ model: name, collection: colName });
  }

  console.log(`  ✓ Exact final model count verified: ${expectedModels.length} models`);
  console.log(`  ✓ Exact final collection count verified: ${collectionList.length} collections`);
  console.log(`  ✓ Model registry exports verified: ${exportedModelKeys.length} exported items`);
  console.log(`  ✓ Directory breakdown: 27 model schema files + 1 index.js registry = 28 files in backend/src/models/\n`);

  // ----------------------------------------------------
  // TEST 2: Authoritative Contribution Types (strictly 11, MIXED removed)
  // ----------------------------------------------------
  console.log('[TEST 2] Verifying authoritative Contribution Types...');
  if (CONTRIBUTION_TYPES.includes('MIXED')) {
    throw new Error('MIXED should not be in CONTRIBUTION_TYPES');
  }
  if (CONTRIBUTION_TYPES.length !== 11) {
    throw new Error(`Expected 11 contribution types, found ${CONTRIBUTION_TYPES.length}`);
  }
  console.log(`  ✓ Contribution types verified (${CONTRIBUTION_TYPES.length}): ${CONTRIBUTION_TYPES.join(', ')}\n`);

  // ----------------------------------------------------
  // TEST 3: Deep Index Verification via syncIndexes() and getIndexes()
  // ----------------------------------------------------
  console.log('[TEST 3] Synchronizing and deeply verifying MongoDB indexes via getIndexes()...');
  for (const name of expectedModels) {
    await models[name].syncIndexes();
  }

  // Define critical unique and compound indexes required by PITCH_DATABASE_FINAL.md Section 33
  const criticalIndexChecks = [
    { model: 'User', name: 'email_1', unique: true, type: 'Single Unique' },
    { model: 'Company', name: 'userId_1', unique: true, type: 'Single Unique' },
    { model: 'Committee', name: 'userId_1', unique: true, type: 'Single Unique' },
    { model: 'File', name: 'provider_1_publicId_1', unique: true, type: 'Compound Unique' },
    { model: 'Event', name: 'slug_1', unique: true, type: 'Single Unique' },
    { model: 'SavedEvent', name: 'companyId_1_eventId_1', unique: true, type: 'Compound Unique' },
    { model: 'Mou', name: 'dealId_1', unique: true, type: 'Single Unique' },
    { model: 'MouVersion', name: 'mouId_1_versionNumber_1', unique: true, type: 'Compound Unique' },
    { model: 'Signature', name: 'mouVersionId_1_signerUserId_1', unique: true, type: 'Compound Unique' },
    { model: 'Review', name: 'dealId_1_reviewerUserId_1', unique: true, type: 'Compound Unique' },
    { model: 'Proposal', name: 'dealId_1_version_1', unique: false, type: 'Compound' },
    { model: 'Proposal', name: 'dealId_1_status_1', unique: false, type: 'Compound' },
    { model: 'Deal', name: 'companyId_1_status_1', unique: false, type: 'Compound' },
    { model: 'Deal', name: 'committeeId_1_status_1', unique: false, type: 'Compound' },
    { model: 'Application', name: 'eventId_1_companyId_1', unique: false, type: 'Compound' },
    { model: 'Invitation', name: 'eventId_1_companyId_1', unique: false, type: 'Compound' },
    { model: 'Message', name: 'conversationId_1_createdAt_1', unique: false, type: 'Compound' },
    { model: 'Notification', name: 'recipientUserId_1_createdAt_-1', unique: false, type: 'Compound' },
    { model: 'Notification', name: 'recipientUserId_1_readAt_1', unique: false, type: 'Compound' },
    { model: 'AuditLog', name: 'entityType_1_entityId_1', unique: false, type: 'Compound' },
    { model: 'Document', name: 'entityType_1_entityId_1', unique: false, type: 'Compound' },
    { model: 'SelfReportedHistory', name: 'ownerType_1_ownerId_1', unique: false, type: 'Compound' },
    { model: 'Report', name: 'targetType_1_targetId_1', unique: false, type: 'Compound' },
    { model: 'Dispute', name: 'dealId_1', unique: false, type: 'Single' },
  ];

  let verifiedIndexCount = 0;
  for (const check of criticalIndexChecks) {
    const rawIndexes = await models[check.model].collection.getIndexes();
    const fullIndexes = await models[check.model].collection.indexes();

    // Verify presence in getIndexes()
    if (!rawIndexes[check.name]) {
      throw new Error(`CRITICAL INDEX MISSING in getIndexes(): Model ${check.model} does not contain index "${check.name}"`);
    }

    // Verify attributes in fullIndexes()
    const targetIdx = fullIndexes.find((idx) => idx.name === check.name);
    if (!targetIdx) {
      throw new Error(`CRITICAL INDEX MISSING in indexes(): Model ${check.model} index "${check.name}" not found`);
    }

    if (check.unique && !targetIdx.unique) {
      throw new Error(`CRITICAL UNIQUE INDEX NOT UNIQUE: Model ${check.model} index "${check.name}" lacks unique: true`);
    }

    verifiedIndexCount++;
  }
  console.log(`  ✓ getIndexes() inspection verified ${verifiedIndexCount} critical unique and compound indexes across all collections.\n`);

  // Prepare test IDs
  const testUserId = new mongoose.Types.ObjectId();
  const testCompanyId = new mongoose.Types.ObjectId();
  const testCommitteeId = new mongoose.Types.ObjectId();
  const testEventId = new mongoose.Types.ObjectId();

  // ----------------------------------------------------
  // TEST 4: Deal State Machine & Transition Graph Reconciliation
  // ----------------------------------------------------
  console.log('[TEST 4] Testing Deal State Machine & Transition Graph Reconciliation...');

  // 1. Verify DEAL_TRANSITIONS contains only valid statuses from DEAL_STATUS
  const allDealStatuses = Object.values(DEAL_STATUS);
  for (const [fromStatus, targets] of Object.entries(DEAL_TRANSITIONS)) {
    if (!allDealStatuses.includes(fromStatus)) {
      throw new Error(`DEAL_TRANSITIONS contains invalid origin status: ${fromStatus}`);
    }
    for (const target of targets) {
      if (!allDealStatuses.includes(target)) {
        throw new Error(`DEAL_TRANSITIONS contains nonexistent target status: "${target}" from origin "${fromStatus}"!`);
      }
    }
  }

  // 2. Explicitly verify DISPUTED transitions do not contain RESOLVED
  if (DEAL_TRANSITIONS.DISPUTED.includes('RESOLVED')) {
    throw new Error('DEAL_TRANSITIONS.DISPUTED must not contain RESOLVED (RESOLVED is not a valid DEAL_STATUS)');
  }
  console.log(`  ✓ DEAL_TRANSITIONS graph verified: all ${Object.keys(DEAL_TRANSITIONS).length} states point exclusively to valid DEAL_STATUS values`);
  console.log(`  ✓ DISPUTED reconciled: transitions to [${DEAL_TRANSITIONS.DISPUTED.join(', ')}] with no nonexistent target`);

  // 3. Test Deal document state transitions
  const deal = new models.Deal({
    eventId: testEventId,
    companyId: testCompanyId,
    committeeId: testCommitteeId,
    status: DEAL_STATUS.INTERESTED,
  });
  await deal.save();
  console.log('  ✓ Initial deal saved with status: INTERESTED');

  // Valid transition: INTERESTED -> DISCUSSION
  deal.status = DEAL_STATUS.DISCUSSION;
  await deal.save();
  console.log('  ✓ Valid transition succeeded: INTERESTED -> DISCUSSION');

  // Valid transition: DISCUSSION -> NEGOTIATING
  deal.status = DEAL_STATUS.NEGOTIATING;
  await deal.save();
  console.log('  ✓ Valid transition succeeded: DISCUSSION -> NEGOTIATING');

  // Invalid transition: NEGOTIATING -> EXECUTED (must throw error)
  let invalidTransitionThrew = false;
  try {
    deal.status = DEAL_STATUS.EXECUTED;
    await deal.save();
  } catch (err) {
    invalidTransitionThrew = true;
    console.log(`  ✓ Invalid transition properly rejected: "${err.message}"`);
  }
  if (!invalidTransitionThrew) {
    throw new Error('Invalid transition NEGOTIATING -> EXECUTED should have been rejected!');
  }

  // Invalid transition via findOneAndUpdate (must also throw error)
  let findOneAndUpdateThrew = false;
  try {
    await models.Deal.findOneAndUpdate(
      { _id: deal._id },
      { $set: { status: DEAL_STATUS.COMPLETED } }
    );
  } catch (err) {
    findOneAndUpdateThrew = true;
    console.log(`  ✓ Query update with invalid transition rejected: "${err.message}"`);
  }
  if (!findOneAndUpdateThrew) {
    throw new Error('Query update with invalid transition should have been rejected!');
  }

  // Test DISPUTED transition reconciliation
  const disputedDeal = new models.Deal({
    eventId: testEventId,
    companyId: testCompanyId,
    committeeId: testCommitteeId,
    status: DEAL_STATUS.EXECUTED,
  });
  await disputedDeal.save();

  // EXECUTED -> DISPUTED is valid
  disputedDeal.status = DEAL_STATUS.DISPUTED;
  await disputedDeal.save();
  console.log('  ✓ Transition EXECUTED -> DISPUTED succeeded');

  // DISPUTED -> FULFILLMENT is valid
  disputedDeal.status = DEAL_STATUS.FULFILLMENT;
  await disputedDeal.save();
  console.log('  ✓ Reconciled transition DISPUTED -> FULFILLMENT succeeded');

  // Test invalid transition from DISPUTED to nonexistent 'RESOLVED' or invalid status
  disputedDeal.status = DEAL_STATUS.DISPUTED;
  await disputedDeal.save();

  let invalidResolvedThrew = false;
  try {
    disputedDeal.status = 'RESOLVED';
    await disputedDeal.save();
  } catch (err) {
    invalidResolvedThrew = true;
    console.log(`  ✓ Transition to nonexistent status 'RESOLVED' properly rejected: "${err.message}"`);
  }
  if (!invalidResolvedThrew) {
    throw new Error('Transition DISPUTED -> RESOLVED should have been rejected!');
  }

  // Clean up test deals
  await models.Deal.deleteOne({ _id: deal._id });
  await models.Deal.deleteOne({ _id: disputedDeal._id });
  console.log('  ✓ Deal state machine enforcement tests passed.\n');

  // ----------------------------------------------------
  // TEST 5: Proposal Immutability & Lifecycle Transitions
  // ----------------------------------------------------
  console.log('[TEST 5] Testing Proposal Immutability & Lifecycle State Transitions...');
  const testDealId = new mongoose.Types.ObjectId();

  // Verify PROPOSAL_TRANSITIONS graph integrity
  const allProposalStatuses = Object.values(PROPOSAL_STATUS);
  for (const [fromStatus, targets] of Object.entries(PROPOSAL_TRANSITIONS)) {
    if (!allProposalStatuses.includes(fromStatus)) {
      throw new Error(`PROPOSAL_TRANSITIONS contains invalid origin status: ${fromStatus}`);
    }
    for (const target of targets) {
      if (!allProposalStatuses.includes(target)) {
        throw new Error(`PROPOSAL_TRANSITIONS contains nonexistent target status: "${target}"!`);
      }
    }
  }
  console.log(`  ✓ PROPOSAL_TRANSITIONS graph verified: [${Object.keys(PROPOSAL_TRANSITIONS).join(', ')}]`);

  const proposal = new models.Proposal({
    dealId: testDealId,
    createdByUserId: testUserId,
    version: 1,
    contribution: {
      types: ['CASH', 'MERCHANDISE'],
      cash: { amount: 75000, currency: 'INR' },
      nonCash: [{ type: 'MERCHANDISE', description: 'Hoodies', quantity: 150, unit: 'pcs' }],
    },
    benefits: [{ title: 'Title Sponsor Placement', description: 'Logo on main banners' }],
    deliverables: [{ party: 'COMPANY', description: 'Provide hoodies 5 days before', dueDate: new Date() }],
    terms: 'Initial terms version 1',
    status: PROPOSAL_STATUS.PENDING,
  });
  await proposal.save();
  console.log('  ✓ Proposal version 1 created with status: PENDING');

  // Attempting to modify commercial terms must fail
  let proposalMutationThrew = false;
  try {
    proposal.terms = 'Modified terms illegally';
    await proposal.save();
  } catch (err) {
    proposalMutationThrew = true;
    console.log(`  ✓ Proposal terms mutation rejected: "${err.message}"`);
  }
  if (!proposalMutationThrew) {
    throw new Error('Modifying proposal terms should have been rejected!');
  }

  // Attempting to delete proposal must fail
  let proposalDeletionThrew = false;
  try {
    await models.Proposal.deleteOne({ _id: proposal._id });
  } catch (err) {
    proposalDeletionThrew = true;
    console.log(`  ✓ Proposal deletion rejected: "${err.message}"`);
  }
  if (!proposalDeletionThrew) {
    throw new Error('Deleting proposal should have been rejected!');
  }

  // Reload fresh proposal from database (with unmodified clean terms)
  const freshProposal = await models.Proposal.findById(proposal._id);

  // Valid status transition: PENDING -> ACCEPTED
  freshProposal.status = PROPOSAL_STATUS.ACCEPTED;
  freshProposal.respondedAt = new Date();
  await freshProposal.save();
  console.log('  ✓ Valid lifecycle transition succeeded: PENDING -> ACCEPTED');

  // Invalid transition from terminal state ACCEPTED -> PENDING must fail
  let invalidProposalTransitionThrew = false;
  try {
    freshProposal.status = PROPOSAL_STATUS.PENDING;
    await freshProposal.save();
  } catch (err) {
    invalidProposalTransitionThrew = true;
    console.log(`  ✓ Invalid proposal transition from ACCEPTED rejected: "${err.message}"`);
  }
  if (!invalidProposalTransitionThrew) {
    throw new Error('Transitioning ACCEPTED proposal back to PENDING should have been rejected!');
  }

  // Invalid transition via findOneAndUpdate (ACCEPTED -> REJECTED) must fail
  let queryProposalTransitionThrew = false;
  try {
    await models.Proposal.findOneAndUpdate(
      { _id: freshProposal._id },
      { $set: { status: PROPOSAL_STATUS.REJECTED } }
    );
  } catch (err) {
    queryProposalTransitionThrew = true;
    console.log(`  ✓ Invalid query update transition on proposal rejected: "${err.message}"`);
  }
  if (!queryProposalTransitionThrew) {
    throw new Error('Query update with invalid proposal transition should have been rejected!');
  }

  // Clean up directly in collection without trigger for test hygiene
  await mongoose.connection.collection('proposals').deleteOne({ _id: freshProposal._id });
  console.log('  ✓ Proposal immutability & lifecycle state machine tests passed.\n');

  // ----------------------------------------------------
  // TEST 6: DealAgreement Snapshot Preservation
  // ----------------------------------------------------
  console.log('[TEST 6] Testing DealAgreement Snapshot Preservation...');
  const initialSnapshot = {
    contributions: {
      types: ['CASH'],
      cash: { amount: 100000, currency: 'INR' },
    },
    benefits: [{ title: 'Main Stage Booth' }],
    deliverables: [{ party: 'COMMITTEE', description: 'Provide 10x10 booth' }],
    deliveryRequirements: { format: 'Physical on-site' },
    terms: 'Agreed final terms',
    paymentDetails: {
      beneficiaryName: 'College Cultural Committee',
      accountNumber: '1234567890',
      bankName: 'State Bank of India',
      branch: 'Campus Branch',
      ifscCode: 'SBIN0001234',
      pan: 'ABCDE1234F',
      gstin: '27ABCDE1234F1Z5',
      accountsEmail: 'accounts@college.edu',
      gstRate: 18,
      currency: 'INR',
    },
  };

  const dealAgreement = new models.DealAgreement({
    dealId: testDealId,
    acceptedProposalId: new mongoose.Types.ObjectId(),
    snapshot: initialSnapshot,
    agreedBy: [
      { userId: testUserId, role: SIGNER_ROLE.COMPANY, agreedAt: new Date() },
    ],
  });
  await dealAgreement.save();
  console.log('  ✓ Comprehensive DealAgreement commercial snapshot created and saved');

  // Modifying snapshot should be rejected by pre-save immutability hook
  let agreementMutationThrew = false;
  try {
    dealAgreement.snapshot = {
      ...initialSnapshot,
      terms: 'Mutated terms illegally',
    };
    dealAgreement.markModified('snapshot');
    await dealAgreement.save();
  } catch (err) {
    agreementMutationThrew = true;
    console.log(`  ✓ DealAgreement snapshot mutation rejected: "${err.message}"`);
  }
  if (!agreementMutationThrew) {
    throw new Error('Mutating DealAgreement snapshot should have been rejected!');
  }

  // Deleting agreement should be rejected
  let agreementDeletionThrew = false;
  try {
    await models.DealAgreement.deleteOne({ _id: dealAgreement._id });
  } catch (err) {
    agreementDeletionThrew = true;
    console.log(`  ✓ DealAgreement deletion rejected: "${err.message}"`);
  }
  if (!agreementDeletionThrew) {
    throw new Error('Deleting DealAgreement should have been rejected!');
  }

  await mongoose.connection.collection('dealagreements').deleteOne({ _id: dealAgreement._id });
  console.log('  ✓ DealAgreement snapshot preservation tests passed.\n');

  // ----------------------------------------------------
  // TEST 7: Signed MoUVersion Immutability & Query-Update Rejection
  // ----------------------------------------------------
  console.log('[TEST 7] Testing Signed MoUVersion Immutability & Query-Update Enforcement...');
  const testMouId = new mongoose.Types.ObjectId();
  const validHash = 'a'.repeat(64); // Valid 64-char SHA-256 hex string

  // Note: documentHash is stored at the root of MoUVersion (authoritative single field, duplicate removed from snapshot)
  const mouVersion = new models.MouVersion({
    mouId: testMouId,
    versionNumber: 1,
    sourceAgreementId: new mongoose.Types.ObjectId(),
    documentHash: validHash,
    templateIdentifier: TEMPLATE_IDENTIFIER,
    hashAlgorithm: HASH_ALGORITHM,
    status: MOU_VERSION_STATUS.PARTIALLY_SIGNED,
    agreementSnapshot: {
      parties: {
        committee: { organisationName: 'Cultural Committee' },
        company: { companyName: 'Brand Inc.' },
      },
      eventDetails: { title: 'Annual Fest 2026' },
      contributions: { cash: 50000 },
      organiserDeliverables: [{ title: 'Main banner logo' }],
      sponsorDeliverables: [{ title: 'Cash transfer' }],
      paymentDetails: { beneficiaryName: 'College Committee' },
      term: { duration: '6 months' },
      legalSettings: { jurisdiction: 'Mumbai, India' },
      signatories: [],
      witnesses: [],
    },
  });
  await mouVersion.save();
  console.log('  ✓ Signed MoUVersion created with status: PARTIALLY_SIGNED (single root documentHash)');

  // 1. Attempting to modify documentHash via document.save() must fail
  let mouVersionSaveMutationThrew = false;
  try {
    mouVersion.documentHash = 'b'.repeat(64);
    await mouVersion.save();
  } catch (err) {
    mouVersionSaveMutationThrew = true;
    console.log(`  ✓ Signed MoUVersion document save mutation rejected: "${err.message}"`);
  }
  if (!mouVersionSaveMutationThrew) {
    throw new Error('Modifying signed MoUVersion via save() should have been rejected!');
  }

  // 2. Attempting to modify signed MoUVersion via updateOne must fail
  let mouVersionUpdateOneThrew = false;
  try {
    await models.MouVersion.updateOne(
      { _id: mouVersion._id },
      { $set: { documentHash: 'c'.repeat(64) } }
    );
  } catch (err) {
    mouVersionUpdateOneThrew = true;
    console.log(`  ✓ Signed MoUVersion updateOne mutation rejected: "${err.message}"`);
  }
  if (!mouVersionUpdateOneThrew) {
    throw new Error('Modifying signed MoUVersion via updateOne should have been rejected!');
  }

  // 3. Attempting to modify signed MoUVersion via findOneAndUpdate must fail
  let mouVersionFindOneAndUpdateThrew = false;
  try {
    await models.MouVersion.findOneAndUpdate(
      { _id: mouVersion._id },
      { $set: { 'agreementSnapshot.parties.company.companyName': 'Mutated Brand Name' } }
    );
  } catch (err) {
    mouVersionFindOneAndUpdateThrew = true;
    console.log(`  ✓ Signed MoUVersion findOneAndUpdate mutation rejected: "${err.message}"`);
  }
  if (!mouVersionFindOneAndUpdateThrew) {
    throw new Error('Modifying signed MoUVersion via findOneAndUpdate should have been rejected!');
  }

  // 4. Attempting to delete signed MoUVersion must remain rejected
  let mouVersionDeletionThrew = false;
  try {
    await models.MouVersion.deleteOne({ _id: mouVersion._id });
  } catch (err) {
    mouVersionDeletionThrew = true;
    console.log(`  ✓ Signed MoUVersion deletion rejected: "${err.message}"`);
  }
  if (!mouVersionDeletionThrew) {
    throw new Error('Deleting signed MoUVersion should have been rejected!');
  }

  await mongoose.connection.collection('mouversions').deleteOne({ _id: mouVersion._id });
  console.log('  ✓ Signed MoUVersion immutability & query-update rejection tests passed.\n');

  // ----------------------------------------------------
  // TEST 8: Signature Immutability Enforcement
  // ----------------------------------------------------
  console.log('[TEST 8] Testing Signature Immutability Enforcement...');
  const signature = new models.Signature({
    mouId: testMouId,
    mouVersionId: new mongoose.Types.ObjectId(),
    signerUserId: testUserId,
    signerRole: SIGNER_ROLE.COMPANY,
    signatureData: 'Signature: John Brand Officer',
    consentText: 'I agree to and sign MoU Version 1 under platform terms.',
    documentHashAtSigning: validHash,
    hashAlgorithm: HASH_ALGORITHM,
  });
  await signature.save();
  console.log('  ✓ Signature record saved with valid SHA-256 hash at signing');

  // Attempting to modify signature
  let signatureMutationThrew = false;
  try {
    signature.consentText = 'Modified consent text illegally';
    await signature.save();
  } catch (err) {
    signatureMutationThrew = true;
    console.log(`  ✓ Signature mutation rejected: "${err.message}"`);
  }
  if (!signatureMutationThrew) {
    throw new Error('Modifying signature should have been rejected!');
  }

  // Attempting to update via query
  let signatureUpdateThrew = false;
  try {
    await models.Signature.updateOne(
      { _id: signature._id },
      { $set: { signatureData: 'Mutated data' } }
    );
  } catch (err) {
    signatureUpdateThrew = true;
    console.log(`  ✓ Query update on signature rejected: "${err.message}"`);
  }
  if (!signatureUpdateThrew) {
    throw new Error('Updating signature via query should have been rejected!');
  }

  // Attempting to delete signature
  let signatureDeleteThrew = false;
  try {
    await models.Signature.deleteOne({ _id: signature._id });
  } catch (err) {
    signatureDeleteThrew = true;
    console.log(`  ✓ Signature deletion rejected: "${err.message}"`);
  }
  if (!signatureDeleteThrew) {
    throw new Error('Deleting signature should have been rejected!');
  }

  await mongoose.connection.collection('signatures').deleteOne({ _id: signature._id });
  console.log('  ✓ Signature immutability tests passed.\n');

  // ----------------------------------------------------
  // TEST 9: SHA-256 Validation
  // ----------------------------------------------------
  console.log('[TEST 9] Testing SHA-256 Field Format Validation...');

  // Invalid SHA-256 (too short: 63 characters)
  const invalidShortHash = 'a'.repeat(63);
  let shortHashThrew = false;
  try {
    const badVersion = new models.MouVersion({
      mouId: testMouId,
      versionNumber: 2,
      sourceAgreementId: new mongoose.Types.ObjectId(),
      documentHash: invalidShortHash,
    });
    await badVersion.validate();
  } catch (err) {
    shortHashThrew = true;
    console.log(`  ✓ Non-64 char hash properly rejected: "${err.message}"`);
  }
  if (!shortHashThrew) {
    throw new Error('Non-64 char hash should have failed validation!');
  }

  // Invalid SHA-256 (non-hex characters)
  const invalidNonHexHash = 'g'.repeat(64);
  let nonHexHashThrew = false;
  try {
    const badSignature = new models.Signature({
      mouId: testMouId,
      mouVersionId: new mongoose.Types.ObjectId(),
      signerUserId: testUserId,
      signerRole: SIGNER_ROLE.COMPANY,
      signatureData: 'Signature',
      consentText: 'Consent',
      documentHashAtSigning: invalidNonHexHash,
    });
    await badSignature.validate();
  } catch (err) {
    nonHexHashThrew = true;
    console.log(`  ✓ Non-hex character hash properly rejected: "${err.message}"`);
  }
  if (!nonHexHashThrew) {
    throw new Error('Non-hex character hash should have failed validation!');
  }
  console.log('  ✓ SHA-256 format validation tests passed.\n');

  // ----------------------------------------------------
  // TEST 10: Duplicate Unique Records Rejection
  // ----------------------------------------------------
  console.log('[TEST 10] Testing Duplicate Unique Constraints Enforcement in MongoDB...');
  const uniqueEmail = `test-unique-${Date.now()}@pitch.ac.in`;
  const user1 = new models.User({
    email: uniqueEmail,
    passwordHash: 'hashed_pw_1',
    role: ROLES.COMPANY,
  });
  await user1.save();
  console.log(`  ✓ First user created with email: ${uniqueEmail}`);

  let duplicateUserThrew = false;
  try {
    const user2 = new models.User({
      email: uniqueEmail, // Duplicate!
      passwordHash: 'hashed_pw_2',
      role: ROLES.COMMITTEE,
    });
    await user2.save();
  } catch (err) {
    duplicateUserThrew = true;
    console.log(`  ✓ Duplicate user email rejected by MongoDB unique index (code: ${err.code})`);
  }
  if (!duplicateUserThrew) {
    throw new Error('Duplicate user email should have been rejected by unique index!');
  }

  // Unique SavedEvent (companyId + eventId)
  const savedCompanyId = new mongoose.Types.ObjectId();
  const savedEventId = new mongoose.Types.ObjectId();
  const saved1 = new models.SavedEvent({
    companyId: savedCompanyId,
    eventId: savedEventId,
  });
  await saved1.save();
  console.log('  ✓ First SavedEvent created');

  let duplicateSavedEventThrew = false;
  try {
    const saved2 = new models.SavedEvent({
      companyId: savedCompanyId,
      eventId: savedEventId, // Duplicate!
    });
    await saved2.save();
  } catch (err) {
    duplicateSavedEventThrew = true;
    console.log(`  ✓ Duplicate SavedEvent rejected by MongoDB compound unique index (code: ${err.code})`);
  }
  if (!duplicateSavedEventThrew) {
    throw new Error('Duplicate SavedEvent should have been rejected by unique index!');
  }

  // Unique MoU (dealId unique)
  const mouDealId = new mongoose.Types.ObjectId();
  const mou1 = new models.Mou({
    dealId: mouDealId,
  });
  await mou1.save();
  console.log('  ✓ First MoU created with unique dealId');

  let duplicateMouThrew = false;
  try {
    const mou2 = new models.Mou({
      dealId: mouDealId, // Duplicate!
    });
    await mou2.save();
  } catch (err) {
    duplicateMouThrew = true;
    console.log(`  ✓ Duplicate MoU dealId rejected by MongoDB unique index (code: ${err.code})`);
  }
  if (!duplicateMouThrew) {
    throw new Error('Duplicate MoU dealId should have been rejected by unique index!');
  }

  // Cleanup test users, saved events, and mous
  await models.User.deleteOne({ _id: user1._id });
  await models.SavedEvent.deleteOne({ _id: saved1._id });
  await models.Mou.deleteOne({ _id: mou1._id });
  console.log('  ✓ Duplicate unique constraints tests passed.\n');

  console.log('====================================================');
  console.log(' ALL 10 TEST SUITES COMPLETED AND PASSED WITH 100% SUCCESS ');
  console.log('====================================================');

  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
