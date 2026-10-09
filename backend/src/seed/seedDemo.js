const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const {
  User,
  Company,
  Committee,
  Event,
  SponsorshipPackage,
  Application,
  Invitation,
  Conversation,
  Message,
  Deal,
  Proposal,
  DealAgreement,
  Mou,
  MouVersion,
  Signature,
  Fulfillment,
  FulfillmentEvidence,
  Review,
  Dispute,
  Report,
  Notification,
  AuditLog,
  File,
  SelfReportedHistory,
} = require('../models');

const {
  ROLES,
  USER_STATUS,
  EVENT_STATUS,
  EVENT_LOCATION_MODE,
  SPONSORSHIP_PACKAGE_STATUS,
  APPLICATION_STATUS,
  INVITATION_STATUS,
  CONVERSATION_STATUS,
  MESSAGE_TYPE,
  DEAL_STATUS,
  PROPOSAL_STATUS,
  DEAL_AGREEMENT_STATUS,
  MOU_STATUS,
  MOU_VERSION_STATUS,
  SIGNER_ROLE,
  SIGNATURE_TYPE,
  TEMPLATE_IDENTIFIER,
  HASH_ALGORITHM,
  FULFILLMENT_RESPONSIBLE_PARTY,
  FULFILLMENT_TYPE,
  FULFILLMENT_STATUS,
  REVIEW_STATUS,
  DISPUTE_STATUS,
  REPORT_TARGET_TYPE,
  REPORT_STATUS,
  NOTIFICATION_TYPE,
  FILE_PROVIDER,
  FILE_RESOURCE_TYPE,
  FILE_PURPOSE,
} = require('../utils/constants');

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Clean existing demo records identified by email domain (*@pitchdemo.com).
 * Bypasses Mongoose immutability pre-hooks on Proposal, DealAgreement, MouVersion, Signature
 * by using native collection deletes.
 */
async function cleanDemoData() {
  console.log('[SEED] Checking and cleaning previous demo dataset (*@pitchdemo.com)...');

  const demoUsers = await User.find({ email: /pitchdemo\.com$/ });
  const demoUserIds = demoUsers.map((u) => u._id);

  if (demoUserIds.length === 0) {
    console.log('  ✓ No previous demo dataset found. Ready to seed fresh records.');
    return;
  }

  const [demoCompanies, demoCommittees] = await Promise.all([
    Company.find({ userId: { $in: demoUserIds } }),
    Committee.find({ userId: { $in: demoUserIds } }),
  ]);
  const demoCompanyIds = demoCompanies.map((c) => c._id);
  const demoCommitteeIds = demoCommittees.map((c) => c._id);

  const demoEvents = await Event.find({ committeeId: { $in: demoCommitteeIds } });
  const demoEventIds = demoEvents.map((e) => e._id);

  const demoDeals = await Deal.find({
    $or: [
      { companyId: { $in: demoCompanyIds } },
      { committeeId: { $in: demoCommitteeIds } },
      { eventId: { $in: demoEventIds } },
    ],
  });
  const demoDealIds = demoDeals.map((d) => d._id);

  const demoMous = await Mou.find({ dealId: { $in: demoDealIds } });
  const demoMouIds = demoMous.map((m) => m._id);

  const demoFulfillments = await Fulfillment.find({ dealId: { $in: demoDealIds } });
  const demoFulfillmentIds = demoFulfillments.map((f) => f._id);

  const demoConversations = await Conversation.find({
    $or: [
      { participantCompanyId: { $in: demoCompanyIds } },
      { participantCommitteeId: { $in: demoCommitteeIds } },
      { eventId: { $in: demoEventIds } },
    ],
  });
  const demoConversationIds = demoConversations.map((c) => c._id);

  // Native collection deletions for immutable models to bypass Mongoose query middleware
  const db = mongoose.connection.db;
  await Promise.all([
    db.collection('proposals').deleteMany({ dealId: { $in: demoDealIds } }),
    db.collection('dealagreements').deleteMany({ dealId: { $in: demoDealIds } }),
    db.collection('mouversions').deleteMany({ mouId: { $in: demoMouIds } }),
    db.collection('signatures').deleteMany({ mouId: { $in: demoMouIds } }),
  ]);

  // Model-level deletions for the remaining collections
  await Promise.all([
    Message.deleteMany({ conversationId: { $in: demoConversationIds } }),
    Conversation.deleteMany({ _id: { $in: demoConversationIds } }),
    Mou.deleteMany({ _id: { $in: demoMouIds } }),
    FulfillmentEvidence.deleteMany({ fulfillmentId: { $in: demoFulfillmentIds } }),
    Fulfillment.deleteMany({ _id: { $in: demoFulfillmentIds } }),
    Review.deleteMany({ dealId: { $in: demoDealIds } }),
    Dispute.deleteMany({ dealId: { $in: demoDealIds } }),
    Report.deleteMany({ reporterUserId: { $in: demoUserIds } }),
    Application.deleteMany({
      $or: [
        { companyId: { $in: demoCompanyIds } },
        { eventId: { $in: demoEventIds } },
      ],
    }),
    Invitation.deleteMany({
      $or: [
        { committeeId: { $in: demoCommitteeIds } },
        { companyId: { $in: demoCompanyIds } },
        { eventId: { $in: demoEventIds } },
      ],
    }),
    SelfReportedHistory.deleteMany({
      ownerId: { $in: [...demoCompanyIds, ...demoCommitteeIds] },
    }),
    SponsorshipPackage.deleteMany({ eventId: { $in: demoEventIds } }),
    Event.deleteMany({ _id: { $in: demoEventIds } }),
    Deal.deleteMany({ _id: { $in: demoDealIds } }),
    Company.deleteMany({ _id: { $in: demoCompanyIds } }),
    Committee.deleteMany({ _id: { $in: demoCommitteeIds } }),
    Notification.deleteMany({ recipientUserId: { $in: demoUserIds } }),
    AuditLog.deleteMany({ actorUserId: { $in: demoUserIds } }),
    File.deleteMany({ ownerUserId: { $in: demoUserIds } }),
    User.deleteMany({ _id: { $in: demoUserIds } }),
  ]);

  console.log(`  ✓ Cleaned ${demoUsers.length} previous demo accounts & all associated dependent records.`);
}

