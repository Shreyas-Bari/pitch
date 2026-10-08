const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/db');
const {
  User,
  Company,
  Committee,
  Event,
  SponsorshipPackage,
  Deal,
  Fulfillment,
  FulfillmentEvidence,
  Review,
  Report,
  Dispute,
  SelfReportedHistory,
  Notification,
  AuditLog,
  File,
} = require('../models');
const {
  ROLES,
  USER_STATUS,
  EVENT_STATUS,
  EVENT_LOCATION_MODE,
  DEAL_STATUS,
  FULFILLMENT_RESPONSIBLE_PARTY,
  FULFILLMENT_TYPE,
  FULFILLMENT_STATUS,
  REVIEW_STATUS,
  NOTIFICATION_TYPE,
  REPORT_TARGET_TYPE,
  REPORT_STATUS,
  DISPUTE_STATUS,
  FILE_PROVIDER,
  FILE_RESOURCE_TYPE,
  FILE_PURPOSE,
} = require('../utils/constants');

/**
 * PITCH Platform — Seed & Demo Data Generator
 * Demonstrates complete lifecycle:
 * - Admin, Companies, Committees
 * - Events & Packages
 * - Self-Reported History (strictly separated)
 * - Deals in NEGOTIATING, EXECUTED, FULFILLMENT, COMPLETED, DISPUTED
 * - Non-cash & Cash Fulfillments, Partial Deliveries, Evidence
 * - Reviews & Verified Reputation
 * - Reports, Disputes, Notifications, and Audit Logs
 */