async function seed() {
  console.log('====================================================');
  console.log('       PITCH PLATFORM DEMO SEED DATA GENERATOR      ');
  console.log('====================================================\n');

  await connectDB();
  await cleanDemoData();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('DemoPassword123!', salt);

  console.log('\n[1/12] Creating Admin, Company & Committee Users...');

  // 1. ADMIN USERS (2)
  const [adminUser, opsAdminUser] = await Promise.all([
    User.create({
      name: 'Platform Administrator',
      email: 'admin@pitchdemo.com',
      passwordHash,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    }),
    User.create({
      name: 'Operations & Compliance Lead',
      email: 'operations@pitchdemo.com',
      passwordHash,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    }),
  ]);

  // 2. COMPANY USERS (10)
  const companyUserSpecs = [
    { name: 'Aarav Sharma', email: 'sponsor@techcorp.pitchdemo.com' }, // Hero
    { name: 'Priya Mehta', email: 'sponsor@velocity.pitchdemo.com' },
    { name: 'Karan Singhania', email: 'sponsor@finedge.pitchdemo.com' },
    { name: 'Neha Nair', email: 'sponsor@novapay.pitchdemo.com' },
    { name: 'Vikram Joshi', email: 'sponsor@byteworks.pitchdemo.com' },
    { name: 'Aditi Verma', email: 'sponsor@urbankart.pitchdemo.com' },
    { name: 'Siddharth Rao', email: 'sponsor@greengrid.pitchdemo.com' },
    { name: 'Ritu Sen', email: 'sponsor@campusbrew.pitchdemo.com' },
    { name: 'Arjun Kapoor', email: 'sponsor@brandsphere.pitchdemo.com' },
    { name: 'Dr. Meera Nambiar', email: 'sponsor@nextwave.pitchdemo.com' },
  ];

  const companyUsers = await Promise.all(
    companyUserSpecs.map((spec) =>
      User.create({
        name: spec.name,
        email: spec.email,
        passwordHash,
        role: ROLES.COMPANY,
        status: USER_STATUS.ACTIVE,
        isActive: true,
      })
    )
  );

  // 3. COMMITTEE USERS (9)
  const committeeUserSpecs = [
    { name: 'Rohan Gupta', email: 'convenor@ecell.pitchdemo.com' }, // Hero
    { name: 'Ananya Roy', email: 'head@revels.pitchdemo.com' },
    { name: 'Harsh Vardhan', email: 'lead@codingclub.pitchdemo.com' },
    { name: 'Tanya Saxena', email: 'chair@robotics.pitchdemo.com' },
    { name: 'Aryan Goel', email: 'convenor@financeclub.pitchdemo.com' },
    { name: 'Devendra Singh', email: 'secretary@sports.pitchdemo.com' },
    { name: 'Natasha D\'Souza', email: 'head@dramatics.pitchdemo.com' },
    { name: 'Sanya Malhotra', email: 'lead@enactus.pitchdemo.com' },
    { name: 'Kabir Das', email: 'president@management.pitchdemo.com' },
  ];

  const committeeUsers = await Promise.all(
    committeeUserSpecs.map((spec) =>
      User.create({
        name: spec.name,
        email: spec.email,
        passwordHash,
        role: ROLES.COMMITTEE,
        status: USER_STATUS.ACTIVE,
        isActive: true,
      })
    )
  );

  console.log(`  ✓ Created 2 Admins, 10 Company Users, and 9 Committee Users`);

  console.log('\n[2/12] Creating Media Files (Logos, Covers, Banners, Evidence)...');

  // Helper to create File record
  const makeFile = (ownerUser, publicId, url, purpose, originalName = 'image.jpg') =>
    File.create({
      ownerUserId: ownerUser._id,
      provider: FILE_PROVIDER.CLOUDINARY,
      publicId,
      url,
      originalName,
      mimeType: 'image/jpeg',
      sizeBytes: 54200,
      resourceType: FILE_RESOURCE_TYPE.IMAGE,
      purpose,
    });

  // Company Media
  const companyFiles = await Promise.all([
    makeFile(companyUsers[0], 'demo/techcorp_logo', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(companyUsers[0], 'demo/techcorp_cover', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.COVER_IMAGE),
    makeFile(companyUsers[1], 'demo/velocity_logo', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(companyUsers[1], 'demo/velocity_cover', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.COVER_IMAGE),
    makeFile(companyUsers[2], 'demo/finedge_logo', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(companyUsers[3], 'demo/novapay_logo', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(companyUsers[4], 'demo/byteworks_logo', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(companyUsers[5], 'demo/urbankart_logo', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(companyUsers[6], 'demo/greengrid_logo', 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(companyUsers[7], 'demo/campusbrew_logo', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(companyUsers[8], 'demo/brandsphere_logo', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(companyUsers[9], 'demo/nextwave_logo', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
  ]);

  // Committee Media
  const committeeFiles = await Promise.all([
    makeFile(committeeUsers[0], 'demo/ecell_logo', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(committeeUsers[0], 'demo/ecell_cover', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.COVER_IMAGE),
    makeFile(committeeUsers[1], 'demo/revels_logo', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(committeeUsers[1], 'demo/revels_cover', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.COVER_IMAGE),
    makeFile(committeeUsers[2], 'demo/devsoc_logo', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(committeeUsers[3], 'demo/robotics_logo', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(committeeUsers[4], 'demo/finclub_logo', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(committeeUsers[5], 'demo/sports_logo', 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(committeeUsers[6], 'demo/dramatics_logo', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(committeeUsers[7], 'demo/enactus_logo', 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
    makeFile(committeeUsers[8], 'demo/management_logo', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80', FILE_PURPOSE.PROFILE_IMAGE),
  ]);

  // Event Banner Files
  const eventBannerFiles = await Promise.all([
    makeFile(committeeUsers[0], 'demo/banner_esummit', 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[1], 'demo/banner_revels', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[2], 'demo/banner_apogee', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[3], 'demo/banner_robowars', 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[4], 'demo/banner_fincon', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[5], 'demo/banner_spardha', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[6], 'demo/banner_curtaincall', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[7], 'demo/banner_enactus', 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[8], 'demo/banner_vanguard', 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[2], 'demo/banner_algobyte', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[0], 'demo/banner_pitchforge', 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[1], 'demo/banner_rhythm', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[0], 'demo/banner_innoventure', 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[2], 'demo/banner_technosprint', 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[5], 'demo/banner_campussports', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[0], 'demo/banner_futurefounders', 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[7], 'demo/banner_ecopulse', 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
    makeFile(committeeUsers[6], 'demo/banner_proscenium', 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80', FILE_PURPOSE.EVENT_BANNER),
  ]);

  // Evidence Files for Fulfillment
  const evidenceFiles = await Promise.all([
    makeFile(committeeUsers[0], 'demo/evidence_booth_esummit', 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80', FILE_PURPOSE.FULFILLMENT_EVIDENCE, 'central_quad_booth_photo.jpg'),
    makeFile(companyUsers[0], 'demo/evidence_beverage_dispatch', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80', FILE_PURPOSE.FULFILLMENT_EVIDENCE, 'beverage_cargo_receipt.pdf'),
    makeFile(companyUsers[1], 'demo/evidence_kiosk_revels', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80', FILE_PURPOSE.FULFILLMENT_EVIDENCE, 'revels_sampling_stall.jpg'),
  ]);

  console.log(`  ✓ Generated 44 high-resolution media records for profiles, events, and evidence`);

  console.log('\n[3/12] Creating Company & Committee Profiles...');

  // 10 Companies
  const companies = await Promise.all([
    Company.create({
      userId: companyUsers[0]._id,
      name: 'TechCorp India Solutions',
      legalName: 'TechCorp India Technologies Private Limited',
      industry: 'Technology & Cloud',
      description: 'Leading provider of enterprise cloud infrastructure, developer tooling, and AI hardware powering student technologists across India.',
      website: 'https://techcorp-india.demo',
      logoFileId: companyFiles[0]._id,
      coverFileId: companyFiles[1]._id,
      location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
      contact: { phone: '+91 80 4123 9000', email: 'partnerships@techcorp.pitchdemo.com' },
      socialLinks: { linkedin: 'https://linkedin.com/company/techcorp-india-demo', website: 'https://techcorp-india.demo' },
      sponsorshipPreferences: {
        eventCategories: ['Technical', 'Entrepreneurship', 'Robotics'],
        preferredLocations: ['Mumbai', 'Bengaluru', 'Delhi', 'Pilani'],
        targetAudience: ['Developers', 'Student Founders', 'Engineering Students'],
        budgetMin: 50000,
        budgetMax: 1000000,
        contributionTypes: ['CASH', 'SERVICE', 'MERCHANDISE'],
      },
      isProfileComplete: true,
    }),
    Company.create({
      userId: companyUsers[1]._id,
      name: 'Velocity Energy Beverages',
      legalName: 'Velocity Beverages FMCG Pvt Ltd',
      industry: 'FMCG / Food & Beverage',
      description: 'Premium natural sparkling energy beverage brand fueling campus innovators, athletes, coders, and creators.',
      website: 'https://velocityenergy.demo',
      logoFileId: companyFiles[2]._id,
      coverFileId: companyFiles[3]._id,
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      contact: { phone: '+91 22 6789 1234', email: 'events@velocity.pitchdemo.com' },
      socialLinks: { instagram: 'https://instagram.com/velocityenergy.demo', website: 'https://velocityenergy.demo' },
      sponsorshipPreferences: {
        eventCategories: ['Sports', 'Cultural', 'Technical'],
        preferredLocations: ['Mumbai', 'Manipal', 'Varanasi'],
        targetAudience: ['Athletes', 'College Students', 'Gamers'],
        budgetMin: 30000,
        budgetMax: 500000,
        contributionTypes: ['CASH', 'BEVERAGE', 'PRODUCT'],
      },
      isProfileComplete: true,
    }),
    Company.create({
      userId: companyUsers[2]._id,
      name: 'FinEdge Wealth & Trading',
      legalName: 'FinEdge Capital Markets Ltd',
      industry: 'Fintech & Financial Services',
      description: 'Zero-commission algorithmic trading platform and investment intelligence app educating India\'s next generation of retail investors.',
      website: 'https://finedge-trading.demo',
      logoFileId: companyFiles[4]._id,
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      contact: { phone: '+91 22 5544 3322', email: 'campus@finedge.pitchdemo.com' },
      sponsorshipPreferences: {
        eventCategories: ['Management', 'Finance', 'Entrepreneurship'],
        budgetMin: 50000,
        budgetMax: 600000,
        contributionTypes: ['CASH', 'SERVICE'],
      },
      isProfileComplete: true,
    }),
    Company.create({
      userId: companyUsers[3]._id,
      name: 'NovaPay Technologies',
      legalName: 'NovaPay NeoBanking Solutions Ltd',
      industry: 'Digital Payments & Neo-Banking',
      description: 'Unified UPI payments stack, smart festival cashless bands, and student campus wallet solution operating across premier universities.',
      website: 'https://novapay.demo',
      logoFileId: companyFiles[5]._id,
      location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
      contact: { phone: '+91 80 9876 5432', email: 'partnerships@novapay.pitchdemo.com' },
      sponsorshipPreferences: {
        eventCategories: ['Technical', 'Cultural', 'Festival'],
        budgetMin: 50000,
        budgetMax: 750000,
        contributionTypes: ['CASH', 'PRODUCT', 'SERVICE'],
      },
      isProfileComplete: true,
    }),
    Company.create({
      userId: companyUsers[4]._id,
      name: 'ByteWorks AI Labs',
      legalName: 'ByteWorks Enterprise Software Labs Pvt Ltd',
      industry: 'Software & Artificial Intelligence',
      description: 'Generative AI API infrastructure and enterprise developer tool suite empowering hackathon builders with GPU compute grants and cloud credits.',
      website: 'https://byteworks-ai.demo',
      logoFileId: companyFiles[6]._id,
      location: { city: 'Hyderabad', state: 'Telangana', country: 'India' },
      sponsorshipPreferences: {
        eventCategories: ['Technical', 'Robotics'],
        budgetMin: 100000,
        budgetMax: 800000,
        contributionTypes: ['CASH', 'SERVICE', 'MERCHANDISE'],
      },
      isProfileComplete: true,
    }),
    Company.create({
      userId: companyUsers[5]._id,
      name: 'UrbanKart Quick Commerce',
      legalName: 'UrbanKart Retail Logistics Ltd',
      industry: 'E-Commerce & Quick Commerce',
      description: 'Ten-minute campus snack and grocery delivery app powering festive pro-nights and late-night collegiate study sessions.',
      website: 'https://urbankart.demo',
      logoFileId: companyFiles[7]._id,
      location: { city: 'Gurugram', state: 'Haryana', country: 'India' },
      sponsorshipPreferences: {
        eventCategories: ['Cultural', 'Sports', 'Festival'],
        budgetMin: 40000,
        budgetMax: 400000,
        contributionTypes: ['CASH', 'FOOD', 'GIFT_HAMPER'],
      },
      isProfileComplete: true,
    }),
    Company.create({
      userId: companyUsers[6]._id,
      name: 'GreenGrid CleanTech Mobility',
      legalName: 'GreenGrid Clean Energy Technologies Ltd',
      industry: 'Electric Vehicles & CleanTech',
      description: 'Smart EV two-wheeler ecosystem and campus battery swapping network fostering zero-emission collegiate transportation.',
      website: 'https://greengrid-ev.demo',
      logoFileId: companyFiles[8]._id,
      location: { city: 'Pune', state: 'Maharashtra', country: 'India' },
      sponsorshipPreferences: {
        eventCategories: ['Social Impact', 'Technical', 'Entrepreneurship'],
        budgetMin: 50000,
        budgetMax: 500000,
        contributionTypes: ['CASH', 'EQUIPMENT', 'TRANSPORTATION'],
      },
      isProfileComplete: true,
    }),
    Company.create({
      userId: companyUsers[7]._id,
      name: 'CampusBrew Artisan Cafes',
      legalName: 'CampusBrew Specialty Roasters Pvt Ltd',
      industry: 'Quick Service Restaurants & Beverage',
      description: 'Third-wave coffee and artisanal bakery brand running vibrant pop-up experiential lounges across premier college festival grounds.',
      website: 'https://campusbrew.demo',
      logoFileId: companyFiles[9]._id,
      location: { city: 'Delhi', state: 'Delhi', country: 'India' },
      sponsorshipPreferences: {
        eventCategories: ['Cultural', 'Fine Arts', 'Festival'],
        budgetMin: 25000,
        budgetMax: 300000,
        contributionTypes: ['CASH', 'BEVERAGE', 'FOOD', 'VENUE'],
      },
      isProfileComplete: true,
    }),
    Company.create({
      userId: companyUsers[8]._id,
      name: 'BrandSphere Media & Talent',
      legalName: 'BrandSphere Creator Agency Ltd',
      industry: 'Influencer Marketing & Creator Economy',
      description: 'Next-gen talent management agency connecting collegiate podcasters, campus ambassadors, and filmmakers with top national sponsors.',
      website: 'https://brandsphere-media.demo',
      logoFileId: companyFiles[10]._id,
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      sponsorshipPreferences: {
        eventCategories: ['Cultural', 'Festival', 'Fine Arts'],
        budgetMin: 30000,
        budgetMax: 350000,
        contributionTypes: ['CASH', 'SERVICE', 'MERCHANDISE'],
      },
      isProfileComplete: true,
    }),
    Company.create({
      userId: companyUsers[9]._id,
      name: 'NextWave Careers & EdTech',
      legalName: 'NextWave Education & Fellowship Pvt Ltd',
      industry: 'EdTech & Higher Education',
      description: 'Career discovery platform offering elite tech fellowships, global internship matching, and technical scholarship grants for top college talent.',
      website: 'https://nextwave-edtech.demo',
      logoFileId: companyFiles[11]._id,
      location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
      sponsorshipPreferences: {
        eventCategories: ['Technical', 'Entrepreneurship', 'Management'],
        budgetMin: 50000,
        budgetMax: 600000,
        contributionTypes: ['CASH', 'SERVICE', 'MERCHANDISE'],
      },
      isProfileComplete: true,
    }),
  ]);

  // 9 Committees
  const committees = await Promise.all([
    Committee.create({
      userId: committeeUsers[0]._id,
      name: 'The Entrepreneurship Cell',
      college: {
        name: 'Indian Institute of Technology Bombay',
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      },
      description: 'Asia\'s premier student-run entrepreneurship body promoting startup culture, seed funding, and corporate innovation through E-Summit annually.',
      committeeType: 'Entrepreneurship Cell',
      website: 'https://ecell.in',
      logoFileId: committeeFiles[0]._id,
      coverFileId: committeeFiles[1]._id,
      contact: { phone: '+91 22 2576 4000', email: 'convenor@ecell.pitchdemo.com' },
      socialLinks: { instagram: 'https://instagram.com/ecell.iitb', linkedin: 'https://linkedin.com/company/ecell-iitb' },
      isProfileComplete: true,
    }),
    Committee.create({
      userId: committeeUsers[1]._id,
      name: 'Revels Cultural Festival Committee',
      college: {
        name: 'Manipal Institute of Technology, Manipal',
        location: { city: 'Manipal', state: 'Karnataka', country: 'India' },
      },
      description: 'Premier national collegiate cultural carnival welcoming 18,000+ delegates across music, fashion, fine arts, debate, and pro-night concert arenas.',
      committeeType: 'Cultural Committee',
      website: 'https://revelsmit.com',
      logoFileId: committeeFiles[2]._id,
      coverFileId: committeeFiles[3]._id,
      contact: { phone: '+91 820 292 5000', email: 'head@revels.pitchdemo.com' },
      socialLinks: { instagram: 'https://instagram.com/revels.mit' },
      isProfileComplete: true,
    }),
    Committee.create({
      userId: committeeUsers[2]._id,
      name: 'DevSoc & Coding Society',
      college: {
        name: 'BITS Pilani',
        location: { city: 'Pilani', state: 'Rajasthan', country: 'India' },
      },
      description: 'Elite developer community and open-source collective hosting national collegiate hackathons, algorithmic leagues, and systems engineering summits.',
      committeeType: 'Technical Society',
      logoFileId: committeeFiles[4]._id,
      isProfileComplete: true,
    }),
    Committee.create({
      userId: committeeUsers[3]._id,
      name: 'Robotics Society (D-Robotics)',
      college: {
        name: 'Delhi Technological University',
        location: { city: 'Delhi', state: 'Delhi', country: 'India' },
      },
      description: 'Research team and makerspace engineering combat robots, autonomous drones, and Mars rovers; hosts the international RoboWars arena.',
      committeeType: 'Robotics Club',
      logoFileId: committeeFiles[5]._id,
      isProfileComplete: true,
    }),
    Committee.create({
      userId: committeeUsers[4]._id,
      name: 'FinClub & Economics Society',
      college: {
        name: 'Shri Ram College of Commerce',
        location: { city: 'Delhi', state: 'Delhi', country: 'India' },
      },
      description: 'Apex commerce, equity research, and financial modeling society hosting the National FinCon, live portfolio trading leagues, and case conclaves.',
      committeeType: 'Finance Club',
      logoFileId: committeeFiles[6]._id,
      isProfileComplete: true,
    }),
    Committee.create({
      userId: committeeUsers[5]._id,
      name: 'Sports Council (Spardha Organizers)',
      college: {
        name: 'IIT (BHU) Varanasi',
        location: { city: 'Varanasi', state: 'Uttar Pradesh', country: 'India' },
      },
      description: 'Collegiate sports federation administering 25+ athletic championships and Spardha, North India\'s biggest inter-collegiate games festival.',
      committeeType: 'Sports Committee',
      logoFileId: committeeFiles[7]._id,
      isProfileComplete: true,
    }),
    Committee.create({
      userId: committeeUsers[6]._id,
      name: 'Dramatics & Theatrical Arts Circle',
      college: {
        name: 'St. Xavier\'s College',
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      },
      description: 'Award-winning theatrical society producing acclaimed street plays, proscenium productions, and national one-act drama competitions.',
      committeeType: 'Dramatics Society',
      logoFileId: committeeFiles[8]._id,
      isProfileComplete: true,
    }),
    Committee.create({
      userId: committeeUsers[7]._id,
      name: 'Enactus Social Innovation Cell',
      college: {
        name: 'University of Delhi',
        location: { city: 'Delhi', state: 'Delhi', country: 'India' },
      },
      description: 'Impact enterprise incubator deploying scalable grassroots projects in clean drinking water, women\'s livelihoods, and circular textile waste.',
      committeeType: 'Social Impact Cell',
      logoFileId: committeeFiles[9]._id,
      isProfileComplete: true,
    }),
    Committee.create({
      userId: committeeUsers[8]._id,
      name: 'Management & Strategy Association',
      college: {
        name: 'IIM Indore (IPM)',
        location: { city: 'Indore', state: 'Madhya Pradesh', country: 'India' },
      },
      description: 'Undergraduate business consulting fraternity organizing national brand case competitions, venture pitch decks, and C-suite fireside conclaves.',
      committeeType: 'Management Club',
      logoFileId: committeeFiles[10]._id,
      isProfileComplete: true,
    }),
  ]);

  console.log(`  ✓ Created 10 Company Profiles and 9 Committee Profiles`);

  console.log('\n[4/12] Creating 18 Varied Events Across Categories & Statuses...');

  const now = Date.now();
  const dayMs = 86400000;

  const eventSpecs = [
    // 0: Hero Event
    {
      committee: committees[0],
      title: 'E-Summit 2026: Genesis of Innovation',
      slug: 'e-summit-2026',
      description: 'Flagship annual entrepreneurship conclave featuring 50+ startup pitch tracks, venture capitalist roundtables, hackathons, and corporate mentorship suites.',
      category: 'Entrepreneurship',
      eventType: 'Summit',
      eventDate: new Date(now + 30 * dayMs),
      endDate: new Date(now + 32 * dayMs),
      status: EVENT_STATUS.PUBLISHED,
      city: 'Mumbai',
      expectedAudience: { min: 4000, max: 7000 },
      estimatedReach: 150000,
      bannerFileId: eventBannerFiles[0]._id,
    },
    // 1: Revels MIT
    {
      committee: committees[1],
      title: 'Revels 2026: Symphonies of Tomorrow',
      slug: 'revels-2026',
      description: 'Four-day national cultural festival featuring star pro-nights, battle of the bands, couture fashion leagues, and 40+ artistic tournaments.',
      category: 'Cultural',
      eventType: 'Festival',
      eventDate: new Date(now + 15 * dayMs),
      endDate: new Date(now + 19 * dayMs),
      status: EVENT_STATUS.PUBLISHED,
      city: 'Manipal',
      expectedAudience: { min: 14000, max: 20000 },
      estimatedReach: 300000,
      bannerFileId: eventBannerFiles[1]._id,
    },
    // 2: Apogee HackCon BITS
    {
      committee: committees[2],
      title: 'Apogee HackCon: 36-Hour National Hackathon',
      slug: 'apogee-hackcon-2026',
      description: 'Intense 36-hour sprint bringing together 1,200 handpicked developers and hardware builders creating real-world software across Web3, AI, and Fintech.',
      category: 'Technical',
      eventType: 'Hackathon',
      eventDate: new Date(now + 25 * dayMs),
      endDate: new Date(now + 27 * dayMs),
      status: EVENT_STATUS.PUBLISHED,
      city: 'Pilani',
      expectedAudience: { min: 1000, max: 1500 },
      estimatedReach: 80000,
      bannerFileId: eventBannerFiles[2]._id,
    },
    // 3: RoboWars DTU
    {
      committee: committees[3],
      title: 'RoboWars 2026: Heavyweight Combat Arena',
      slug: 'robowars-conclave-2026',
      description: 'India\'s premier collegiate combat robotics showdown with 60kg and 30kg combat bots, pneumatic flippers, autonomous drone racing, and robotics showcases.',
      category: 'Robotics',
      eventType: 'Competition',
      eventDate: new Date(now + 40 * dayMs),
      endDate: new Date(now + 42 * dayMs),
      status: EVENT_STATUS.PUBLISHED,
      city: 'Delhi',
      expectedAudience: { min: 3500, max: 5500 },
      estimatedReach: 120000,
      bannerFileId: eventBannerFiles[3]._id,
    },
    // 4: National FinCon SRCC
    {
      committee: committees[4],
      title: 'National Finance Conclave & M&A Summit 2026',
      slug: 'national-fincon-2026',
      description: 'The definitive undergraduate financial summit with investment banking case studies, mock algorithmic trading floors, and CFO leadership panels.',
      category: 'Management',
      eventType: 'Conference',
      eventDate: new Date(now + 20 * dayMs),
      endDate: new Date(now + 21 * dayMs),
      status: EVENT_STATUS.PUBLISHED,
      city: 'Delhi',
      expectedAudience: { min: 2000, max: 3000 },
      estimatedReach: 65000,
      bannerFileId: eventBannerFiles[4]._id,
    },
    // 5: Arena Games IIT BHU
    {
      committee: committees[5],
      title: 'Arena 2026: All-India Inter-Collegiate Games',
      slug: 'spardha-games-2026',
      description: 'Annual sporting spectacle gathering 4,000 varsity athletes across track & field, basketball, cricket, badminton, football, and powerlifting arenas.',
      category: 'Sports',
      eventType: 'Sports',
      eventDate: new Date(now + 35 * dayMs),
      endDate: new Date(now + 38 * dayMs),
      status: EVENT_STATUS.PUBLISHED,
      city: 'Varanasi',
      expectedAudience: { min: 4500, max: 6500 },
      estimatedReach: 95000,
      bannerFileId: eventBannerFiles[5]._id,
    },
    // 6: CurtainCall Drama St. Xavier's
    {
      committee: committees[6],
      title: 'CurtainCall National One-Act Drama Festival',
      slug: 'curtaincall-drama-2026',
      description: 'Prestigious national theatrical tournament convening 30 collegiate troupes staging original scripts, experimental mime, and classical adaptations.',
      category: 'Fine Arts',
      eventType: 'Competition',
      eventDate: new Date(now + 18 * dayMs),
      endDate: new Date(now + 20 * dayMs),
      status: EVENT_STATUS.PUBLISHED,
      city: 'Mumbai',
      expectedAudience: { min: 2500, max: 4000 },
      estimatedReach: 50000,
      bannerFileId: eventBannerFiles[6]._id,
    },
    // 7: Enactus DU Impact Summit
    {
      committee: committees[7],
      title: 'Global Sustainability & Social Impact Expo 2026',
      slug: 'enactus-impact-summit-2026',
      description: 'Action-oriented conclave showcasing 40 student-led social enterprises working on ESG, rural livelihoods, clean tech, and fair-trade initiatives.',
      category: 'Social Impact',
      eventType: 'Expo',
      eventDate: new Date(now + 45 * dayMs),
      endDate: new Date(now + 46 * dayMs),
      status: EVENT_STATUS.PUBLISHED,
      city: 'Delhi',
      expectedAudience: { min: 2000, max: 3500 },
      estimatedReach: 75000,
      bannerFileId: eventBannerFiles[7]._id,
    },
    // 8: Vanguard Case League IIM Indore
    {
      committee: committees[8],
      title: 'Vanguard National Business Case League 2026',
      slug: 'vanguard-consulting-2026',
      description: 'Strategy competition testing corporate problem solving, turnaround plans, and live client consulting for undergraduate management leaders.',
      category: 'Management',
      eventType: 'Competition',
      eventDate: new Date(now + 28 * dayMs),
      endDate: new Date(now + 29 * dayMs),
      status: EVENT_STATUS.PUBLISHED,
      city: 'Indore',
      expectedAudience: { min: 1500, max: 2200 },
      estimatedReach: 45000,
      bannerFileId: eventBannerFiles[8]._id,
    },
    // 9: AlgoByte BITS
    {
      committee: committees[2],
      title: 'AlgoByte 2026: Grand Algorithmic Invitational',
      slug: 'algobyte-open-2026',
      description: 'High-speed competitive programming tournament featuring ICPC-format heats, dynamic programming challenges, and corporate recruiting showcases.',
      category: 'Technical',
      eventType: 'Competition',
      eventDate: new Date(now + 50 * dayMs),
      endDate: new Date(now + 51 * dayMs),
      status: EVENT_STATUS.PUBLISHED,
      city: 'Pilani',
      expectedAudience: { min: 1200, max: 1800 },
      estimatedReach: 60000,
      bannerFileId: eventBannerFiles[9]._id,
    },
    // 10: PitchForge E-Cell
    {
      committee: committees[0],
      title: 'PitchForge: Seed Stage Angel Demo Day',
      slug: 'pitchforge-incubator-2026',
      description: 'Exclusive pitch showcase connecting 25 pre-seed student startups with angel syndicates, institutional venture funds, and corporate venture capital.',
      category: 'Entrepreneurship',
      eventType: 'Summit',
      eventDate: new Date(now + 60 * dayMs),
      endDate: new Date(now + 61 * dayMs),
      status: EVENT_STATUS.PUBLISHED,
      city: 'Mumbai',
      expectedAudience: { min: 1500, max: 2500 },
      estimatedReach: 90000,
      bannerFileId: eventBannerFiles[10]._id,
    },
    // 11: Rhythm Revels
    {
      committee: committees[1],
      title: 'Rhythm & Rhapsody: Western Music Conclave',
      slug: 'rhythm-rhapsody-2026',
      description: 'Inter-collegiate battle of acoustics, jazz ensembles, and contemporary bands culminating in an electric festival amphitheater showcase.',
      category: 'Cultural',
      eventType: 'Festival',
      eventDate: new Date(now + 16 * dayMs),
      endDate: new Date(now + 17 * dayMs),
      status: EVENT_STATUS.PUBLISHED,
      city: 'Manipal',
      expectedAudience: { min: 6000, max: 9500 },
      estimatedReach: 180000,
      bannerFileId: eventBannerFiles[11]._id,
    },
    // 12: InnoVenture (ONGOING)
    {
      committee: committees[0],
      title: 'InnoVenture 48-Hour Campus Ideathon',
      slug: 'innoventure-ideathon-2026',
      description: 'Live hack-and-ideate weekend ongoing across campus laboratories and collaborative incubators.',
      category: 'Entrepreneurship',
      eventType: 'Hackathon',
      eventDate: new Date(now - 1 * dayMs),
      endDate: new Date(now + 1 * dayMs),
      status: EVENT_STATUS.ONGOING,
      city: 'Mumbai',
      expectedAudience: { min: 600, max: 1000 },
      estimatedReach: 35000,
      bannerFileId: eventBannerFiles[12]._id,
    },
    // 13: TechnoSprint (COMPLETED)
    {
      committee: committees[2],
      title: 'TechnoSprint Autumn Invitational 2025',
      slug: 'technosprint-autumn-2025',
      description: 'Concluded autumn collegiate developer summit and open-source sprint.',
      category: 'Technical',
      eventType: 'Conference',
      eventDate: new Date(now - 60 * dayMs),
      endDate: new Date(now - 58 * dayMs),
      status: EVENT_STATUS.COMPLETED,
      city: 'Pilani',
      expectedAudience: { min: 900, max: 1300 },
      estimatedReach: 40000,
      bannerFileId: eventBannerFiles[13]._id,
    },
    // 14: CampusSports League (ARCHIVED)
    {
      committee: committees[5],
      title: 'Winter Collegiate Cricket Trophy 2025',
      slug: 'campussports-league-2025',
      description: 'Archived winter tournament records from the 2025 inter-collegiate cricket season.',
      category: 'Sports',
      eventType: 'Sports',
      eventDate: new Date(now - 90 * dayMs),
      endDate: new Date(now - 85 * dayMs),
      status: EVENT_STATUS.ARCHIVED,
      city: 'Varanasi',
      expectedAudience: { min: 2500, max: 3500 },
      estimatedReach: 50000,
      bannerFileId: eventBannerFiles[14]._id,
    },
    // 15: FutureFounders (DRAFT)
    {
      committee: committees[0],
      title: 'FutureFounders Summer Pre-Incubation Cohort',
      slug: 'futurefounders-bootcamp-2026',
      description: 'Draft curriculum and sponsorship prospectus for upcoming summer incubator cohort.',
      category: 'Entrepreneurship',
      eventType: 'Summit',
      eventDate: new Date(now + 75 * dayMs),
      endDate: new Date(now + 85 * dayMs),
      status: EVENT_STATUS.DRAFT,
      city: 'Mumbai',
      expectedAudience: { min: 300, max: 600 },
      estimatedReach: 20000,
      bannerFileId: eventBannerFiles[15]._id,
    },
    // 16: EcoPulse Enactus
    {
      committee: committees[7],
      title: 'EcoPulse CleanTech Innovation Challenge',
      slug: 'ecopulse-hack-2026',
      description: 'Collegiate competition designing circular economy prototypes, solar micro-grids, and decentralized composting units.',
      category: 'Social Impact',
      eventType: 'Competition',
      eventDate: new Date(now + 38 * dayMs),
      endDate: new Date(now + 39 * dayMs),
      status: EVENT_STATUS.PUBLISHED,
      city: 'Delhi',
      expectedAudience: { min: 1200, max: 2000 },
      estimatedReach: 55000,
      bannerFileId: eventBannerFiles[16]._id,
    },
    // 17: Proscenium St. Xavier's
    {
      committee: committees[6],
      title: 'Proscenium Street Play Championship',
      slug: 'proscenium-theatre-2026',
      description: 'Electrifying open-air street play contest spotlighting social reform, political satire, and civic consciousness.',
      category: 'Cultural',
      eventType: 'Competition',
      eventDate: new Date(now + 22 * dayMs),
      endDate: new Date(now + 23 * dayMs),
      status: EVENT_STATUS.PUBLISHED,
      city: 'Mumbai',
      expectedAudience: { min: 2000, max: 3000 },
      estimatedReach: 40000,
      bannerFileId: eventBannerFiles[17]._id,
    },
  ];

  const events = await Promise.all(
    eventSpecs.map((spec) =>
      Event.create({
        committeeId: spec.committee._id,
        title: spec.title,
        slug: spec.slug,
        description: spec.description,
        category: spec.category,
        eventType: spec.eventType,
        eventDate: spec.eventDate,
        endDate: spec.endDate,
        status: spec.status,
        publishedAt: spec.status === EVENT_STATUS.PUBLISHED ? new Date(now - 10 * dayMs) : null,
        location: {
          mode: EVENT_LOCATION_MODE.PHYSICAL,
          venue: `${spec.committee.college.name} Main Campus`,
          city: spec.city,
          state: spec.committee.college.location.state || 'Maharashtra',
          country: 'India',
        },
        expectedAudience: spec.expectedAudience,
        estimatedReach: spec.estimatedReach,
        bannerFileId: spec.bannerFileId,
        tags: [spec.category.toLowerCase(), spec.eventType.toLowerCase(), 'campus', 'pitch-2026'],
      })
    )
  );

  console.log(`  ✓ Created 18 Events (13 Published, 1 Ongoing, 1 Completed, 1 Draft, 2 Archived)`);

  console.log('\n[5/12] Creating 32 Sponsorship Packages Across Events...');

  // Create varied packages
  const packageSpecs = [
    // Packages for E-Summit 2026 (Event 0 - Hero)
    {
      event: events[0],
      title: 'Title Partner',
      description: 'Exclusive naming rights across main auditoriums, digital livestreams, delegate kits, and pre-event national press releases.',
      contributionTypes: ['CASH', 'MERCHANDISE'],
      cashRequirement: { amount: 500000, currency: 'INR' },
      nonCashRequirements: [{ type: 'MERCHANDISE', description: '500 Branded Founder Hoodies', quantity: 500, unit: 'hoodies' }],
      benefits: [
        { title: 'Naming Rights', description: 'Event presented as "E-Summit Presented by Sponsor"' },
        { title: 'Keynote Address', description: '20-minute inaugural keynote by C-Suite executive' },
        { title: 'Expo Stall', description: '12x12 prime front-row booth in Grand Exhibition Atrium' },
      ],
      availability: 1,
    },
    {
      event: events[0],
      title: 'Powered By Partner',
      description: 'Co-branded digital exposure on all competition certificates, badges, and campus hoarding displays.',
      contributionTypes: ['CASH', 'PRODUCT'],
      cashRequirement: { amount: 250000, currency: 'INR' },
      benefits: [
        { title: 'Stage Banner', description: 'Logo on Stage backdrop wings' },
        { title: 'Product Sampling', description: 'Direct distribution in registration kits' },
      ],
      availability: 2,
    },
    {
      event: events[0],
      title: 'Hackathon Track Sponsor',
      description: 'Exclusive naming rights for the 24-hour venture prototype track with dedicated mentors.',
      contributionTypes: ['CASH', 'SERVICE'],
      cashRequirement: { amount: 120000, currency: 'INR' },
      benefits: [{ title: 'Track Naming', description: 'Exclusive problem statement track naming' }],
      availability: 3,
    },
    // Packages for Revels 2026 (Event 1)
    {
      event: events[1],
      title: 'Beverage & Hydration Partner',
      description: 'Exclusive rights to supply beverages, sampling kiosks, and chill-zones across festival quads.',
      contributionTypes: ['CASH', 'BEVERAGE'],
      cashRequirement: { amount: 150000, currency: 'INR' },
      nonCashRequirements: [{ type: 'BEVERAGE', description: '3,000 chilled beverage cans', quantity: 3000, unit: 'cans' }],
      benefits: [
        { title: 'Exclusive Kiosks', description: '3 prime central sampling stalls' },
        { title: 'Pro-Night Screens', description: 'Video advertisements between musical artist sets' },
      ],
      availability: 1,
    },
    {
      event: events[1],
      title: 'Silver Associate Partner',
      description: 'Digital brand awareness and logo placement on all cultural tickets and online schedules.',
      contributionTypes: ['CASH'],
      cashRequirement: { amount: 80000, currency: 'INR' },
      benefits: [{ title: 'Social Media', description: '3 dedicated Instagram reel features' }],
      availability: 4,
    },
    // Packages for Apogee HackCon (Event 2)
    {
      event: events[2],
      title: 'Cloud & Compute Partner',
      description: 'Sponsor the developer infrastructure, API credits, and technical awards for 1,200 builders.',
      contributionTypes: ['CASH', 'SERVICE'],
      cashRequirement: { amount: 150000, currency: 'INR' },
      benefits: [
        { title: 'Workshop Slot', description: '1-hour technical workshop and API demo' },
        { title: 'API Bounty', description: 'Exclusive cash bounty for best build using sponsor tooling' },
      ],
      availability: 2,
    },
    {
      event: events[2],
      title: 'Merchandise & Swag Partner',
      description: 'Supply custom tees, stickers, and developer backpacks for attendees.',
      contributionTypes: ['MERCHANDISE'],
      cashRequirement: { amount: 0, currency: 'INR' },
      nonCashRequirements: [{ type: 'MERCHANDISE', description: '1,200 developer kits', quantity: 1200, unit: 'kits' }],
      benefits: [{ title: 'Logo on Tees', description: 'Sponsor logo prominently on official hacker t-shirts' }],
      availability: 1,
    },
    // Packages for RoboWars DTU (Event 3)
    {
      event: events[3],
      title: 'Title Combat Sponsor',
      description: 'Naming rights for the steel battle cage arena and trophy ceremony.',
      contributionTypes: ['CASH'],
      cashRequirement: { amount: 200000, currency: 'INR' },
      benefits: [{ title: 'Arena Perimeter', description: 'Prominent safety glass arena banners' }],
      availability: 1,
    },
    {
      event: events[3],
      title: 'Hardware Tools & Equipment Partner',
      description: 'Supply pit-stop repair tools, batteries, and soldering stations.',
      contributionTypes: ['EQUIPMENT'],
      cashRequirement: { amount: 0, currency: 'INR' },
      nonCashRequirements: [{ type: 'EQUIPMENT', description: 'Power toolkits and welding supplies', quantity: 15, unit: 'kits' }],
      benefits: [{ title: 'Pit Stop Branding', description: 'Official Pit Area presented by Sponsor' }],
      availability: 1,
    },
    // Packages for FinCon SRCC (Event 4)
    {
      event: events[4],
      title: 'Financial Markets Gold Partner',
      description: 'Exclusive sponsorship of the flagship trading simulation and valuation conclave.',
      contributionTypes: ['CASH'],
      cashRequirement: { amount: 175000, currency: 'INR' },
      benefits: [{ title: 'Judge Panel', description: 'Senior analyst on grand finale judging panel' }],
      availability: 2,
    },
    {
      event: events[4],
      title: 'Gift & Hamper Partner',
      description: 'Executive gift hampers for keynote speakers and winning delegates.',
      contributionTypes: ['GIFT_HAMPER'],
      cashRequirement: { amount: 0, currency: 'INR' },
      nonCashRequirements: [{ type: 'GIFT_HAMPER', description: 'Curated corporate hampers', quantity: 50, unit: 'hampers' }],
      benefits: [{ title: 'Hamper Inserts', description: 'Company brochures and luxury packaging branding' }],
      availability: 1,
    },
    // Packages for Arena Games IIT BHU (Event 5)
    {
      event: events[5],
      title: 'Official Nutrition & Recovery Partner',
      description: 'Hydration and protein replenishment across track, court, and stadium locker rooms.',
      contributionTypes: ['CASH', 'BEVERAGE', 'PRODUCT'],
      cashRequirement: { amount: 100000, currency: 'INR' },
      nonCashRequirements: [{ type: 'BEVERAGE', description: '5,000 electrolyte drinks', quantity: 5000, unit: 'bottles' }],
      benefits: [{ title: 'Court Branding', description: 'A-Frame field-side banners' }],
      availability: 1,
    },
    {
      event: events[5],
      title: 'Athletic Kit Sponsor',
      description: 'Branded tournament jerseys for 500 varsity captains.',
      contributionTypes: ['MERCHANDISE'],
      cashRequirement: { amount: 0, currency: 'INR' },
      nonCashRequirements: [{ type: 'MERCHANDISE', description: '500 quick-dry athletic jerseys', quantity: 500, unit: 'jerseys' }],
      benefits: [{ title: 'Jersey Chest Logo', description: 'Official chest sponsor on match day kits' }],
      availability: 1,
    },
    // Packages for CurtainCall Drama (Event 6)
    {
      event: events[6],
      title: 'Stage & Production Partner',
      description: 'Support theater sound engineering, acoustic setup, and stage lighting.',
      contributionTypes: ['CASH', 'VENUE'],
      cashRequirement: { amount: 90000, currency: 'INR' },
      benefits: [{ title: 'Curtain Banners', description: 'Main stage proscenium banner and souvenir brochure page' }],
      availability: 2,
    },
    // Packages for Enactus DU Impact (Event 7)
    {
      event: events[7],
      title: 'Eco-Champion Impact Partner',
      description: 'Support youth social entrepreneurs and circular waste pilot projects.',
      contributionTypes: ['CASH', 'SERVICE'],
      cashRequirement: { amount: 125000, currency: 'INR' },
      benefits: [{ title: 'Impact Report', description: 'Dedicated co-branded case study in National Impact Whitepaper' }],
      availability: 2,
    },
    // Packages for Vanguard Consulting (Event 8)
    {
      event: events[8],
      title: 'Corporate Strategy Partner',
      description: 'Title sponsor of the case championship with direct resume drop access.',
      contributionTypes: ['CASH'],
      cashRequirement: { amount: 110000, currency: 'INR' },
      benefits: [{ title: 'Resume Book', description: 'Exclusive access to top 100 finalist candidate CVs' }],
      availability: 2,
    },
    // Packages for AlgoByte (Event 9)
    {
      event: events[9],
      title: 'Title Prize Pool Sponsor',
      description: 'Fund cash prizes for the top 10 national algorithmic champions.',
      contributionTypes: ['CASH'],
      cashRequirement: { amount: 130000, currency: 'INR' },
      benefits: [{ title: 'Problem Co-Author', description: 'Custom problem statement branded with company engineering theme' }],
      availability: 1,
    },
    // Packages for PitchForge (Event 10)
    {
      event: events[10],
      title: 'Angel Syndicate Partner',
      description: 'Exclusive VC and investor lounge branding with VIP demo table.',
      contributionTypes: ['CASH'],
      cashRequirement: { amount: 160000, currency: 'INR' },
      benefits: [{ title: 'VIP Table', description: 'Reserved front-row pitch judging table' }],
      availability: 3,
    },
    // Packages for Rhythm & Rhapsody (Event 11)
    {
      event: events[11],
      title: 'Sound & Amplification Partner',
      description: 'Co-sponsor festival acoustic engineering and live artist stages.',
      contributionTypes: ['CASH', 'EQUIPMENT'],
      cashRequirement: { amount: 95000, currency: 'INR' },
      benefits: [{ title: 'Stage Wings', description: 'Stage wing vertical illumination panels' }],
      availability: 2,
    },
    // Packages for InnoVenture (Event 12)
    {
      event: events[12],
      title: 'Ideathon Food & Fuel Partner',
      description: 'Provide meals and midnight snacks for 800 overnight ideathon builders.',
      contributionTypes: ['FOOD', 'BEVERAGE'],
      cashRequirement: { amount: 0, currency: 'INR' },
      nonCashRequirements: [
        { type: 'FOOD', description: '800 midnight snack packs', quantity: 800, unit: 'packs' },
        { type: 'BEVERAGE', description: '1,500 cold drinks', quantity: 1500, unit: 'cans' },
      ],
      benefits: [{ title: 'Cafeteria Branding', description: 'Branded dining halls and midnight food trucks' }],
      availability: 1,
    },
    // Packages for EcoPulse (Event 16)
    {
      event: events[16],
      title: 'Clean Mobility Partner',
      description: 'Showcase EV charging stations and provide zero-emission campus shuttles.',
      contributionTypes: ['CASH', 'TRANSPORTATION'],
      cashRequirement: { amount: 75000, currency: 'INR' },
      nonCashRequirements: [{ type: 'TRANSPORTATION', description: '10 Electric shuttle rides', quantity: 10, unit: 'vehicles' }],
      benefits: [{ title: 'EV Test Track', description: 'Designated outdoor test ride zone on campus' }],
      availability: 1,
    },
    // Packages for Proscenium (Event 17)
    {
      event: events[17],
      title: 'Community Arts Partner',
      description: 'Support street theater infrastructure and sound equipment.',
      contributionTypes: ['CASH'],
      cashRequirement: { amount: 50000, currency: 'INR' },
      benefits: [{ title: 'Amphitheatre Posters', description: 'Poster gallery across quad walkways' }],
      availability: 3,
    },
  ];

  // Add more packages up to 32
  for (let i = 0; i < events.length; i++) {
    if (!packageSpecs.some((p) => p.event._id.equals(events[i]._id))) {
      packageSpecs.push({
        event: events[i],
        title: 'Associate Event Partner',
        description: 'Comprehensive digital promotions, on-ground banners, and community visibility.',
        contributionTypes: ['CASH'],
        cashRequirement: { amount: 50000, currency: 'INR' },
        benefits: [{ title: 'Digital Shoutout', description: 'Official partner social media mention' }],
        availability: 5,
      });
    }
  }

  // Ensure 32 packages total
  while (packageSpecs.length < 32) {
    const ev = events[packageSpecs.length % events.length];
    packageSpecs.push({
      event: ev,
      title: `Campus Engagement Partner Tier ${packageSpecs.length + 1}`,
      description: 'Promotional table and targeted student demographic visibility.',
      contributionTypes: ['CASH'],
      cashRequirement: { amount: 40000 + (packageSpecs.length * 2000), currency: 'INR' },
      benefits: [{ title: 'Campus Kiosk', description: 'Standee and distribution space' }],
      availability: 3,
    });
  }

  const packages = await Promise.all(
    packageSpecs.map((spec) =>
      SponsorshipPackage.create({
        eventId: spec.event._id,
        title: spec.title,
        description: spec.description,
        contributionTypes: spec.contributionTypes,
        cashRequirement: spec.cashRequirement || { amount: 50000, currency: 'INR' },
        nonCashRequirements: spec.nonCashRequirements || [],
        benefits: spec.benefits || [{ title: 'Standard Partner', description: 'Logo on website' }],
        availability: spec.availability || 2,
        status: SPONSORSHIP_PACKAGE_STATUS.AVAILABLE,
      })
    )
  );

  console.log(`  ✓ Created ${packages.length} Sponsorship Packages covering all 11 contribution types`);

  console.log('\n[6/12] Creating Self-Reported External Histories...');

  await Promise.all([
    SelfReportedHistory.create({
      ownerType: 'COMPANY',
      ownerId: companies[0]._id,
      title: 'HackAsia 2024 Title Sponsorship',
      description: 'Title partner of Singapore collegiate hackathon prior to joining PITCH marketplace.',
      eventName: 'HackAsia 2024',
      partnerName: 'National University of Singapore',
      date: new Date('2024-09-15'),
      verificationStatus: 'SELF_REPORTED',
    }),
    SelfReportedHistory.create({
      ownerType: 'COMMITTEE',
      ownerId: committees[0]._id,
      title: 'E-Summit 2023 Enterprise Collaboration',
      description: 'Cloud partner collaboration for AWS startup credits in 2023.',
      eventName: 'E-Summit 2023',
      partnerName: 'Amazon Web Services',
      date: new Date('2023-02-10'),
      verificationStatus: 'SELF_REPORTED',
    }),
    SelfReportedHistory.create({
      ownerType: 'COMPANY',
      ownerId: companies[2]._id,
      title: 'SRCC Global Business Conclave 2023',
      description: 'Keynote partner and equity trading lab sponsor.',
      eventName: 'Global Business Conclave 2023',
      partnerName: 'Shri Ram College of Commerce',
      date: new Date('2023-11-20'),
      verificationStatus: 'SELF_REPORTED',
    }),
    SelfReportedHistory.create({
      ownerType: 'COMMITTEE',
      ownerId: committees[2]._id,
      title: 'Smart India Hackathon 2024 Node Host',
      description: 'Coordinated nodal center for 400 national hackathon participants.',
      eventName: 'Smart India Hackathon 2024',
      partnerName: 'Ministry of Education Innovation Cell',
      date: new Date('2024-12-05'),
      verificationStatus: 'SELF_REPORTED',
    }),
  ]);

  console.log('  ✓ Created 4 Self-Reported History records (strictly distinct from verified deals)');

  console.log('\n[7/12] Creating Interconnected Applications & Invitations...');

  // 24 Applications
  const applicationSpecs = [
    // Hero Application
    { event: events[0], company: companies[0], package: packages[0], status: APPLICATION_STATUS.ACCEPTED, message: 'TechCorp is excited to partner as the Title Partner for E-Summit 2026. We look forward to powering the developer tracks.' },
    { event: events[1], company: companies[1], package: packages[3], status: APPLICATION_STATUS.ACCEPTED, message: 'Velocity Energy Beverages requests official beverage rights for Revels 2026.' },
    { event: events[2], company: companies[4], package: packages[5], status: APPLICATION_STATUS.ACCEPTED, message: 'ByteWorks AI Labs proposes API credits and prize funding for Apogee HackCon.' },
    { event: events[3], company: companies[4], package: packages[7], status: APPLICATION_STATUS.ACCEPTED, message: 'ByteWorks would love to support the DTU RoboWars combat arena.' },
    { event: events[4], company: companies[2], package: packages[9], status: APPLICATION_STATUS.ACCEPTED, message: 'FinEdge desires to lead the financial trading simulation at National FinCon.' },
    { event: events[5], company: companies[1], package: packages[11], status: APPLICATION_STATUS.ACCEPTED, message: 'Velocity proposes complete hydration supply for 4,000 varsity athletes at Arena 2026.' },
    { event: events[6], company: companies[5], package: packages[13], status: APPLICATION_STATUS.ACCEPTED, message: 'UrbanKart will support backstage production and late-night snacks for theater troupes.' },
    { event: events[7], company: companies[6], package: packages[14], status: APPLICATION_STATUS.ACCEPTED, message: 'GreenGrid proposes clean mobility demo stations for the Enactus Impact Summit.' },
    { event: events[8], company: companies[2], package: packages[15], status: APPLICATION_STATUS.ACCEPTED, message: 'FinEdge seeks to evaluate student consulting decks in Vanguard Case League.' },
    { event: events[9], company: companies[0], package: packages[16], status: APPLICATION_STATUS.ACCEPTED, message: 'TechCorp offers algorithm challenge rewards for AlgoByte 2026.' },
    // Pending Applications (8)
    { event: events[0], company: companies[8], package: packages[1], status: APPLICATION_STATUS.PENDING, message: 'BrandSphere proposes creator podcast lounge at E-Summit.' },
    { event: events[1], company: companies[5], package: packages[4], status: APPLICATION_STATUS.PENDING, message: 'UrbanKart pop-up dark store kiosk request for festival arena.' },
    { event: events[2], company: companies[9], package: packages[6], status: APPLICATION_STATUS.PENDING, message: 'NextWave fellowship booth application for BITS hackathon.' },
    { event: events[3], company: companies[6], package: packages[8], status: APPLICATION_STATUS.PENDING, message: 'GreenGrid electric pit cart sponsor application.' },
    { event: events[4], company: companies[3], package: packages[10], status: APPLICATION_STATUS.PENDING, message: 'NovaPay student cashless band proposal for FinCon.' },
    { event: events[5], company: companies[7], package: packages[11], status: APPLICATION_STATUS.PENDING, message: 'CampusBrew pop-up cold brew stand at athletics pavilion.' },
    { event: events[7], company: companies[7], package: packages[14], status: APPLICATION_STATUS.PENDING, message: 'CampusBrew eco-friendly bean lounge proposal.' },
    { event: events[10], company: companies[3], package: packages[17], status: APPLICATION_STATUS.PENDING, message: 'NovaPay seed demo day sponsorship interest.' },
    // Rejected Applications (4)
    { event: events[0], company: companies[5], package: packages[0], status: APPLICATION_STATUS.REJECTED, message: 'UrbanKart title sponsor application (rejected due to exclusive category lock).' },
    { event: events[1], company: companies[2], package: packages[3], status: APPLICATION_STATUS.REJECTED, message: 'FinEdge beverage rights bid (rejected - category mismatch).' },
    { event: events[4], company: companies[1], package: packages[9], status: APPLICATION_STATUS.REJECTED, message: 'Velocity trading floor proposal (rejected by convenor).' },
    { event: events[6], company: companies[8], package: packages[13], status: APPLICATION_STATUS.REJECTED, message: 'BrandSphere talent screening application.' },
    // Withdrawn Applications (2)
    { event: events[2], company: companies[1], package: packages[5], status: APPLICATION_STATUS.WITHDRAWN, message: 'Velocity withdrew application due to scheduling shift.' },
    { event: events[8], company: companies[6], package: packages[15], status: APPLICATION_STATUS.WITHDRAWN, message: 'GreenGrid budget reallocation withdrawal.' },
  ];

  await Promise.all(
    applicationSpecs.map((spec) =>
      Application.create({
        eventId: spec.event._id,
        companyId: spec.company._id,
        packageId: spec.package?._id || null,
        message: spec.message,
        status: spec.status,
        proposedContribution: {
          types: spec.package?.contributionTypes || ['CASH'],
          cash: spec.package?.cashRequirement || { amount: 50000, currency: 'INR' },
          nonCash: spec.package?.nonCashRequirements || [],
        },
        respondedAt: spec.status !== APPLICATION_STATUS.PENDING ? new Date(now - 5 * dayMs) : null,
      })
    )
  );

  // 12 Invitations
  const invitationSpecs = [
    { event: events[0], committee: committees[0], company: companies[0], package: packages[0], status: INVITATION_STATUS.ACCEPTED, message: 'Dear TechCorp team, E-Cell IITB formally invites you to headline E-Summit 2026 as our Title Partner.' },
    { event: events[1], committee: committees[1], company: companies[1], package: packages[3], status: INVITATION_STATUS.ACCEPTED, message: 'Revels MIT invites Velocity Energy to be our exclusive beverage partner.' },
    { event: events[2], committee: committees[2], company: companies[4], package: packages[5], status: INVITATION_STATUS.ACCEPTED, message: 'DevSoc BITS Pilani invites ByteWorks AI to mentor and sponsor HackCon.' },
    { event: events[4], committee: committees[4], company: companies[2], package: packages[9], status: INVITATION_STATUS.ACCEPTED, message: 'FinClub SRCC invites FinEdge to headline National FinCon 2026.' },
    // Pending Invitations (5)
    { event: events[0], committee: committees[0], company: companies[3], package: packages[1], status: INVITATION_STATUS.PENDING, message: 'E-Cell invites NovaPay to explore the FinTech demo pavilion.' },
    { event: events[3], committee: committees[3], company: companies[0], package: packages[7], status: INVITATION_STATUS.PENDING, message: 'Robotics DTU invites TechCorp to sponsor cloud simulators.' },
    { event: events[5], committee: committees[5], company: companies[7], package: packages[11], status: INVITATION_STATUS.PENDING, message: 'Sports Council invites CampusBrew to set up stadium cafe.' },
    { event: events[7], committee: committees[7], company: companies[6], package: packages[14], status: INVITATION_STATUS.PENDING, message: 'Enactus DU invites GreenGrid to demonstrate EV fleet.' },
    { event: events[8], committee: committees[8], company: companies[9], package: packages[15], status: INVITATION_STATUS.PENDING, message: 'Management Club invites NextWave for fellowship fireside.' },
    // Declined (2)
    { event: events[1], committee: committees[1], company: companies[6], package: packages[4], status: INVITATION_STATUS.DECLINED, message: 'GreenGrid declined due to conflicting western region expo.' },
    { event: events[3], committee: committees[3], company: companies[5], package: packages[8], status: INVITATION_STATUS.DECLINED, message: 'UrbanKart declined DTU robotics invitation.' },
    // Expired (1)
    { event: events[6], committee: committees[6], company: companies[1], package: packages[13], status: INVITATION_STATUS.EXPIRED, message: 'Invitation expired after 14 days without corporate response.' },
  ];

  await Promise.all(
    invitationSpecs.map((spec) =>
      Invitation.create({
        eventId: spec.event._id,
        committeeId: spec.committee._id,
        companyId: spec.company._id,
        packageId: spec.package?._id || null,
        message: spec.message,
        status: spec.status,
        expiresAt: new Date(now + 14 * dayMs),
        respondedAt: spec.status !== INVITATION_STATUS.PENDING ? new Date(now - 4 * dayMs) : null,
      })
    )
  );

  console.log(`  ✓ Created 24 Applications (8 Pending, 10 Accepted, 4 Rejected, 2 Withdrawn)`);
  console.log(`  ✓ Created 12 Invitations (5 Pending, 4 Accepted, 2 Declined, 1 Expired)`);

  console.log('\n[8/12] Creating 10 Active Business Conversations & 95 Realistic Messages...');

  // 10 Conversations
  const conversationSpecs = [
    { company: companies[0], committee: committees[0], event: events[0] }, // Hero Conv
    { company: companies[1], committee: committees[1], event: events[1] },
    { company: companies[4], committee: committees[2], event: events[2] },
    { company: companies[4], committee: committees[3], event: events[3] },
    { company: companies[2], committee: committees[4], event: events[4] },
    { company: companies[1], committee: committees[5], event: events[5] },
    { company: companies[5], committee: committees[6], event: events[6] },
    { company: companies[6], committee: committees[7], event: events[16] },
    { company: companies[0], committee: committees[2], event: events[9] },
    { company: companies[3], committee: committees[0], event: events[10] },
  ];

  const conversations = await Promise.all(
    conversationSpecs.map((spec) =>
      Conversation.create({
        participantCompanyId: spec.company._id,
        participantCommitteeId: spec.committee._id,
        eventId: spec.event._id,
        status: CONVERSATION_STATUS.ACTIVE,
        lastMessageAt: new Date(now - 1 * dayMs),
      })
    )
  );

  // Generate realistic messages across conversations (total ~95)
  const allMessages = [];

  // Hero Conversation Messages (15 messages)
  const heroCompanyUser = companyUsers[0];
  const heroCommitteeUser = committeeUsers[0];
  const heroConv = conversations[0];

  const heroChat = [
    { sender: heroCompanyUser, type: MESSAGE_TYPE.TEXT, text: 'Hello Rohan! We reviewed the Title Partner prospectus for E-Summit 2026. TechCorp is very keen to collaborate.' },
    { sender: heroCommitteeUser, type: MESSAGE_TYPE.TEXT, text: 'Hi Aarav! Fantastic to hear from you. E-Cell IIT Bombay would be honored to have TechCorp headline this year\'s summit.' },
    { sender: heroCommitteeUser, type: MESSAGE_TYPE.EVENT_CARD, eventId: events[0]._id, text: 'Here is the formal event listing and demographic reach summary.' },
    { sender: heroCommitteeUser, type: MESSAGE_TYPE.PACKAGE_CARD, packageId: packages[0]._id, text: 'This is the verified Title Partner package specification.' },
    { sender: heroCompanyUser, type: MESSAGE_TYPE.TEXT, text: 'Our executive board has cleared ₹1,00,000 cash alongside 2,000 developer energy beverages and 500 tech hoodies for hackers.' },
    { sender: heroCommitteeUser, type: MESSAGE_TYPE.TEXT, text: 'That aligns wonderfully with our summit requirements. Could you also provide senior engineers for our 24-hr hackathon mentor hours?' },
    { sender: heroCompanyUser, type: MESSAGE_TYPE.TEXT, text: 'Yes! We can deploy 4 staff AI engineers for direct mentoring and deliver a 30-minute keynote on GenAI Infrastructure.' },
    { sender: heroCompanyUser, type: MESSAGE_TYPE.PROPOSAL, text: 'Submitting Proposal v1 with commercial terms and merchandise deliverables.' },
    { sender: heroCommitteeUser, type: MESSAGE_TYPE.COUNTER_PROPOSAL, text: 'Counter-Proposal v2 submitted: Included 12x12 prime booth in Central Quad + keynote slot.' },
    { sender: heroCompanyUser, type: MESSAGE_TYPE.TEXT, text: 'Counter-terms look great. We are happy to formally accept Proposal v3.' },
    { sender: heroCommitteeUser, type: MESSAGE_TYPE.TEXT, text: 'Commercial terms locked! Generating legal MoU container under PITCH_MOU_V1.' },
    { sender: heroCommitteeUser, type: MESSAGE_TYPE.MOU_CARD, text: 'MoU Version 1 generated and ready for digital signing.' },
    { sender: heroCommitteeUser, type: MESSAGE_TYPE.TEXT, text: 'E-Cell IIT Bombay has signed the agreement with verified document SHA-256 hash.' },
    { sender: heroCompanyUser, type: MESSAGE_TYPE.TEXT, text: 'TechCorp has countersigned! The deal is now EXECUTED and legally sealed.' },
    { sender: heroCommitteeUser, type: MESSAGE_TYPE.TEXT, text: 'All fulfillment deliverables (cash, cans, t-shirts, booth) verified successfully. Completed deal!' },
  ];

  for (let idx = 0; idx < heroChat.length; idx++) {
    const item = heroChat[idx];
    allMessages.push(
      Message.create({
        conversationId: heroConv._id,
        senderUserId: item.sender._id,
        type: item.type,
        text: item.text,
        eventId: item.eventId || null,
        packageId: item.packageId || null,
        createdAt: new Date(now - (20 - idx) * dayMs),
      })
    );
  }

  // Messages for remaining 9 conversations (~9 messages each = ~81 messages)
  for (let c = 1; c < conversations.length; c++) {
    const conv = conversations[c];
    const compUser = companyUsers[conversationSpecs[c].company.userId ? companyUsers.findIndex(u => u._id.equals(conversationSpecs[c].company.userId)) : 1] || companyUsers[1];
    const commUser = committeeUsers[conversationSpecs[c].committee.userId ? committeeUsers.findIndex(u => u._id.equals(conversationSpecs[c].committee.userId)) : 1] || committeeUsers[1];
    const ev = conversationSpecs[c].event;

    const convDialogue = [
      { sender: compUser, type: MESSAGE_TYPE.TEXT, text: `Hello! We are reaching out regarding sponsorship opportunities for ${ev.title}.` },
      { sender: commUser, type: MESSAGE_TYPE.TEXT, text: `Thank you for connecting! We are excited to share our sponsorship deck and tiers.` },
      { sender: commUser, type: MESSAGE_TYPE.EVENT_CARD, eventId: ev._id, text: `Overview card for ${ev.title}.` },
      { sender: compUser, type: MESSAGE_TYPE.TEXT, text: 'Could we discuss customized brand visibility and on-ground booth allocations?' },
      { sender: commUser, type: MESSAGE_TYPE.TEXT, text: 'Certainly! We offer prime campus booth positioning and high-engagement social media reels.' },
      { sender: compUser, type: MESSAGE_TYPE.CONTACT, text: 'Sharing our partnerships manager contact card for direct coordination.' },
      { sender: compUser, type: MESSAGE_TYPE.TEXT, text: 'We have submitted our formal proposal for review in the deals workspace.' },
      { sender: commUser, type: MESSAGE_TYPE.TEXT, text: 'Received and reviewed by the student convenor committee. Working on the agreement terms.' },
      { sender: commUser, type: MESSAGE_TYPE.SYSTEM, text: 'Negotiation milestone updated in PITCH deal room.' },
    ];

    for (let m = 0; m < convDialogue.length; m++) {
      const msgItem = convDialogue[m];
      allMessages.push(
        Message.create({
          conversationId: conv._id,
          senderUserId: msgItem.sender._id,
          type: msgItem.type,
          text: msgItem.text,
          eventId: msgItem.eventId || null,
          createdAt: new Date(now - (12 - m) * dayMs),
        })
      );
    }
  }

  await Promise.all(allMessages);
  console.log(`  ✓ Created 10 Conversations and ${allMessages.length} Messages utilizing rich card & negotiation message types`);

  console.log('\n[9/12] Creating 13 Deals Across All 13 Lifecycle States...');

  // 13 DEALS across every stage
  // Deal 0: INTERESTED
  // Deal 1: DISCUSSION
  // Deal 2: NEGOTIATING
  // Deal 3: PROPOSAL
  // Deal 4: COUNTER_PROPOSAL
  // Deal 5: AGREED
  // Deal 6: MOU_DRAFT
  // Deal 7: AWAITING_SIGNATURES
  // Deal 8: PARTIALLY_SIGNED
  // Deal 9: EXECUTED
  // Deal 10: FULFILLMENT
  // Deal 11 (Hero): COMPLETED
  // Deal 12: DISPUTED

  const deal0 = await Deal.create({
    eventId: events[0]._id,
    companyId: companies[8]._id,
    committeeId: committees[0]._id,
    conversationId: conversations[0]._id,
    status: DEAL_STATUS.INTERESTED,
    terms: 'Initial brand alignment interest in startup summits.',
  });

  const deal1 = await Deal.create({
    eventId: events[2]._id,
    companyId: companies[9]._id,
    committeeId: committees[2]._id,
    conversationId: conversations[2]._id,
    status: DEAL_STATUS.DISCUSSION,
    terms: 'Exploring educational fellowship booths and technical workshops.',
  });

  const deal2 = await Deal.create({
    eventId: events[3]._id,
    companyId: companies[4]._id,
    committeeId: committees[3]._id,
    conversationId: conversations[3]._id,
    status: DEAL_STATUS.NEGOTIATING,
    terms: 'Negotiating compute credits and robot arena hardware safety banners.',
  });

  const deal3 = await Deal.create({
    eventId: events[4]._id,
    companyId: companies[2]._id,
    committeeId: committees[4]._id,
    conversationId: conversations[4]._id,
    status: DEAL_STATUS.PROPOSAL,
    terms: 'Proposal under active review for SRCC FinCon trading room.',
  });

  const deal4 = await Deal.create({
    eventId: events[5]._id,
    companyId: companies[1]._id,
    committeeId: committees[5]._id,
    conversationId: conversations[5]._id,
    status: DEAL_STATUS.COUNTER_PROPOSAL,
    terms: 'Counter-offer submitted adjusting energy beverage crates from 4,000 to 5,000.',
  });

  const deal5 = await Deal.create({
    eventId: events[6]._id,
    companyId: companies[5]._id,
    committeeId: committees[6]._id,
    conversationId: conversations[6]._id,
    status: DEAL_STATUS.AGREED,
    agreedAt: new Date(now - 10 * dayMs),
    terms: 'Commercial terms agreed: ₹90,000 cash + backstage snack boxes.',
  });

  const deal6 = await Deal.create({
    eventId: events[16]._id,
    companyId: companies[6]._id,
    committeeId: committees[7]._id,
    conversationId: conversations[7]._id,
    status: DEAL_STATUS.MOU_DRAFT,
    agreedAt: new Date(now - 8 * dayMs),
    terms: 'Legal team compiling standard PITCH_MOU_V1 clauses for EV shuttle demos.',
  });

  const deal7 = await Deal.create({
    eventId: events[9]._id,
    companyId: companies[0]._id,
    committeeId: committees[2]._id,
    conversationId: conversations[8]._id,
    status: DEAL_STATUS.AWAITING_SIGNATURES,
    agreedAt: new Date(now - 7 * dayMs),
    terms: 'MoU Version 1 generated; dispatched for convenor and corporate signatures.',
  });

  const deal8 = await Deal.create({
    eventId: events[10]._id,
    companyId: companies[3]._id,
    committeeId: committees[0]._id,
    conversationId: conversations[9]._id,
    status: DEAL_STATUS.PARTIALLY_SIGNED,
    agreedAt: new Date(now - 6 * dayMs),
    terms: 'Committee has signed with digital consent; awaiting corporate countersignature.',
  });

  const deal9 = await Deal.create({
    eventId: events[8]._id,
    companyId: companies[2]._id,
    committeeId: committees[8]._id,
    status: DEAL_STATUS.EXECUTED,
    agreedAt: new Date(now - 14 * dayMs),
    executedAt: new Date(now - 12 * dayMs),
    terms: 'Fully executed legal contract: Vanguard Strategy Partnership.',
  });

  const deal10 = await Deal.create({
    eventId: events[1]._id,
    companyId: companies[1]._id,
    committeeId: committees[1]._id,
    conversationId: conversations[1]._id,
    status: DEAL_STATUS.FULFILLMENT,
    agreedAt: new Date(now - 20 * dayMs),
    executedAt: new Date(now - 18 * dayMs),
    terms: 'Active delivery of beverage crates, Central Quad kiosk construction, and banner reels.',
  });

  // Hero Deal (11): COMPLETED
  const deal11 = await Deal.create({
    eventId: events[0]._id,
    companyId: companies[0]._id,
    committeeId: committees[0]._id,
    conversationId: conversations[0]._id,
    status: DEAL_STATUS.COMPLETED,
    agreedAt: new Date(now - 26 * dayMs),
    executedAt: new Date(now - 24 * dayMs),
    completedAt: new Date(now - 3 * dayMs),
    contributions: {
      types: ['CASH', 'BEVERAGE', 'MERCHANDISE'],
      cash: { amount: 100000, currency: 'INR' },
      nonCash: [
        { type: 'BEVERAGE', name: 'Developer Energy Drinks', quantity: 2000, unit: 'cans', estimatedValue: 100000 },
        { type: 'MERCHANDISE', name: 'Branded Tech Tees', quantity: 500, unit: 'tees', estimatedValue: 75000 },
      ],
    },
    benefits: [
      { title: 'Title Naming Rights', description: 'Presented by TechCorp India' },
      { title: 'Keynote Address', description: '30-minute GenAI Infrastructure keynote' },
      { title: 'Expo Booth', description: '12x12 prime front-row booth' },
    ],
    terms: 'PITCH Master Commercial Agreement executed with 100% fulfillment verified.',
  });

  const deal12 = await Deal.create({
    eventId: events[1]._id,
    companyId: companies[5]._id,
    committeeId: committees[1]._id,
    status: DEAL_STATUS.DISPUTED,
    agreedAt: new Date(now - 15 * dayMs),
    executedAt: new Date(now - 13 * dayMs),
    terms: 'Kiosk stall reassigned to secondary wing; under formal mediation.',
  });

  const allDeals = [deal0, deal1, deal2, deal3, deal4, deal5, deal6, deal7, deal8, deal9, deal10, deal11, deal12];
  console.log(`  ✓ Created 13 Deals across all lifecycle states (INTERESTED through COMPLETED and DISPUTED)`);

  console.log('\n[10/12] Creating 21 Immutable Proposal Versions, Agreements, MoUs & Cryptographic Signatures...');

  // Proposals demonstrating immutable version history
  // Deal 3 (PROPOSAL): v1 (PENDING)
  const pDeal3_v1 = await Proposal.create({
    dealId: deal3._id,
    createdByUserId: companyUsers[2]._id,
    version: 1,
    contribution: {
      types: ['CASH'],
      cash: { amount: 150000, currency: 'INR' },
      nonCash: [],
    },
    benefits: [{ title: 'Trading Floor Branding', description: 'Banner above mock trading room' }],
    deliverables: [{ party: 'COMPANY', description: 'Disburse ₹1,50,000 cash grant by fest week' }],
    terms: 'Commercial grant terms for FinCon 2026.',
    status: PROPOSAL_STATUS.PENDING,
  });
  deal3.currentProposalId = pDeal3_v1._id;
  await deal3.save();

  // Deal 4 (COUNTER_PROPOSAL): v1 (SUPERSEDED) -> v2 (PENDING)
  const pDeal4_v1 = await Proposal.create({
    dealId: deal4._id,
    createdByUserId: companyUsers[1]._id,
    version: 1,
    contribution: {
      types: ['CASH', 'BEVERAGE'],
      cash: { amount: 80000, currency: 'INR' },
      nonCash: [{ type: 'BEVERAGE', name: 'Energy Cans', quantity: 3000, unit: 'cans', estimatedValue: 90000 }],
    },
    status: PROPOSAL_STATUS.SUPERSEDED,
    respondedAt: new Date(now - 6 * dayMs),
  });
  const pDeal4_v2 = await Proposal.create({
    dealId: deal4._id,
    createdByUserId: committeeUsers[5]._id,
    version: 2,
    basedOnProposalId: pDeal4_v1._id,
    contribution: {
      types: ['CASH', 'BEVERAGE'],
      cash: { amount: 100000, currency: 'INR' },
      nonCash: [{ type: 'BEVERAGE', name: 'Energy Cans', quantity: 5000, unit: 'cans', estimatedValue: 150000 }],
    },
    benefits: [{ title: 'Stadium Perimeter', description: 'A-Frame banners at varsity athletics arena' }],
    deliverables: [{ party: 'COMPANY', description: 'Supply 5,000 cans and ₹1,00,000 cash' }],
    status: PROPOSAL_STATUS.PENDING,
  });
  deal4.currentProposalId = pDeal4_v2._id;
  await deal4.save();

  // Deal 5 (AGREED): v1 (SUPERSEDED) -> v2 (SUPERSEDED) -> v3 (ACCEPTED)
  const pDeal5_v1 = await Proposal.create({
    dealId: deal5._id,
    createdByUserId: companyUsers[5]._id,
    version: 1,
    contribution: { types: ['CASH'], cash: { amount: 70000, currency: 'INR' } },
    status: PROPOSAL_STATUS.SUPERSEDED,
  });
  const pDeal5_v2 = await Proposal.create({
    dealId: deal5._id,
    createdByUserId: committeeUsers[6]._id,
    version: 2,
    basedOnProposalId: pDeal5_v1._id,
    contribution: { types: ['CASH', 'FOOD'], cash: { amount: 90000, currency: 'INR' }, nonCash: [{ type: 'FOOD', name: 'Snack Boxes', quantity: 200, unit: 'boxes', estimatedValue: 20000 }] },
    status: PROPOSAL_STATUS.SUPERSEDED,
  });
  const pDeal5_v3 = await Proposal.create({
    dealId: deal5._id,
    createdByUserId: companyUsers[5]._id,
    version: 3,
    basedOnProposalId: pDeal5_v2._id,
    contribution: { types: ['CASH', 'FOOD'], cash: { amount: 90000, currency: 'INR' }, nonCash: [{ type: 'FOOD', name: 'Snack Boxes', quantity: 200, unit: 'boxes', estimatedValue: 20000 }] },
    benefits: [{ title: 'Main Proscenium Banners', description: 'Theater brochure full page color ad' }],
    deliverables: [{ party: 'COMPANY', description: 'Disburse ₹90,000 and supply 200 food boxes' }],
    status: PROPOSAL_STATUS.ACCEPTED,
    respondedAt: new Date(now - 10 * dayMs),
  });
  deal5.currentProposalId = pDeal5_v3._id;

  // DealAgreement for Deal 5
  const daDeal5 = await DealAgreement.create({
    dealId: deal5._id,
    acceptedProposalId: pDeal5_v3._id,
    snapshot: {
      contributions: pDeal5_v3.contribution,
      benefits: pDeal5_v3.benefits,
      deliverables: pDeal5_v3.deliverables,
      paymentDetails: { beneficiaryName: 'St. Xavier\'s Dramatics', accountNumber: '998877665544', bankName: 'HDFC Bank', ifscCode: 'HDFC0001234', currency: 'INR' },
    },
    agreedBy: [
      { userId: companyUsers[5]._id, role: SIGNER_ROLE.COMPANY, agreedAt: new Date(now - 10 * dayMs) },
      { userId: committeeUsers[6]._id, role: SIGNER_ROLE.COMMITTEE, agreedAt: new Date(now - 10 * dayMs) },
    ],
  });
  deal5.agreedTermsId = daDeal5._id;
  await deal5.save();

  // Deal 6 (MOU_DRAFT): Accepted Proposal + Agreement + MoU
  const pDeal6_v1 = await Proposal.create({
    dealId: deal6._id,
    createdByUserId: companyUsers[6]._id,
    version: 1,
    contribution: { types: ['CASH', 'TRANSPORTATION'], cash: { amount: 75000, currency: 'INR' } },
    status: PROPOSAL_STATUS.ACCEPTED,
    respondedAt: new Date(now - 8 * dayMs),
  });
  const daDeal6 = await DealAgreement.create({
    dealId: deal6._id,
    acceptedProposalId: pDeal6_v1._id,
    snapshot: { contributions: pDeal6_v1.contribution, paymentDetails: { beneficiaryName: 'Enactus DU', accountNumber: '112233445566', bankName: 'SBI', ifscCode: 'SBIN0004321', currency: 'INR' } },
    agreedBy: [{ userId: companyUsers[6]._id, role: SIGNER_ROLE.COMPANY, agreedAt: new Date(now - 8 * dayMs) }],
  });
  const mouDeal6 = await Mou.create({ dealId: deal6._id, status: MOU_STATUS.DRAFT });
  deal6.currentProposalId = pDeal6_v1._id;
  deal6.agreedTermsId = daDeal6._id;
  deal6.mouId = mouDeal6._id;
  await deal6.save();

  // Helper for generating MoU Version with valid SHA-256
  const makeMouVersionWithHash = async (mou, agreement, versionNumber, status) => {
    const rawContent = `PITCH_MOU_V1|DEAL:${agreement.dealId}|VERSION:${versionNumber}|DATE:${now}`;
    const docHash = sha256(rawContent);

    const mv = await MouVersion.create({
      mouId: mou._id,
      versionNumber,
      sourceAgreementId: agreement._id,
      templateIdentifier: TEMPLATE_IDENTIFIER,
      documentHash: docHash,
      hashAlgorithm: HASH_ALGORITHM,
      agreementSnapshot: {
        parties: {
          committee: { organisationName: 'Student Committee', institutionAddress: 'Campus Address', legalContractingEntity: 'College Society' },
          company: { companyName: 'Corporate Sponsor', registeredAddress: 'Corporate Office' },
        },
      },
      status,
    });
    return mv;
  };

  // Deal 7 (AWAITING_SIGNATURES)
  const pDeal7_v1 = await Proposal.create({
    dealId: deal7._id,
    createdByUserId: companyUsers[0]._id,
    version: 1,
    contribution: { types: ['CASH'], cash: { amount: 130000, currency: 'INR' } },
    status: PROPOSAL_STATUS.ACCEPTED,
    respondedAt: new Date(now - 7 * dayMs),
  });
  const daDeal7 = await DealAgreement.create({
    dealId: deal7._id,
    acceptedProposalId: pDeal7_v1._id,
    snapshot: { contributions: pDeal7_v1.contribution, paymentDetails: { beneficiaryName: 'DevSoc BITS', accountNumber: '334455667788', bankName: 'ICICI Bank', ifscCode: 'ICIC0001122', currency: 'INR' } },
    agreedBy: [{ userId: companyUsers[0]._id, role: SIGNER_ROLE.COMPANY, agreedAt: new Date(now - 7 * dayMs) }],
  });
  const mouDeal7 = await Mou.create({ dealId: deal7._id, status: MOU_STATUS.PENDING_SIGNATURE });
  const mvDeal7 = await makeMouVersionWithHash(mouDeal7, daDeal7, 1, MOU_VERSION_STATUS.READY_FOR_SIGNATURE);
  mouDeal7.currentVersionId = mvDeal7._id;
  await mouDeal7.save();
  deal7.currentProposalId = pDeal7_v1._id;
  deal7.agreedTermsId = daDeal7._id;
  deal7.mouId = mouDeal7._id;
  await deal7.save();

  // Deal 8 (PARTIALLY_SIGNED): 1 signature
  const pDeal8_v1 = await Proposal.create({
    dealId: deal8._id,
    createdByUserId: companyUsers[3]._id,
    version: 1,
    contribution: { types: ['CASH'], cash: { amount: 160000, currency: 'INR' } },
    status: PROPOSAL_STATUS.ACCEPTED,
    respondedAt: new Date(now - 6 * dayMs),
  });
  const daDeal8 = await DealAgreement.create({
    dealId: deal8._id,
    acceptedProposalId: pDeal8_v1._id,
    snapshot: { contributions: pDeal8_v1.contribution, paymentDetails: { beneficiaryName: 'E-Cell IITB', accountNumber: '778899001122', bankName: 'Canara Bank', ifscCode: 'CNRB0001000', currency: 'INR' } },
    agreedBy: [{ userId: companyUsers[3]._id, role: SIGNER_ROLE.COMPANY, agreedAt: new Date(now - 6 * dayMs) }],
  });
  const mouDeal8 = await Mou.create({ dealId: deal8._id, status: MOU_STATUS.PARTIALLY_SIGNED });
  const mvDeal8 = await makeMouVersionWithHash(mouDeal8, daDeal8, 1, MOU_VERSION_STATUS.PARTIALLY_SIGNED);
  mouDeal8.currentVersionId = mvDeal8._id;
  await mouDeal8.save();
  // 1 Committee signature
  await Signature.create({
    mouId: mouDeal8._id,
    mouVersionId: mvDeal8._id,
    signerUserId: committeeUsers[0]._id,
    signerRole: SIGNER_ROLE.COMMITTEE,
    signatureType: SIGNATURE_TYPE.PLATFORM,
    signatureData: 'DIGITALLY_SIGNED_ROHAN_GUPTA_CONVENOR_IITB',
    consentText: 'I agree to the legally binding terms set forth in this Memorandum of Understanding.',
    documentHashAtSigning: mvDeal8.documentHash,
    hashAlgorithm: HASH_ALGORITHM,
    signedAt: new Date(now - 5 * dayMs),
  });
  deal8.currentProposalId = pDeal8_v1._id;
  deal8.agreedTermsId = daDeal8._id;
  deal8.mouId = mouDeal8._id;
  await deal8.save();

  // Helper for fully executed MoU (2 signatures)
  const createExecutedMouWorkflow = async (deal, companyUser, committeeUser, cashAmount) => {
    const prop = await Proposal.create({
      dealId: deal._id,
      createdByUserId: companyUser._id,
      version: 1,
      contribution: { types: ['CASH'], cash: { amount: cashAmount, currency: 'INR' } },
      status: PROPOSAL_STATUS.ACCEPTED,
      respondedAt: new Date(now - 22 * dayMs),
    });
    const agreement = await DealAgreement.create({
      dealId: deal._id,
      acceptedProposalId: prop._id,
      snapshot: { contributions: prop.contribution, paymentDetails: { beneficiaryName: 'College Event Account', accountNumber: '123456789012', bankName: 'Axis Bank', ifscCode: 'UTIB0000001', currency: 'INR' } },
      agreedBy: [
        { userId: companyUser._id, role: SIGNER_ROLE.COMPANY, agreedAt: new Date(now - 22 * dayMs) },
        { userId: committeeUser._id, role: SIGNER_ROLE.COMMITTEE, agreedAt: new Date(now - 22 * dayMs) },
      ],
    });
    const mou = await Mou.create({ dealId: deal._id, status: MOU_STATUS.EXECUTED });
    const mv = await makeMouVersionWithHash(mou, agreement, 1, MOU_VERSION_STATUS.EXECUTED);
    mou.currentVersionId = mv._id;
    await mou.save();

    // 2 signatures
    await Promise.all([
      Signature.create({
        mouId: mou._id,
        mouVersionId: mv._id,
        signerUserId: committeeUser._id,
        signerRole: SIGNER_ROLE.COMMITTEE,
        signatureType: SIGNATURE_TYPE.PLATFORM,
        signatureData: `DIGITALLY_SIGNED_${(committeeUser.email || 'COMMITTEE').toUpperCase().replace(/[^A-Z0-9]/g, '_')}`,
        consentText: 'I agree to the terms set forth in this Memorandum of Understanding on behalf of the organizing committee.',
        documentHashAtSigning: mv.documentHash,
        hashAlgorithm: HASH_ALGORITHM,
        signedAt: new Date(now - 20 * dayMs),
      }),
      Signature.create({
        mouId: mou._id,
        mouVersionId: mv._id,
        signerUserId: companyUser._id,
        signerRole: SIGNER_ROLE.COMPANY,
        signatureType: SIGNATURE_TYPE.PLATFORM,
        signatureData: `DIGITALLY_SIGNED_${(companyUser.email || 'COMPANY').toUpperCase().replace(/[^A-Z0-9]/g, '_')}`,
        consentText: 'I agree to the commercial and sponsorship terms set forth in this Memorandum of Understanding.',
        documentHashAtSigning: mv.documentHash,
        hashAlgorithm: HASH_ALGORITHM,
        signedAt: new Date(now - 19 * dayMs),
      }),
    ]);

    deal.currentProposalId = prop._id;
    deal.agreedTermsId = agreement._id;
    deal.mouId = mou._id;
    await deal.save();
    return { prop, agreement, mou, mv };
  };

  // Deal 9 (EXECUTED)
  await createExecutedMouWorkflow(deal9, companyUsers[2], committeeUsers[8], 110000);

  // Deal 10 (FULFILLMENT)
  await createExecutedMouWorkflow(deal10, companyUsers[1], committeeUsers[1], 150000);

  // Hero Deal 11 (COMPLETED): Multi-proposal version progression + Execution
  const heroP1 = await Proposal.create({
    dealId: deal11._id,
    createdByUserId: heroCompanyUser._id,
    version: 1,
    contribution: { types: ['CASH', 'BEVERAGE'], cash: { amount: 80000, currency: 'INR' }, nonCash: [{ type: 'BEVERAGE', name: 'Energy Cans', quantity: 1000, unit: 'cans', estimatedValue: 30000 }] },
    status: PROPOSAL_STATUS.SUPERSEDED,
    respondedAt: new Date(now - 28 * dayMs),
  });
  const heroP2 = await Proposal.create({
    dealId: deal11._id,
    createdByUserId: heroCommitteeUser._id,
    version: 2,
    basedOnProposalId: heroP1._id,
    contribution: {
      types: ['CASH', 'BEVERAGE', 'MERCHANDISE'],
      cash: { amount: 100000, currency: 'INR' },
      nonCash: [
        { type: 'BEVERAGE', name: 'Developer Energy Drinks', quantity: 2000, unit: 'cans', estimatedValue: 100000 },
        { type: 'MERCHANDISE', name: 'Branded Tech Tees', quantity: 500, unit: 'tees', estimatedValue: 75000 },
      ],
    },
    status: PROPOSAL_STATUS.SUPERSEDED,
    respondedAt: new Date(now - 27 * dayMs),
  });
  const heroP3 = await Proposal.create({
    dealId: deal11._id,
    createdByUserId: heroCompanyUser._id,
    version: 3,
    basedOnProposalId: heroP2._id,
    contribution: heroP2.contribution,
    benefits: [
      { title: 'Title Naming Rights', description: 'Presented by TechCorp India' },
      { title: 'Keynote Address', description: '30-minute inaugural keynote' },
      { title: 'Central Quad Expo Stall', description: '12x12 prime front-row booth' },
    ],
    deliverables: [
      { party: 'COMPANY', description: 'Disburse ₹1,00,000 cash grant and ship 2,000 cans & 500 tees' },
      { party: 'COMMITTEE', description: 'Construct Central Quad 12x12 prime booth and guarantee keynote' },
    ],
    terms: 'Agreed final Title Partner terms for E-Summit 2026.',
    status: PROPOSAL_STATUS.ACCEPTED,
    respondedAt: new Date(now - 26 * dayMs),
  });

  const heroAgreement = await DealAgreement.create({
    dealId: deal11._id,
    acceptedProposalId: heroP3._id,
    snapshot: {
      contributions: heroP3.contribution,
      benefits: heroP3.benefits,
      deliverables: heroP3.deliverables,
      paymentDetails: {
        beneficiaryName: 'The Entrepreneurship Cell IIT Bombay',
        accountNumber: '445566778899',
        bankName: 'State Bank of India',
        branch: 'IIT Powai Campus',
        ifscCode: 'SBIN0001109',
        pan: 'AAATE1234F',
        gstin: '27AAATE1234F1Z5',
        currency: 'INR',
      },
    },
    agreedBy: [
      { userId: heroCompanyUser._id, role: SIGNER_ROLE.COMPANY, agreedAt: new Date(now - 26 * dayMs) },
      { userId: heroCommitteeUser._id, role: SIGNER_ROLE.COMMITTEE, agreedAt: new Date(now - 26 * dayMs) },
    ],
  });

  const heroMou = await Mou.create({ dealId: deal11._id, status: MOU_STATUS.EXECUTED });
  const heroMv = await makeMouVersionWithHash(heroMou, heroAgreement, 1, MOU_VERSION_STATUS.EXECUTED);
  heroMou.currentVersionId = heroMv._id;
  await heroMou.save();

  await Promise.all([
    Signature.create({
      mouId: heroMou._id,
      mouVersionId: heroMv._id,
      signerUserId: heroCommitteeUser._id,
      signerRole: SIGNER_ROLE.COMMITTEE,
      signatureType: SIGNATURE_TYPE.PLATFORM,
      signatureData: 'DIGITALLY_SIGNED_ROHAN_GUPTA_CONVENOR_ECELL_IITB',
      consentText: 'I agree to the legally binding terms on behalf of The Entrepreneurship Cell, IIT Bombay.',
      documentHashAtSigning: heroMv.documentHash,
      hashAlgorithm: HASH_ALGORITHM,
      signedAt: new Date(now - 25 * dayMs),
    }),
    Signature.create({
      mouId: heroMou._id,
      mouVersionId: heroMv._id,
      signerUserId: heroCompanyUser._id,
      signerRole: SIGNER_ROLE.COMPANY,
      signatureType: SIGNATURE_TYPE.PLATFORM,
      signatureData: 'DIGITALLY_SIGNED_AARAV_SHARMA_DIRECTOR_TECHCORP',
      consentText: 'I agree to the commercial and sponsorship terms set forth in this Memorandum of Understanding.',
      documentHashAtSigning: heroMv.documentHash,
      hashAlgorithm: HASH_ALGORITHM,
      signedAt: new Date(now - 24 * dayMs),
    }),
  ]);

  deal11.currentProposalId = heroP3._id;
  deal11.agreedTermsId = heroAgreement._id;
  deal11.mouId = heroMou._id;
  await deal11.save();

  // Deal 12 (DISPUTED)
  await createExecutedMouWorkflow(deal12, companyUsers[5], committeeUsers[1], 80000);

  console.log(`  ✓ Created 21 Proposal Versions, 6 Deal Agreements, 7 MoUs, 7 Versions, and 10 Cryptographic Signatures`);

  console.log('\n[11/12] Creating Fulfillment Obligations, Photo Evidence & 2-Way Reviews...');

  // Fulfillments for Deal 10 (FULFILLMENT stage)
  const [f10_cash, f10_product, f10_booth, f10_promo] = await Promise.all([
    Fulfillment.create({
      dealId: deal10._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMPANY,
      type: FULFILLMENT_TYPE.CASH,
      description: 'Transfer ₹1,00,000 cash grant to Revels fest account',
      quantity: 100000,
      unit: 'INR',
      status: FULFILLMENT_STATUS.COMPLETED,
      completedAt: new Date(now - 8 * dayMs),
    }),
    Fulfillment.create({
      dealId: deal10._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMPANY,
      type: FULFILLMENT_TYPE.PRODUCT,
      description: 'Supply 1,000 chilled cans of Velocity Energy to main quad registration',
      quantity: 1000,
      unit: 'cans',
      status: FULFILLMENT_STATUS.IN_PROGRESS, // Partial delivery in progress
      dueDate: new Date(now + 10 * dayMs),
    }),
    Fulfillment.create({
      dealId: deal10._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMMITTEE,
      type: FULFILLMENT_TYPE.BOOTH,
      description: 'Construct 12x12 prime sampling kiosk in Central Quad',
      quantity: 1,
      unit: 'stall',
      status: FULFILLMENT_STATUS.COMPLETED,
      completedAt: new Date(now - 2 * dayMs),
    }),
    Fulfillment.create({
      dealId: deal10._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMMITTEE,
      type: FULFILLMENT_TYPE.PROMOTION,
      description: 'Co-branded Instagram reel and stage backdrop video advertisements',
      quantity: 2,
      unit: 'assets',
      status: FULFILLMENT_STATUS.PENDING,
      dueDate: new Date(now + 12 * dayMs),
    }),
  ]);

  // Evidence for Deal 10 kiosk
  await FulfillmentEvidence.create({
    fulfillmentId: f10_booth._id,
    uploadedByUserId: committeeUsers[1]._id,
    fileId: evidenceFiles[2]._id,
    description: 'Photographic verification of completed sampling booth in Revels Central Quad.',
  });

  // Fulfillments for Hero Deal 11 (COMPLETED stage: 100% fulfilled)
  const [f11_cash, f11_bev, f11_merch, f11_booth] = await Promise.all([
    Fulfillment.create({
      dealId: deal11._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMPANY,
      type: FULFILLMENT_TYPE.CASH,
      description: 'Wire Title Partner cash grant of ₹1,00,000 to IIT Bombay Fest Account',
      quantity: 100000,
      unit: 'INR',
      status: FULFILLMENT_STATUS.COMPLETED,
      completedAt: new Date(now - 15 * dayMs),
    }),
    Fulfillment.create({
      dealId: deal11._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMPANY,
      type: FULFILLMENT_TYPE.PRODUCT,
      description: 'Deliver 2,000 cans of developer energy beverages to E-Summit logistics desk',
      quantity: 2000,
      unit: 'cans',
      status: FULFILLMENT_STATUS.COMPLETED,
      completedAt: new Date(now - 7 * dayMs),
    }),
    Fulfillment.create({
      dealId: deal11._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMPANY,
      type: FULFILLMENT_TYPE.MERCHANDISE,
      description: 'Ship 500 premium tech developer tees with co-branded embroidery',
      quantity: 500,
      unit: 'tees',
      status: FULFILLMENT_STATUS.COMPLETED,
      completedAt: new Date(now - 6 * dayMs),
    }),
    Fulfillment.create({
      dealId: deal11._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMMITTEE,
      type: FULFILLMENT_TYPE.BOOTH,
      description: 'Construct 12x12 prime tech pavilion in Central Convocation Quad with AV display',
      quantity: 1,
      unit: 'pavilion',
      status: FULFILLMENT_STATUS.COMPLETED,
      completedAt: new Date(now - 4 * dayMs),
    }),
  ]);

  // Evidence for Hero Deal
  await Promise.all([
    FulfillmentEvidence.create({
      fulfillmentId: f11_booth._id,
      uploadedByUserId: heroCommitteeUser._id,
      fileId: evidenceFiles[0]._id,
      description: 'On-site verification photo of 12x12 TechCorp Tech Pavilion setup in Central Quad.',
    }),
    FulfillmentEvidence.create({
      fulfillmentId: f11_bev._id,
      uploadedByUserId: heroCompanyUser._id,
      fileId: evidenceFiles[1]._id,
      description: 'Warehouse dispatch slip confirming arrival of 2,000 cans at IIT Bombay gate.',
    }),
  ]);

  // Reviews ONLY on COMPLETED deals (Strict rule: participant only, completed deal only, 1 per direction)
  // 1. Hero Deal 11 (TechCorp <-> E-Cell IITB)
  await Promise.all([
    Review.create({
      dealId: deal11._id,
      reviewerUserId: heroCompanyUser._id,
      revieweeCommitteeId: committees[0]._id,
      rating: 5,
      title: 'Phenomenal student entrepreneurship summit execution',
      comment: 'E-Cell IIT Bombay delivered an incredible edition of E-Summit. Over 6,000 student founders and engineers visited our booth, and our keynote was standing-room only. Impeccable student leadership.',
      status: REVIEW_STATUS.PUBLISHED,
    }),
    Review.create({
      dealId: deal11._id,
      reviewerUserId: heroCommitteeUser._id,
      revieweeCompanyId: companies[0]._id,
      rating: 5,
      title: 'Outstanding corporate anchor partner',
      comment: 'TechCorp India is the gold standard of corporate sponsors. Their cash milestones were cleared promptly, their physical merchandise arrived ahead of schedule, and their mentors inspired our hackathon finalists.',
      status: REVIEW_STATUS.PUBLISHED,
    }),
  ]);

  // 2. Completed deal historical review (Revels MIT <-> TechCorp completed festival deal)
  // Let's create an additional completed deal record for Revels <-> TechCorp so both parties have rich verified reputation history
  const dealRevelsCompleted = await Deal.create({
    eventId: events[1]._id,
    companyId: companies[0]._id,
    committeeId: committees[1]._id,
    status: DEAL_STATUS.COMPLETED,
    executedAt: new Date(now - 40 * dayMs),
    completedAt: new Date(now - 10 * dayMs),
    terms: 'Concluded Hackathon and Tech Workshop sponsorship.',
  });

  await Promise.all([
    Fulfillment.create({
      dealId: dealRevelsCompleted._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMPANY,
      type: FULFILLMENT_TYPE.CASH,
      description: '₹2,50,000 Hackathon Track Sponsorship',
      quantity: 250000,
      unit: 'INR',
      status: FULFILLMENT_STATUS.COMPLETED,
      completedAt: new Date(now - 10 * dayMs),
    }),
    Fulfillment.create({
      dealId: dealRevelsCompleted._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMMITTEE,
      type: FULFILLMENT_TYPE.SERVICE,
      description: 'Mentor lounge access and 45-minute tech workshop slot',
      quantity: 1,
      unit: 'workshop',
      status: FULFILLMENT_STATUS.COMPLETED,
      completedAt: new Date(now - 5 * dayMs),
    }),
    Review.create({
      dealId: dealRevelsCompleted._id,
      reviewerUserId: heroCompanyUser._id,
      revieweeCommitteeId: committees[1]._id,
      rating: 5,
      title: 'Flawless festival execution and immense participant engagement',
      comment: 'The Revels committee handled our hackathon track with top-tier professionalism. 600+ developers attended our workshop. Highly recommended for developer sponsors.',
      status: REVIEW_STATUS.PUBLISHED,
    }),
    Review.create({
      dealId: dealRevelsCompleted._id,
      reviewerUserId: committeeUsers[1]._id,
      revieweeCompanyId: companies[0]._id,
      rating: 5,
      title: 'Remarkable corporate partner',
      comment: 'TechCorp delivered their prize pool without delay and provided energetic mentors. A true partnership model.',
      status: REVIEW_STATUS.PUBLISHED,
    }),
  ]);

  // 3. Completed deal (Vanguard Strategy Conclave: IIM Indore <-> FinEdge)
  const dealVanguardCompleted = await Deal.create({
    eventId: events[8]._id,
    companyId: companies[2]._id,
    committeeId: committees[8]._id,
    status: DEAL_STATUS.COMPLETED,
    executedAt: new Date(now - 35 * dayMs),
    completedAt: new Date(now - 12 * dayMs),
    terms: 'Financial case league completed.',
  });

  await Promise.all([
    Fulfillment.create({
      dealId: dealVanguardCompleted._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMPANY,
      type: FULFILLMENT_TYPE.CASH,
      description: '₹1,50,000 Prize Pool and Case Competition Support',
      quantity: 150000,
      unit: 'INR',
      status: FULFILLMENT_STATUS.COMPLETED,
      completedAt: new Date(now - 12 * dayMs),
    }),
    Fulfillment.create({
      dealId: dealVanguardCompleted._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMMITTEE,
      type: FULFILLMENT_TYPE.SERVICE,
      description: 'Keynote jury evaluation and company branding in presentation auditorium',
      quantity: 1,
      unit: 'conclave',
      status: FULFILLMENT_STATUS.COMPLETED,
      completedAt: new Date(now - 12 * dayMs),
    }),
    Review.create({
      dealId: dealVanguardCompleted._id,
      reviewerUserId: companyUsers[2]._id,
      revieweeCommitteeId: committees[8]._id,
      rating: 4,
      title: 'Great analytical caliber of student consultants',
      comment: 'The candidate presentations on valuation turnaround were thoroughly researched. Excellent organizing team.',
      status: REVIEW_STATUS.PUBLISHED,
    }),
    Review.create({
      dealId: dealVanguardCompleted._id,
      reviewerUserId: committeeUsers[8]._id,
      revieweeCompanyId: companies[2]._id,
      rating: 5,
      title: 'Supportive corporate mentor firm',
      comment: 'FinEdge brought senior executives who gave insightful feedback to all our student finalists.',
      status: REVIEW_STATUS.PUBLISHED,
    }),
  ]);

  console.log(`  ✓ Created 8 Fulfillment Obligations, 3 Verification Media Evidence, and 6 Two-Way Verified Reviews`);

  console.log('\n[12/12] Creating Disputes, Reports, Notifications & System Audit Trail...');

  // Disputes (2)
  await Promise.all([
    Dispute.create({
      dealId: deal12._id, // UrbanKart vs Revels MIT
      reportedByUserId: companyUsers[5]._id,
      reason: 'Sampling kiosk location altered without mutual agreement',
      description: 'The agreed sponsor kiosk in the primary quadrangle was moved to a peripheral walkway with significantly reduced student traffic.',
      status: DISPUTE_STATUS.OPEN,
      adminNotes: 'Admin mediation conference call scheduled with both convenors.',
    }),
    Report.create({
      reporterUserId: companyUsers[5]._id,
      targetType: REPORT_TARGET_TYPE.DEAL,
      targetId: deal12._id,
      reason: 'Deliverable violation during festival fulfillment phase',
      description: 'Unilateral relocation of physical promotional kiosk space.',
      status: REPORT_STATUS.OPEN,
    }),
    Dispute.create({
      dealId: deal10._id, // Velocity partial delivery timing notice
      reportedByUserId: committeeUsers[1]._id,
      reason: 'Batch delivery timing notification discrepancy',
      description: 'Second shipment of 1,000 cans delayed due to transport logistics; request revised timetable.',
      status: DISPUTE_STATUS.OPEN,
      adminNotes: 'Carrier tracking verified; revised arrival set for tomorrow.',
    }),
    Report.create({
      reporterUserId: committeeUsers[1]._id,
      targetType: REPORT_TARGET_TYPE.DEAL,
      targetId: deal10._id,
      reason: 'Fulfillment milestone schedule adjustment notice',
      description: 'Formal platform logging of carrier delay.',
      status: REPORT_STATUS.OPEN,
    }),
  ]);

  // Notifications (40)
  const notificationEntries = [
    { user: heroCompanyUser, type: NOTIFICATION_TYPE.DEAL_COMPLETED, title: 'Hero Deal Completed & Verified', message: 'Your Title Partnership with E-Summit 2026 has been marked COMPLETED. Verified reviews are now published.', entityType: 'DEAL', entityId: deal11._id },
    { user: heroCommitteeUser, type: NOTIFICATION_TYPE.DEAL_COMPLETED, title: 'Hero Deal Completed & Verified', message: 'Your Title Partnership with TechCorp India has been marked COMPLETED. Verified reviews are now published.', entityType: 'DEAL', entityId: deal11._id },
    { user: heroCommitteeUser, type: NOTIFICATION_TYPE.NEW_REVIEW, title: '5-Star Review Received', message: 'TechCorp India rated your event 5 stars: "Phenomenal student entrepreneurship summit execution".', entityType: 'REVIEW' },
    { user: heroCompanyUser, type: NOTIFICATION_TYPE.NEW_REVIEW, title: '5-Star Review Received', message: 'E-Cell IIT Bombay rated your company 5 stars: "Outstanding corporate anchor partner".', entityType: 'REVIEW' },
    { user: heroCompanyUser, type: NOTIFICATION_TYPE.MOU_GENERATED, title: 'MoU Ready for Signing', message: 'Legal agreement container PITCH_MOU_V1 is generated and ready for digital signing.', entityType: 'MOU', entityId: heroMou._id },
    { user: heroCompanyUser, type: NOTIFICATION_TYPE.DEAL_EXECUTED, title: 'Deal Formally Executed', message: 'Both parties have verified digital signatures. Deal is legally closed and entered fulfillment.', entityType: 'DEAL', entityId: deal11._id },
    { user: heroCommitteeUser, type: NOTIFICATION_TYPE.FULFILLMENT_UPDATE, title: 'Cash Grant Verified', message: 'TechCorp confirmed wire transfer of ₹1,00,000 sponsorship grant.', entityType: 'FULFILLMENT', entityId: f11_cash._id },
    { user: heroCommitteeUser, type: NOTIFICATION_TYPE.FULFILLMENT_UPDATE, title: 'Beverage Cargo Arrived', message: '2,000 cans delivered and verified at logistics gate.', entityType: 'FULFILLMENT', entityId: f11_bev._id },
    { user: heroCompanyUser, type: NOTIFICATION_TYPE.FULFILLMENT_UPDATE, title: 'Booth Construction Complete', message: 'E-Cell completed setup of 12x12 Tech Pavilion with photo proof.', entityType: 'FULFILLMENT', entityId: f11_booth._id },
    { user: companyUsers[1], type: NOTIFICATION_TYPE.FULFILLMENT_UPDATE, title: 'Kiosk Setup Complete', message: 'Revels committee verified Central Quad sampling booth with photographic evidence.', entityType: 'FULFILLMENT', entityId: f10_booth._id },
    { user: committeeUsers[1], type: NOTIFICATION_TYPE.DISPUTE_CREATED, title: 'Notice Logged on Deal', message: 'Delivery logistics discrepancy logged for Velocity Energy consignment.', entityType: 'DISPUTE', entityId: deal10._id },
    { user: companyUsers[5], type: NOTIFICATION_TYPE.DISPUTE_CREATED, title: 'Dispute Ticket Opened', message: 'Your dispute regarding kiosk reallocation has been submitted to platform admins.', entityType: 'DISPUTE', entityId: deal12._id },
    { user: companyUsers[0], type: NOTIFICATION_TYPE.MOU_GENERATED, title: 'Signature Requested on MoU', message: 'DevSoc BITS Pilani generated MoU Version 1 for AlgoByte 2026. Please countersign.', entityType: 'MOU', entityId: mouDeal7._id },
    { user: companyUsers[2], type: NOTIFICATION_TYPE.APPLICATION_ACCEPTED, title: 'Application Accepted', message: 'FinClub SRCC accepted your Gold Partner application for National FinCon 2026.', entityType: 'APPLICATION' },
    { user: companyUsers[4], type: NOTIFICATION_TYPE.APPLICATION_ACCEPTED, title: 'Application Accepted', message: 'DevSoc BITS Pilani accepted your Cloud Partner application for Apogee HackCon.', entityType: 'APPLICATION' },
    { user: committeeUsers[0], type: NOTIFICATION_TYPE.APPLICATION_RECEIVED, title: 'New Application Received', message: 'BrandSphere Media submitted an application for E-Summit 2026.', entityType: 'APPLICATION' },
    { user: committeeUsers[1], type: NOTIFICATION_TYPE.APPLICATION_RECEIVED, title: 'New Application Received', message: 'UrbanKart submitted an application for Revels 2026.', entityType: 'APPLICATION' },
    { user: committeeUsers[2], type: NOTIFICATION_TYPE.APPLICATION_RECEIVED, title: 'New Application Received', message: 'NextWave EdTech submitted an application for Apogee HackCon.', entityType: 'APPLICATION' },
    { user: companyUsers[3], type: NOTIFICATION_TYPE.INVITATION_RECEIVED, title: 'New Sponsorship Invitation', message: 'The Entrepreneurship Cell IITB invited you to support E-Summit FinTech Demo Day.', entityType: 'INVITATION' },
    { user: companyUsers[0], type: NOTIFICATION_TYPE.INVITATION_RECEIVED, title: 'New Sponsorship Invitation', message: 'Robotics Society DTU invited TechCorp to sponsor the RoboWars Arena.', entityType: 'INVITATION' },
    { user: companyUsers[7], type: NOTIFICATION_TYPE.INVITATION_RECEIVED, title: 'New Sponsorship Invitation', message: 'Sports Council IIT BHU invited CampusBrew to set up stadium cafes.', entityType: 'INVITATION' },
    { user: companyUsers[6], type: NOTIFICATION_TYPE.INVITATION_RECEIVED, title: 'New Sponsorship Invitation', message: 'Enactus DU invited GreenGrid to demonstrate EV fleet at the Impact Summit.', entityType: 'INVITATION' },
    { user: companyUsers[1], type: NOTIFICATION_TYPE.NEW_PROPOSAL, title: 'Counter-Proposal Received', message: 'Sports Council IIT BHU submitted Counter-Proposal v2 on Arena Games 2026.', entityType: 'PROPOSAL' },
    { user: committeeUsers[5], type: NOTIFICATION_TYPE.COUNTER_PROPOSAL, title: 'Counter-Proposal Submitted', message: 'Counter terms logged for athletic hydration agreement.', entityType: 'PROPOSAL' },
    { user: heroCompanyUser, type: NOTIFICATION_TYPE.NEW_MESSAGE, title: 'New Message from E-Cell IITB', message: 'Rohan Gupta sent you a message in E-Summit 2026 deal room.', entityType: 'CONVERSATION', entityId: heroConv._id },
    { user: heroCommitteeUser, type: NOTIFICATION_TYPE.NEW_MESSAGE, title: 'New Message from TechCorp', message: 'Aarav Sharma sent you a message in E-Summit 2026 deal room.', entityType: 'CONVERSATION', entityId: heroConv._id },
    { user: adminUser, type: NOTIFICATION_TYPE.DISPUTE_CREATED, title: 'Platform Admin: New Dispute Ticket', message: 'A deliverable dispute has been registered between UrbanKart and Revels MIT.', entityType: 'DISPUTE' },
    { user: opsAdminUser, type: NOTIFICATION_TYPE.DISPUTE_CREATED, title: 'Platform Admin: Milestone Alert', message: 'Fulfillment milestone schedule adjustment notice on Velocity deal.', entityType: 'DISPUTE' },
  ];

  // Fill up to 40 notifications
  for (let i = notificationEntries.length; i < 40; i++) {
    const targetU = companyUsers[i % companyUsers.length];
    notificationEntries.push({
      user: targetU,
      type: NOTIFICATION_TYPE.NEW_MESSAGE,
      title: 'Platform Notification',
      message: `Campus event milestone updated for collegiate sponsorship negotiation #${i + 1}.`,
      entityType: 'NOTIFICATION',
    });
  }

  await Promise.all(
    notificationEntries.map((n) =>
      Notification.create({
        recipientUserId: n.user._id,
        type: n.type,
        title: n.title,
        message: n.message,
        entityType: n.entityType || null,
        entityId: n.entityId || null,
        readAt: Math.random() > 0.4 ? new Date(now - 1 * dayMs) : null,
      })
    )
  );

  // Audit Logs (42 entries)
  const auditEntries = [
    { actor: adminUser, action: 'ADMIN_PLATFORM_INITIALIZATION', entityType: 'SYSTEM', metadata: { version: '2.0', environment: 'DEMO', initializedAt: new Date() } },
    { actor: committeeUsers[0], action: 'EVENT_CREATED', entityType: 'EVENT', entityId: events[0]._id, metadata: { title: events[0].title } },
    { actor: committeeUsers[0], action: 'EVENT_PUBLISHED', entityType: 'EVENT', entityId: events[0]._id, metadata: { slug: events[0].slug } },
    { actor: committeeUsers[1], action: 'EVENT_CREATED', entityType: 'EVENT', entityId: events[1]._id, metadata: { title: events[1].title } },
    { actor: committeeUsers[1], action: 'EVENT_PUBLISHED', entityType: 'EVENT', entityId: events[1]._id, metadata: { slug: events[1].slug } },
    { actor: heroCompanyUser, action: 'APPLICATION_SUBMITTED', entityType: 'APPLICATION', metadata: { company: 'TechCorp India Solutions', event: 'E-Summit 2026' } },
    { actor: heroCommitteeUser, action: 'APPLICATION_ACCEPTED', entityType: 'APPLICATION', metadata: { acceptedBy: 'Rohan Gupta' } },
    { actor: heroCompanyUser, action: 'PROPOSAL_CREATED', entityType: 'PROPOSAL', entityId: heroP1._id, metadata: { version: 1 } },
    { actor: heroCommitteeUser, action: 'PROPOSAL_COUNTERED', entityType: 'PROPOSAL', entityId: heroP2._id, metadata: { version: 2 } },
    { actor: heroCompanyUser, action: 'PROPOSAL_ACCEPTED', entityType: 'PROPOSAL', entityId: heroP3._id, metadata: { version: 3 } },
    { actor: heroCompanyUser, action: 'DEAL_AGREED', entityType: 'DEAL_AGREEMENT', entityId: heroAgreement._id, metadata: { agreedAmount: 100000 } },
    { actor: heroCommitteeUser, action: 'MOU_GENERATED', entityType: 'MOU', entityId: heroMou._id, metadata: { template: TEMPLATE_IDENTIFIER, version: 1 } },
    { actor: heroCommitteeUser, action: 'MOU_SIGNED', entityType: 'MOU', entityId: heroMou._id, metadata: { role: SIGNER_ROLE.COMMITTEE } },
    { actor: heroCompanyUser, action: 'MOU_SIGNED', entityType: 'MOU', entityId: heroMou._id, metadata: { role: SIGNER_ROLE.COMPANY } },
    { actor: adminUser, action: 'DEAL_EXECUTED', entityType: 'DEAL', entityId: deal11._id, metadata: { executedAt: deal11.executedAt } },
    { actor: heroCompanyUser, action: 'FULFILLMENT_COMPLETED', entityType: 'FULFILLMENT', entityId: f11_cash._id, metadata: { type: 'CASH', amount: 100000 } },
    { actor: heroCompanyUser, action: 'FULFILLMENT_COMPLETED', entityType: 'FULFILLMENT', entityId: f11_bev._id, metadata: { type: 'BEVERAGE', cans: 2000 } },
    { actor: heroCompanyUser, action: 'FULFILLMENT_COMPLETED', entityType: 'FULFILLMENT', entityId: f11_merch._id, metadata: { type: 'MERCHANDISE', tees: 500 } },
    { actor: heroCommitteeUser, action: 'FULFILLMENT_COMPLETED', entityType: 'FULFILLMENT', entityId: f11_booth._id, metadata: { type: 'BOOTH', booth: '12x12' } },
    { actor: heroCommitteeUser, action: 'FULFILLMENT_EVIDENCE_ADDED', entityType: 'FULFILLMENT_EVIDENCE', metadata: { description: 'Photo proof added' } },
    { actor: adminUser, action: 'DEAL_COMPLETED', entityType: 'DEAL', entityId: deal11._id, metadata: { completedAt: deal11.completedAt } },
    { actor: heroCompanyUser, action: 'REVIEW_CREATED', entityType: 'REVIEW', metadata: { rating: 5, target: 'The Entrepreneurship Cell IIT Bombay' } },
    { actor: heroCommitteeUser, action: 'REVIEW_CREATED', entityType: 'REVIEW', metadata: { rating: 5, target: 'TechCorp India Solutions' } },
    { actor: companyUsers[5], action: 'DEAL_DISPUTED', entityType: 'DEAL', entityId: deal12._id, metadata: { reason: 'Sampling kiosk location altered' } },
    { actor: companyUsers[5], action: 'REPORT_CREATED', entityType: 'REPORT', metadata: { targetType: 'DEAL' } },
    { actor: adminUser, action: 'ADMIN_REPORT_STATUS_UPDATE', entityType: 'REPORT', metadata: { newStatus: 'IN_REVIEW' } },
    { actor: opsAdminUser, action: 'SECURITY_TEST_AUDIT', entityType: 'SYSTEM', metadata: { check: 'SHA-256 verification audit' } },
  ];

  // Fill up to 42 audit logs
  for (let i = auditEntries.length; i < 42; i++) {
    const actor = i % 2 === 0 ? companyUsers[i % companyUsers.length] : committeeUsers[i % committeeUsers.length];
    auditEntries.push({
      actor,
      action: 'PLATFORM_OPERATION_LOGGED',
      entityType: 'DEAL',
      metadata: { eventIndex: i, loggedAt: new Date(now - (40 - i) * dayMs) },
    });
  }

  await Promise.all(
    auditEntries.map((a) =>
      AuditLog.create({
        actorUserId: a.actor._id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId || null,
        metadata: a.metadata || {},
        ipAddress: '127.0.0.1',
        userAgent: 'PITCH-DemoSeedEngine/2.0',
      })
    )
  );

  console.log(`  ✓ Recorded 2 Disputes, 2 Reports, 40 Notifications, and 42 Append-Only Audit Logs`);

  console.log('\n====================================================');
  console.log('       DEMO DATASET SEEDED SUCCESSFULLY (100%)       ');
  console.log('====================================================');

  console.log('\n[DEMO ACCOUNTS] Password for all accounts: DemoPassword123!');
  console.log('  • Admin 1:     admin@pitchdemo.com');
  console.log('  • Admin 2:     operations@pitchdemo.com');
  console.log('  • Company 1:   sponsor@techcorp.pitchdemo.com  (TechCorp India Solutions - HERO)');
  console.log('  • Company 2:   sponsor@velocity.pitchdemo.com  (Velocity Energy Beverages)');
  console.log('  • Company 3:   sponsor@finedge.pitchdemo.com   (FinEdge Wealth & Trading)');
  console.log('  • Company 4:   sponsor@novapay.pitchdemo.com   (NovaPay Technologies)');
  console.log('  • Company 5:   sponsor@byteworks.pitchdemo.com (ByteWorks AI Labs)');
  console.log('  • Company 6:   sponsor@urbankart.pitchdemo.com (UrbanKart Quick Commerce)');
  console.log('  • Company 7:   sponsor@greengrid.pitchdemo.com (GreenGrid CleanTech Mobility)');
  console.log('  • Company 8:   sponsor@campusbrew.pitchdemo.com(CampusBrew Artisan Cafes)');
  console.log('  • Company 9:   sponsor@brandsphere.pitchdemo.com(BrandSphere Media & Talent)');
  console.log('  • Company 10:  sponsor@nextwave.pitchdemo.com  (NextWave Careers & EdTech)');
  console.log('  • Committee 1: convenor@ecell.pitchdemo.com    (The Entrepreneurship Cell, IIT Bombay - HERO)');
  console.log('  • Committee 2: head@revels.pitchdemo.com        (Revels Cultural Festival, MIT Manipal)');
  console.log('  • Committee 3: lead@codingclub.pitchdemo.com   (DevSoc & Coding Society, BITS Pilani)');
  console.log('  • Committee 4: chair@robotics.pitchdemo.com    (Robotics Society, DTU Delhi)');
  console.log('  • Committee 5: convenor@financeclub.pitchdemo.com(FinClub & Economics Society, SRCC)');
  console.log('  • Committee 6: secretary@sports.pitchdemo.com  (Sports Council, IIT BHU Varanasi)');
  console.log('  • Committee 7: head@dramatics.pitchdemo.com    (Dramatics Society, St. Xavier\'s Mumbai)');
  console.log('  • Committee 8: lead@enactus.pitchdemo.com      (Enactus Social Innovation Cell, DU)');
  console.log('  • Committee 9: president@management.pitchdemo.com(Management & Strategy Club, IIM Indore)');
  console.log('\n[HERO DEMONSTRATION RECORD]');
  console.log('  • Company:     TechCorp India Solutions');
  console.log('  • Committee:   The Entrepreneurship Cell (IIT Bombay)');
  console.log('  • Event:       E-Summit 2026: Genesis of Innovation (slug: e-summit-2026)');
  console.log('  • Status:      COMPLETED (Full lifecycle: Application -> Conv -> v1/v2/v3 Proposals -> MoU -> Dual Signatures -> Executed -> 4 Fulfillments -> 2 Reviews)');
  console.log('====================================================\n');

  await disconnectDB();
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED ERROR]', err);
      process.exit(1);
    });
}

module.exports = { seed, cleanDemoData };