async function seed() {
  console.log('====================================================');
  console.log('       PITCH PLATFORM DEMO SEED DATA GENERATOR      ');
  console.log('====================================================\n');

  await connectDB();

  console.log('[SEED] Cleaning existing demo records (*@pitchdemo.com)...');

  // Clean demo users and related records
  const demoUsers = await User.find({ email: /pitchdemo\.com$/ });
  const demoUserIds = demoUsers.map((u) => u._id);

  if (demoUserIds.length > 0) {
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
      ],
    });
    const demoDealIds = demoDeals.map((d) => d._id);

    const demoFulfillments = await Fulfillment.find({ dealId: { $in: demoDealIds } });
    const demoFulfillmentIds = demoFulfillments.map((f) => f._id);

    await Promise.all([
      FulfillmentEvidence.deleteMany({ fulfillmentId: { $in: demoFulfillmentIds } }),
      Fulfillment.deleteMany({ _id: { $in: demoFulfillmentIds } }),
      Review.deleteMany({ dealId: { $in: demoDealIds } }),
      Dispute.deleteMany({ dealId: { $in: demoDealIds } }),
      Report.deleteMany({ reporterUserId: { $in: demoUserIds } }),
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

    console.log(`  ✓ Removed ${demoUsers.length} previous demo accounts & related entities`);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('DemoPassword123!', salt);

  console.log('[SEED] Creating realistic demo users...');

  // 1. Users
  const [adminUser, techCorpUser, velocityUser, ecellUser, revelsUser] =
    await Promise.all([
      User.create({
        name: 'Platform Administrator',
        email: 'admin@pitchdemo.com',
        passwordHash,
        role: ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
        isActive: true,
      }),
      User.create({
        name: 'Aarav Sharma (TechCorp)',
        email: 'sponsor@techcorp.pitchdemo.com',
        passwordHash,
        role: ROLES.COMPANY,
        status: USER_STATUS.ACTIVE,
        isActive: true,
      }),
      User.create({
        name: 'Priya Mehta (Velocity Energy)',
        email: 'sponsor@velocity.pitchdemo.com',
        passwordHash,
        role: ROLES.COMPANY,
        status: USER_STATUS.ACTIVE,
        isActive: true,
      }),
      User.create({
        name: 'Rohan Gupta (E-Cell IITB)',
        email: 'convenor@ecell.pitchdemo.com',
        passwordHash,
        role: ROLES.COMMITTEE,
        status: USER_STATUS.ACTIVE,
        isActive: true,
      }),
      User.create({
        name: 'Ananya Roy (Revels MIT)',
        email: 'head@revels.pitchdemo.com',
        passwordHash,
        role: ROLES.COMMITTEE,
        status: USER_STATUS.ACTIVE,
        isActive: true,
      }),
    ]);

  console.log('  ✓ Created 5 demo user accounts');

  // Demo Evidence / Media Files
  const [logoFile, evidenceFile] = await Promise.all([
    File.create({
      ownerUserId: techCorpUser._id,
      provider: FILE_PROVIDER.CLOUDINARY,
      publicId: 'demo/techcorp_logo',
      url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      originalName: 'techcorp_logo.png',
      mimeType: 'image/png',
      sizeBytes: 15420,
      resourceType: FILE_RESOURCE_TYPE.IMAGE,
      purpose: FILE_PURPOSE.PROFILE_IMAGE,
    }),
    File.create({
      ownerUserId: revelsUser._id,
      provider: FILE_PROVIDER.CLOUDINARY,
      publicId: 'demo/sampling_stall_evidence',
      url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      originalName: 'sampling_stall_setup.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 84520,
      resourceType: FILE_RESOURCE_TYPE.IMAGE,
      purpose: FILE_PURPOSE.FULFILLMENT_EVIDENCE,
    }),
  ]);

  // 2. Companies
  console.log('[SEED] Creating company profiles...');
  const [techCorp, velocity] = await Promise.all([
    Company.create({
      userId: techCorpUser._id,
      name: 'TechCorp India Solutions',
      industry: 'Technology & Cloud',
      description:
        'Leading provider of developer tooling, cloud infrastructure, and AI hardware in India.',
      website: 'https://techcorp-india.demo',
      logoFileId: logoFile._id,
      location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
      isProfileComplete: true,
    }),
    Company.create({
      userId: velocityUser._id,
      name: 'Velocity Energy Beverages',
      industry: 'FMCG / Food & Beverage',
      description:
        'Premium natural energy beverage brand powering campus innovators, coders, and athletes across India.',
      website: 'https://velocityenergy.demo',
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      isProfileComplete: true,
    }),
  ]);
  console.log('  ✓ Created 2 company profiles');

  // 3. Committees
  console.log('[SEED] Creating committee profiles...');
  const [ecell, revels] = await Promise.all([
    Committee.create({
      userId: ecellUser._id,
      name: 'The Entrepreneurship Cell',
      college: {
        name: 'Indian Institute of Technology Bombay',
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      },
      description:
        "Asia's largest student-run entrepreneurship promotion organization hosting E-Summit annually.",
      isProfileComplete: true,
    }),
    Committee.create({
      userId: revelsUser._id,
      name: 'Revels Cultural Festival Committee',
      college: {
        name: 'Manipal Institute of Technology, Manipal',
        location: { city: 'Manipal', state: 'Karnataka', country: 'India' },
      },
      description:
        'National-level cultural extravaganza attracting 15,000+ collegiate participants nationwide.',
      isProfileComplete: true,
    }),
  ]);
  console.log('  ✓ Created 2 committee profiles');

  // 4. Events
  console.log('[SEED] Creating events and sponsorship packages...');
  const [esummitEvent, revelsEvent] = await Promise.all([
    Event.create({
      committeeId: ecell._id,
      title: 'E-Summit 2026: Genesis of Innovation',
      slug: 'e-summit-2026',
      description:
        'Flagship annual entrepreneurship conference featuring hackathons, founder talks, and venture pitches.',
      category: 'ENTREPRENEURSHIP',
      eventDate: new Date(Date.now() + 30 * 86400000),
      endDate: new Date(Date.now() + 32 * 86400000),
      location: {
        mode: EVENT_LOCATION_MODE.PHYSICAL,
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      },
      status: EVENT_STATUS.PUBLISHED,
      expectedAttendees: 6000,
      isPublished: true,
    }),
    Event.create({
      committeeId: revels._id,
      title: 'Revels 2026: Symphonies of Tomorrow',
      slug: 'revels-2026',
      description:
        'Four-day cultural festival featuring pro-nights, debate leagues, gaming arenas, and art conclaves.',
      category: 'CULTURAL',
      eventDate: new Date(Date.now() + 15 * 86400000),
      endDate: new Date(Date.now() + 19 * 86400000),
      location: {
        mode: EVENT_LOCATION_MODE.PHYSICAL,
        city: 'Manipal',
        state: 'Karnataka',
        country: 'India',
      },
      status: EVENT_STATUS.PUBLISHED,
      expectedAttendees: 18000,
      isPublished: true,
    }),
  ]);

  // Packages
  await Promise.all([
    SponsorshipPackage.create({
      eventId: esummitEvent._id,
      title: 'Title Partner',
      description: 'Exclusive title branding across all main stages and digital assets.',
      contributionTypes: ['CASH'],
      cashRequirement: { amount: 500000, currency: 'INR' },
      benefits: [
        { title: 'Naming rights', description: 'Title branding' },
        { title: 'Keynote address slot', description: 'Keynote speaker' },
      ],
    }),
    SponsorshipPackage.create({
      eventId: revelsEvent._id,
      title: 'Beverage & Hydration Partner',
      description: 'Exclusive rights to serve non-alcoholic beverages across campus.',
      contributionTypes: ['CASH', 'PRODUCT'],
      cashRequirement: { amount: 150000, currency: 'INR' },
      benefits: [{ title: 'Sampling stalls', description: 'Prime kiosk location' }],
    }),
  ]);
  console.log('  ✓ Created 2 published events with sponsorship packages');

  // 5. Self-Reported History (strictly distinct from PITCH verified)
  console.log('[SEED] Creating self-reported external histories...');
  await Promise.all([
    SelfReportedHistory.create({
      ownerType: 'COMPANY',
      ownerId: techCorp._id,
      title: 'HackAsia 2024 Title Sponsorship',
      description: 'Title sponsor of HackAsia Singapore collegiate hackathon prior to joining PITCH.',
      eventName: 'HackAsia 2024',
      partnerName: 'National University of Singapore',
      date: new Date('2024-09-15'),
      verificationStatus: 'SELF_REPORTED',
    }),
    SelfReportedHistory.create({
      ownerType: 'COMMITTEE',
      ownerId: ecell._id,
      title: 'E-Summit 2023 Corporate Collaboration',
      description: 'Historical sponsorship with enterprise cloud vendor in 2023.',
      eventName: 'E-Summit 2023',
      partnerName: 'Amazon Web Services',
      date: new Date('2023-02-10'),
      verificationStatus: 'SELF_REPORTED',
    }),
  ]);
  console.log('  ✓ Created self-reported histories (labeled SELF_REPORTED)');

  // 6. Deals across complete lifecycle
  console.log('[SEED] Creating deals across execution, fulfillment, and completion states...');

  // Deal 1: EXECUTED
  const executedDeal = await Deal.create({
    eventId: esummitEvent._id,
    companyId: techCorp._id,
    committeeId: ecell._id,
    status: DEAL_STATUS.EXECUTED,
    executedAt: new Date(Date.now() - 5 * 86400000),
  });

  // Deal 2: FULFILLMENT (Cash + Non-cash product + Booth, partial delivery, evidence)
  const fulfillmentDeal = await Deal.create({
    eventId: revelsEvent._id,
    companyId: velocity._id,
    committeeId: revels._id,
    status: DEAL_STATUS.FULFILLMENT,
    executedAt: new Date(Date.now() - 10 * 86400000),
  });

  const [fCash, fProduct, fBooth, fPromotion] = await Promise.all([
    Fulfillment.create({
      dealId: fulfillmentDeal._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMPANY,
      type: FULFILLMENT_TYPE.CASH,
      description: 'Wire sponsorship deposit of ₹1,00,000 to college fest bank account',
      quantity: 100000,
      unit: 'INR',
      status: FULFILLMENT_STATUS.COMPLETED,
      completedAt: new Date(Date.now() - 8 * 86400000),
    }),
    Fulfillment.create({
      dealId: fulfillmentDeal._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMPANY,
      type: FULFILLMENT_TYPE.PRODUCT,
      description: 'Supply 1,000 chilled cans of Velocity Energy to registration desk',
      quantity: 1000,
      unit: 'cans',
      status: FULFILLMENT_STATUS.IN_PROGRESS, // Partial delivery: in progress
      dueDate: new Date(Date.now() + 10 * 86400000),
    }),
    Fulfillment.create({
      dealId: fulfillmentDeal._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMMITTEE,
      type: FULFILLMENT_TYPE.BOOTH,
      description: 'Construct 12x12 prime sampling kiosk in Central Quad',
      quantity: 1,
      unit: 'stall',
      status: FULFILLMENT_STATUS.COMPLETED,
      completedAt: new Date(Date.now() - 2 * 86400000),
    }),
    Fulfillment.create({
      dealId: fulfillmentDeal._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMMITTEE,
      type: FULFILLMENT_TYPE.PROMOTION,
      description: 'Co-branded Instagram reel and banner placement on stage wing',
      quantity: 2,
      unit: 'assets',
      status: FULFILLMENT_STATUS.PENDING,
      dueDate: new Date(Date.now() + 12 * 86400000),
    }),
  ]);

  // Evidence attached to booth fulfillment
  await FulfillmentEvidence.create({
    fulfillmentId: fBooth._id,
    uploadedByUserId: revelsUser._id,
    fileId: evidenceFile._id,
    description: 'Photo verification of finished 12x12 kiosk in Central Quad with branding banner.',
  });

  // Deal 3: COMPLETED (Fulfilled + Two-way reviews)
  const completedDeal = await Deal.create({
    eventId: revelsEvent._id,
    companyId: techCorp._id,
    committeeId: revels._id,
    status: DEAL_STATUS.COMPLETED,
    executedAt: new Date(Date.now() - 30 * 86400000),
    completedAt: new Date(Date.now() - 2 * 86400000),
  });

  await Promise.all([
    Fulfillment.create({
      dealId: completedDeal._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMPANY,
      type: FULFILLMENT_TYPE.CASH,
      description: '₹2,50,000 Hackathon Track Sponsorship',
      quantity: 250000,
      unit: 'INR',
      status: FULFILLMENT_STATUS.COMPLETED,
      completedAt: new Date(Date.now() - 10 * 86400000),
    }),
    Fulfillment.create({
      dealId: completedDeal._id,
      responsibleParty: FULFILLMENT_RESPONSIBLE_PARTY.COMMITTEE,
      type: FULFILLMENT_TYPE.SERVICE,
      description: 'Mentor lounge access and 45-minute tech workshop slot',
      quantity: 1,
      unit: 'workshop',
      status: FULFILLMENT_STATUS.COMPLETED,
      completedAt: new Date(Date.now() - 5 * 86400000),
    }),
  ]);

  // Two-way reviews for completed deal
  await Promise.all([
    Review.create({
      dealId: completedDeal._id,
      reviewerUserId: techCorpUser._id,
      revieweeCommitteeId: revels._id,
      rating: 5,
      title: 'Flawless festival execution and immense participant engagement',
      comment:
        'The Revels committee handled our hackathon track with top-tier professionalism. 600+ developers attended our workshop. Highly recommended for developer sponsors.',
      status: REVIEW_STATUS.PUBLISHED,
    }),
    Review.create({
      dealId: completedDeal._id,
      reviewerUserId: revelsUser._id,
      revieweeCompanyId: techCorp._id,
      rating: 5,
      title: 'Remarkable corporate partner',
      comment:
        'TechCorp delivered their prize pool without delay and provided energetic mentors. A true partnership model.',
      status: REVIEW_STATUS.PUBLISHED,
    }),
  ]);

  // Deal 4: DISPUTED (Deal + Dispute + Report records)
  const disputedDeal = await Deal.create({
    eventId: esummitEvent._id,
    companyId: velocity._id,
    committeeId: ecell._id,
    status: DEAL_STATUS.DISPUTED,
    executedAt: new Date(Date.now() - 7 * 86400000),
  });

  await Promise.all([
    Dispute.create({
      dealId: disputedDeal._id,
      reportedByUserId: velocityUser._id,
      reason: 'Stage placement dimensions altered without consent',
      description:
        'Agreed sponsor backdrop position was reassigned to secondary hallway rather than main auditorium stage.',
      status: DISPUTE_STATUS.OPEN,
      adminNotes: 'Admin mediation scheduled with both convenors.',
    }),
    Report.create({
      reporterUserId: velocityUser._id,
      targetType: REPORT_TARGET_TYPE.DEAL,
      targetId: disputedDeal._id,
      reason: 'Deliverable violation during fulfillment phase',
      description: 'Backdrop location reallocated unilaterally.',
      status: REPORT_STATUS.OPEN,
    }),
  ]);

  console.log('  ✓ Created 4 deals: EXECUTED, FULFILLMENT, COMPLETED, DISPUTED');
  console.log('  ✓ Created obligations (cash, product, booth, service), evidence, and reviews');

  // 7. Notifications
  console.log('[SEED] Creating notifications...');
  await Promise.all([
    Notification.create({
      recipientUserId: techCorpUser._id,
      type: NOTIFICATION_TYPE.DEAL_COMPLETED,
      title: 'Deal Completed & Verified',
      message: 'Your deal with Revels MIT has been marked as COMPLETED. Your review has been published.',
      entityType: 'DEAL',
      entityId: completedDeal._id,
    }),
    Notification.create({
      recipientUserId: velocityUser._id,
      type: NOTIFICATION_TYPE.FULFILLMENT_UPDATE,
      title: 'Kiosk Setup Complete',
      message: 'Revels committee has verified the kiosk deliverable with photographic evidence.',
      entityType: 'FULFILLMENT',
      entityId: fBooth._id,
    }),
    Notification.create({
      recipientUserId: ecellUser._id,
      type: NOTIFICATION_TYPE.DISPUTE_CREATED,
      title: 'Dispute Filed on Deal',
      message: 'Velocity Beverages has submitted a deliverable discrepancy report.',
      entityType: 'DISPUTE',
      entityId: disputedDeal._id,
    }),
  ]);
  console.log('  ✓ Created initial notifications');

  // 8. Audit Logs
  console.log('[SEED] Writing initial immutable audit logs...');
  await Promise.all([
    AuditLog.create({
      actorUserId: techCorpUser._id,
      action: 'DEAL_COMPLETED',
      entityType: 'DEAL',
      entityId: completedDeal._id,
      metadata: { completedAt: completedDeal.completedAt, obligationsCompleted: true },
    }),
    AuditLog.create({
      actorUserId: velocityUser._id,
      action: 'DEAL_DISPUTED',
      entityType: 'DEAL',
      entityId: disputedDeal._id,
      metadata: { reason: 'Stage placement dimensions altered without consent' },
    }),
    AuditLog.create({
      actorUserId: adminUser._id,
      action: 'ADMIN_PLATFORM_INITIALIZATION',
      entityType: 'SYSTEM',
      metadata: { environment: 'DEMO', initializedAt: new Date() },
    }),
  ]);
  console.log('  ✓ Recorded audit log entries');

  console.log('\n====================================================');
  console.log('            DEMO DATA SEEDED SUCCESSFULLY!          ');
  console.log('====================================================');
  console.log('Test Accounts (Password for all: DemoPassword123!):');
  console.log('  • Admin:     admin@pitchdemo.com');
  console.log('  • Company 1: sponsor@techcorp.pitchdemo.com  (TechCorp India)');
  console.log('  • Company 2: sponsor@velocity.pitchdemo.com  (Velocity Energy)');
  console.log('  • Committee 1: convenor@ecell.pitchdemo.com  (E-Cell IIT Bombay)');
  console.log('  • Committee 2: head@revels.pitchdemo.com      (Revels MIT Manipal)');
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

module.exports = { seed };
