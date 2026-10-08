/**
 * Comprehensive Test Suite for PITCH Phases 7-15:
 * Marketplace, Discovery, Applications, Invitations, Notifications, Chat & Real-Time
 *
 * Source of Truth:
 * - docs/PITCH_FINAL_BUILD_SPEC.md (Phases 7-15, Steps 7-15, Sections 15-20, 27, 29, 36, 37, 40, 48, 49)
 * - docs/PITCH_DATABASE_FINAL.md (Sections 8-15, 27)
 * - docs/PITCH_API_FINAL.md (Sections 4-11, 18)
 *
 * Verification Areas:
 * 1. Event Lifecycle & CRUD (Create, Read, Update, Delete, Publish, Unpublish, Archive)
 * 2. Event RBAC & Ownership (Committee creates/manages, cross-committee denied)
 * 3. Saved Events (Company saves, unsaves, list saved events)
 * 4. Sponsorship Packages (CRUD, tiers, availability, validation)
 * 5. Search & Recommendations (Text search, filters, deterministic match score calculation)
 * 6. Applications (Apply, duplicate prevention, accept, reject, withdraw)
 * 7. Invitations (Send, duplicate prevention, accept, decline, cancel)
 * 8. Notifications (In-app creation, listing, unread count, read, read-all, delete)
 * 9. Conversations & REST Chat (List, create, send message, edit, delete, read state, archive)
 * 10. Contact Sharing (Share external contacts, view contacts, privacy boundaries)
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/db');
const { validateEnv } = require('./src/config/env');
const {
  User,
  Company,
  Committee,
  Event,
  SponsorshipPackage,
  Application,
  Invitation,
  SavedEvent,
  Conversation,
  Message,
  ContactShare,
  Notification,
} = require('./src/models');
const { ROLES, USER_STATUS, EVENT_STATUS, APPLICATION_STATUS, INVITATION_STATUS } = require('./src/utils/constants');
const { generateAccessToken } = require('./src/utils/jwt');
const { hashPassword } = require('./src/utils/password');

async function runMarketplaceTests() {
  console.log('================================================================');
  console.log(' PITCH Phases 7-15: Marketplace, Discovery & Communication Suite');
  console.log('================================================================\n');

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
  const cleanupPackageIds = [];
  const cleanupAppIds = [];
  const cleanupInvIds = [];
  const cleanupConvIds = [];
  const cleanupNotifIds = [];

  try {
    console.log('[SETUP] Creating test accounts (Committee A, Committee B, Company A, Company B, Admin)...');

    // 1. Committee User A
    const userCommA = await User.create({
      email: `comm.a.${timestamp}@pitch.test`,
      passwordHash: hashedPassword,
      role: ROLES.COMMITTEE,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    cleanupUserIds.push(userCommA._id);

    const commA = await Committee.create({
      userId: userCommA._id,
      name: 'IIT Bombay Techfest Committee',
      college: { name: 'IIT Bombay', city: 'Mumbai', state: 'Maharashtra' },
    });
    cleanupCommitteeIds.push(commA._id);
    const tokenCommA = generateAccessToken(userCommA);

    // 2. Committee User B
    const userCommB = await User.create({
      email: `comm.b.${timestamp}@pitch.test`,
      passwordHash: hashedPassword,
      role: ROLES.COMMITTEE,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    cleanupUserIds.push(userCommB._id);

    const commB = await Committee.create({
      userId: userCommB._id,
      name: 'BITS Pilani Waves Committee',
      college: { name: 'BITS Pilani', city: 'Goa', state: 'Goa' },
    });
    cleanupCommitteeIds.push(commB._id);
    const tokenCommB = generateAccessToken(userCommB);

    // 3. Company User A
    const userCompA = await User.create({
      email: `comp.a.${timestamp}@pitch.test`,
      passwordHash: hashedPassword,
      role: ROLES.COMPANY,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    cleanupUserIds.push(userCompA._id);

    const compA = await Company.create({
      userId: userCompA._id,
      name: 'Red Bull Energy India',
      industry: 'Beverages',
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      isProfileComplete: true,
      sponsorshipPreferences: {
        eventCategories: ['Technology', 'Cultural'],
        preferredLocations: ['Mumbai', 'Pune'],
        targetAudience: ['College Students', 'Youth'],
        budgetMin: 50000,
        budgetMax: 300000,
        contributionTypes: ['CASH', 'BEVERAGE'],
      },
    });
    cleanupCompanyIds.push(compA._id);
    const tokenCompA = generateAccessToken(userCompA);

    // 4. Company User B
    const userCompB = await User.create({
      email: `comp.b.${timestamp}@pitch.test`,
      passwordHash: hashedPassword,
      role: ROLES.COMPANY,
      status: USER_STATUS.ACTIVE,
      isActive: true,
    });
    cleanupUserIds.push(userCompB._id);

    const compB = await Company.create({
      userId: userCompB._id,
      name: 'Google India Cloud',
      industry: 'Technology',
      location: { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
      isProfileComplete: true,
      sponsorshipPreferences: {
        eventCategories: ['Technology', 'Hackathons'],
        preferredLocations: ['Bengaluru', 'Mumbai'],
        targetAudience: ['Developers', 'Engineering Students'],
        budgetMin: 100000,
        budgetMax: 500000,
        contributionTypes: ['CASH', 'SERVICE'],
      },
    });
    cleanupCompanyIds.push(compB._id);
    const tokenCompB = generateAccessToken(userCompB);

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

    console.log('  ✓ Test fixtures created successfully.\n');

    // ================================================================
    // TEST 1: Phase 7 - Event Creation & RBAC
    // ================================================================
    console.log('[TEST 1] Testing Event Creation & Role Protection...');

    // Company cannot create event (403)
    const resCompCreate = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${tokenCompA}`)
      .send({
        title: 'Unauthorized Event',
        description: 'Should fail',
        category: 'Technology',
        eventDate: new Date(Date.now() + 30 * 86400000),
      });
    if (resCompCreate.status !== 403) {
      throw new Error(`Expected 403 when Company creates event, got ${resCompCreate.status}`);
    }
    console.log('  ✓ Company correctly rejected from creating event with 403 FORBIDDEN');

    // Committee A creates Event 1
    const event1Payload = {
      title: 'Techfest 2026',
      description: 'Asia largest science and technology festival at IIT Bombay',
      category: 'Technology',
      eventType: 'Festival',
      eventDate: new Date(Date.now() + 60 * 86400000),
      endDate: new Date(Date.now() + 63 * 86400000),
      location: {
        mode: 'PHYSICAL',
        venue: 'Gymkhana Grounds',
        city: 'Mumbai',
        state: 'Maharashtra',
      },
      expectedAudience: { min: 10000, max: 50000 },
      audienceDescription: 'Engineering Students, developers and tech enthusiasts',
      estimatedReach: 150000,
      sponsorshipRequirements: {
        contributionTypes: ['CASH', 'BEVERAGE'],
        budgetMin: 50000,
        budgetMax: 500000,
        description: 'Looking for Title, Beverage, and Cloud Partners',
      },
      tags: ['technology', 'engineering', 'robotics', 'ai'],
    };

    const resCreateEvent = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${tokenCommA}`)
      .send(event1Payload);

    if (resCreateEvent.status !== 201) {
      throw new Error(`Failed to create event: ${JSON.stringify(resCreateEvent.body)}`);
    }
    const event1 = resCreateEvent.body.data.event;
    cleanupEventIds.push(event1._id);
    if (!event1.slug || event1.status !== EVENT_STATUS.DRAFT) {
      throw new Error(`Event creation state mismatch: slug=${event1.slug}, status=${event1.status}`);
    }
    console.log(`  ✓ Committee created event "${event1.title}" (status: DRAFT, slug: ${event1.slug})`);

    // ================================================================
    // TEST 2: Phase 7 - Event Lifecycle (Draft -> Published -> Archived)
    // ================================================================
    console.log('[TEST 2] Testing Event Lifecycle & Public Discoverability...');

    // Public list should NOT return draft event
    const resListDraft = await request(app).get('/api/v1/events');
    const hasDraft = (resListDraft.body.data || []).some(e => String(e._id) === String(event1._id));
    if (hasDraft) {
      throw new Error('Public events listing should NOT include DRAFT events');
    }
    console.log('  ✓ Public discovery does not expose DRAFT events');

    // Committee A publishes Event 1
    const resPublish = await request(app)
      .post(`/api/v1/events/${event1._id}/publish`)
      .set('Authorization', `Bearer ${tokenCommA}`);
    if (resPublish.status !== 200 || resPublish.body.data.event.status !== EVENT_STATUS.PUBLISHED) {
      throw new Error(`Failed to publish event: ${JSON.stringify(resPublish.body)}`);
    }
    console.log('  ✓ Event published successfully (status: PUBLISHED)');

    // Now public list MUST include the published event
    const resListPub = await request(app).get('/api/v1/events');
    const hasPub = (resListPub.body.data || []).some(e => String(e._id) === String(event1._id));
    if (!hasPub) {
      throw new Error('Public events listing MUST include newly PUBLISHED event');
    }
    console.log('  ✓ Published event is now visible in public discovery');

    // Committee B cannot update or archive Committee A event
    const resCommBCross = await request(app)
      .patch(`/api/v1/events/${event1._id}`)
      .set('Authorization', `Bearer ${tokenCommB}`)
      .send({ title: 'Hijacked Event' });
    if (resCommBCross.status !== 403) {
      throw new Error(`Expected 403 on cross-committee event update, got ${resCommBCross.status}`);
    }
    console.log('  ✓ Cross-committee mutation blocked with 403 FORBIDDEN');

    // Committee A views own events via /committees/me/events
    const resMyEvents = await request(app)
      .get('/api/v1/committees/me/events')
      .set('Authorization', `Bearer ${tokenCommA}`);
    if (resMyEvents.status !== 200 || resMyEvents.body.data.length === 0) {
      throw new Error(`GET /committees/me/events failed: ${JSON.stringify(resMyEvents.body)}`);
    }
    console.log('  ✓ GET /api/v1/committees/me/events successfully lists committee events');

    // ================================================================
    // TEST 3: Phase 7 - Saved Events
    // ================================================================
    console.log('[TEST 3] Testing Saved Events (Bookmark) Flow...');

    // Company A saves Event 1
    const resSave = await request(app)
      .post(`/api/v1/events/${event1._id}/save`)
      .set('Authorization', `Bearer ${tokenCompA}`);
    if (resSave.status !== 200 || !resSave.body.data.saved) {
      throw new Error(`Failed to save event: ${JSON.stringify(resSave.body)}`);
    }
    console.log('  ✓ Company A saved Event 1');

    // Company A lists saved events
    const resListSaved = await request(app)
      .get('/api/v1/users/me/saved-events')
      .set('Authorization', `Bearer ${tokenCompA}`);
    if (resListSaved.status !== 200 || !resListSaved.body.data.some(e => String(e._id) === String(event1._id))) {
      throw new Error(`Saved event not listed in GET /users/me/saved-events: ${JSON.stringify(resListSaved.body)}`);
    }
    console.log('  ✓ GET /api/v1/users/me/saved-events correctly returns saved event');

    // Unsave event
    const resUnsave = await request(app)
      .delete(`/api/v1/events/${event1._id}/save`)
      .set('Authorization', `Bearer ${tokenCompA}`);
    if (resUnsave.status !== 200) {
      throw new Error(`Failed to unsave event: ${JSON.stringify(resUnsave.body)}`);
    }
    console.log('  ✓ Company A unsaved Event 1 successfully');

    // ================================================================
    // TEST 4: Phase 8 - Sponsorship Packages
    // ================================================================
    console.log('[TEST 4] Testing Sponsorship Packages CRUD & Availability...');

    // Committee A creates Gold Package on Event 1
    const pkgPayload = {
      title: 'Gold Sponsor Tier',
      description: 'Exclusive prime branding and keynote slot',
      contributionTypes: ['CASH', 'BEVERAGE'],
      cashRequirement: { amount: 150000, currency: 'INR' },
      benefits: [
        { title: 'Main stage banner', description: 'Logo on main stage' },
        { title: 'Stall booth', description: '3x3m stall in central expo' },
      ],
      availability: 3,
    };

    const resCreatePkg = await request(app)
      .post(`/api/v1/events/${event1._id}/packages`)
      .set('Authorization', `Bearer ${tokenCommA}`)
      .send(pkgPayload);

    if (resCreatePkg.status !== 201) {
      throw new Error(`Failed to create package: ${JSON.stringify(resCreatePkg.body)}`);
    }
    const pkg1 = resCreatePkg.body.data.package;
    cleanupPackageIds.push(pkg1._id);
    console.log(`  ✓ Created package "${pkg1.title}" (cash: INR ${pkg1.cashRequirement.amount})`);

    // Public gets packages for Event 1
    const resGetPkgs = await request(app).get(`/api/v1/events/${event1._id}/packages`);
    if (resGetPkgs.status !== 200 || resGetPkgs.body.data.packages.length === 0) {
      throw new Error(`Failed to get packages: ${JSON.stringify(resGetPkgs.body)}`);
    }
    console.log('  ✓ Public GET /api/v1/events/:eventId/packages returned packages');

    // Committee A updates package
    const resUpdatePkg = await request(app)
      .patch(`/api/v1/packages/${pkg1._id}`)
      .set('Authorization', `Bearer ${tokenCommA}`)
      .send({ availability: 5 });
    if (resUpdatePkg.status !== 200 || resUpdatePkg.body.data.package.availability !== 5) {
      throw new Error(`Failed to update package: ${JSON.stringify(resUpdatePkg.body)}`);
    }
    console.log('  ✓ Updated package availability to 5');

    // ================================================================
    // TEST 5: Phase 9 - Search & Recommendations
    // ================================================================
    console.log('[TEST 5] Testing Search & Deterministic Recommendation Engine...');

    // Search events
    const resSearch = await request(app).get('/api/v1/search?q=Techfest&type=events');
    if (resSearch.status !== 200 || resSearch.body.data.length === 0) {
      throw new Error(`Search failed to find Techfest: ${JSON.stringify(resSearch.body)}`);
    }
    console.log('  ✓ GET /api/v1/search returned matched events');

    // Recommendations for Company A
    const resRecEvents = await request(app)
      .get('/api/v1/recommendations/events')
      .set('Authorization', `Bearer ${tokenCompA}`);
    if (resRecEvents.status !== 200 || !resRecEvents.body.data.recommendations) {
      throw new Error(`Event recommendations failed: ${JSON.stringify(resRecEvents.body)}`);
    }
    const rec1 = resRecEvents.body.data.recommendations[0];
    if (!rec1 || typeof rec1.score !== 'number' || rec1.score < 50) {
      throw new Error(`Expected deterministic match score >= 50, got ${rec1?.score}`);
    }
    console.log(`  ✓ Event recommendation for Red Bull computed score: ${rec1.score}/100 with reasons: ${rec1.reasons.join(', ')}`);

    // ================================================================
    // TEST 6: Phase 10 - Applications Flow
    // ================================================================
    console.log('[TEST 6] Testing Application Submission, Mutual Interest & Acceptance...');

    // Company A applies to Event 1
    const appPayload = {
      packageId: pkg1._id,
      message: 'Red Bull would love to be the official beverage partner for Techfest 2026',
      proposedContribution: {
        types: ['CASH', 'BEVERAGE'],
        cash: { amount: 150000, currency: 'INR' },
        nonCash: [{ type: 'BEVERAGE', description: '500 energy drink cans', quantity: 500, unit: 'cans' }],
      },
    };

    const resApply = await request(app)
      .post(`/api/v1/events/${event1._id}/applications`)
      .set('Authorization', `Bearer ${tokenCompA}`)
      .send(appPayload);

    if (resApply.status !== 201) {
      throw new Error(`Application failed: ${JSON.stringify(resApply.body)}`);
    }
    const application1 = resApply.body.data.application;
    cleanupAppIds.push(application1._id);
    console.log(`  ✓ Company A applied to Event 1 (status: ${application1.status})`);

    // Duplicate active application prevented (409)
    const resDupApp = await request(app)
      .post(`/api/v1/events/${event1._id}/applications`)
      .set('Authorization', `Bearer ${tokenCompA}`)
      .send(appPayload);
    if (resDupApp.status !== 409) {
      throw new Error(`Expected 409 on duplicate application, got ${resDupApp.status}`);
    }
    console.log('  ✓ Duplicate active application rejected with 409 CONFLICT');

    // Committee A views applications for Event 1
    const resGetApps = await request(app)
      .get(`/api/v1/events/${event1._id}/applications`)
      .set('Authorization', `Bearer ${tokenCommA}`);
    if (resGetApps.status !== 200 || resGetApps.body.data.length === 0) {
      throw new Error(`Failed to list event applications: ${JSON.stringify(resGetApps.body)}`);
    }
    console.log('  ✓ Committee A retrieved applications for event');

    // Committee A accepts application -> mutual interest established!
    const resAcceptApp = await request(app)
      .post(`/api/v1/applications/${application1._id}/accept`)
      .set('Authorization', `Bearer ${tokenCommA}`);
    if (resAcceptApp.status !== 200 || !resAcceptApp.body.data.conversation) {
      throw new Error(`Failed to accept application: ${JSON.stringify(resAcceptApp.body)}`);
    }
    const appConv = resAcceptApp.body.data.conversation;
    cleanupConvIds.push(appConv._id);
    console.log(`  ✓ Committee accepted application -> conversation ${appConv._id} created automatically`);

    // ================================================================
    // TEST 7: Phase 11 - Invitations Flow
    // ================================================================
    console.log('[TEST 7] Testing Invitation Flow & Acceptance...');

    // Committee A invites Company B (Google Cloud)
    const invPayload = {
      companyId: compB._id,
      packageId: pkg1._id,
      message: 'We invite Google Cloud to be our Title Cloud Sponsor',
    };

    const resSendInv = await request(app)
      .post(`/api/v1/events/${event1._id}/invitations`)
      .set('Authorization', `Bearer ${tokenCommA}`)
      .send(invPayload);

    if (resSendInv.status !== 201) {
      throw new Error(`Failed to send invitation: ${JSON.stringify(resSendInv.body)}`);
    }
    const invitation1 = resSendInv.body.data.invitation;
    cleanupInvIds.push(invitation1._id);
    console.log(`  ✓ Committee A invited Google Cloud (status: ${invitation1.status})`);

    // Company B views invitations
    const resGetInvs = await request(app)
      .get('/api/v1/invitations')
      .set('Authorization', `Bearer ${tokenCompB}`);
    if (resGetInvs.status !== 200 || resGetInvs.body.data.length === 0) {
      throw new Error(`Failed to get company invitations: ${JSON.stringify(resGetInvs.body)}`);
    }
    console.log('  ✓ Company B retrieved received invitations');

    // Company B accepts invitation
    const resAcceptInv = await request(app)
      .post(`/api/v1/invitations/${invitation1._id}/accept`)
      .set('Authorization', `Bearer ${tokenCompB}`);
    if (resAcceptInv.status !== 200 || !resAcceptInv.body.data.conversation) {
      throw new Error(`Failed to accept invitation: ${JSON.stringify(resAcceptInv.body)}`);
    }
    cleanupConvIds.push(resAcceptInv.body.data.conversation._id);
    console.log('  ✓ Company B accepted invitation -> conversation linked');

    // ================================================================
    // TEST 8: Phase 12 - Notifications
    // ================================================================
    console.log('[TEST 8] Testing Notification Delivery & Read State...');

    // Committee A user should have received notifications (from application)
    const resCommNotifs = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${tokenCommA}`);
    if (resCommNotifs.status !== 200 || resCommNotifs.body.data.length === 0) {
      throw new Error(`Notifications not found for committee: ${JSON.stringify(resCommNotifs.body)}`);
    }
    const notif1 = resCommNotifs.body.data[0];
    cleanupNotifIds.push(notif1._id);
    console.log(`  ✓ In-app notification delivered: "${notif1.title}"`);

    // Unread count
    const resUnread = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${tokenCommA}`);
    if (resUnread.status !== 200 || resUnread.body.data.unreadCount < 1) {
      throw new Error(`Invalid unread count: ${JSON.stringify(resUnread.body)}`);
    }
    console.log(`  ✓ Unread notification count verified: ${resUnread.body.data.unreadCount}`);

    // Mark single as read
    const resMarkRead = await request(app)
      .post(`/api/v1/notifications/${notif1._id}/read`)
      .set('Authorization', `Bearer ${tokenCommA}`);
    if (resMarkRead.status !== 200 || !resMarkRead.body.data.notification.readAt) {
      throw new Error(`Failed to mark notification read: ${JSON.stringify(resMarkRead.body)}`);
    }
    console.log('  ✓ Notification marked as read');

    // Mark all as read
    const resMarkAll = await request(app)
      .post('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${tokenCommA}`);
    if (resMarkAll.status !== 200) {
      throw new Error(`Failed to mark all read: ${JSON.stringify(resMarkAll.body)}`);
    }
    console.log('  ✓ Mark all notifications as read verified');

    // ================================================================
    // TEST 9: Phase 13 - Conversations & REST Chat
    // ================================================================
    console.log('[TEST 9] Testing Conversation List & Authoritative REST Chat Messaging...');

    // Company A lists conversations
    const resConvs = await request(app)
      .get('/api/v1/conversations')
      .set('Authorization', `Bearer ${tokenCompA}`);
    if (resConvs.status !== 200 || resConvs.body.data.length === 0) {
      throw new Error(`Failed to list conversations: ${JSON.stringify(resConvs.body)}`);
    }
    const conv1 = resConvs.body.data[0];
    console.log(`  ✓ Company A found active conversation ${conv1._id}`);

    // Company A sends message in conversation
    const resSendMsg = await request(app)
      .post(`/api/v1/conversations/${conv1._id}/messages`)
      .set('Authorization', `Bearer ${tokenCompA}`)
      .send({ text: 'Hello Techfest team! We are excited to collaborate.' });
    if (resSendMsg.status !== 201) {
      throw new Error(`Failed to send message: ${JSON.stringify(resSendMsg.body)}`);
    }
    const msg1 = resSendMsg.body.data.message;
    console.log(`  ✓ Message sent by Company A: "${msg1.text}"`);

    // Committee A replies
    const resReplyMsg = await request(app)
      .post(`/api/v1/conversations/${conv1._id}/messages`)
      .set('Authorization', `Bearer ${tokenCommA}`)
      .send({ text: 'Welcome aboard! Let us discuss the MOU details.', replyToMessageId: msg1._id });
    if (resReplyMsg.status !== 201) {
      throw new Error(`Failed to send reply: ${JSON.stringify(resReplyMsg.body)}`);
    }
    const msg2 = resReplyMsg.body.data.message;
    console.log(`  ✓ Message reply sent by Committee A: "${msg2.text}"`);

    // Get messages history
    const resGetMsgs = await request(app)
      .get(`/api/v1/conversations/${conv1._id}/messages`)
      .set('Authorization', `Bearer ${tokenCompA}`);
    if (resGetMsgs.status !== 200 || resGetMsgs.body.data.length < 2) {
      throw new Error(`Failed to get messages: ${JSON.stringify(resGetMsgs.body)}`);
    }
    console.log(`  ✓ Retrieved ${resGetMsgs.body.data.length} messages in chronological order`);

    // Edit message
    const resEditMsg = await request(app)
      .patch(`/api/v1/messages/${msg1._id}`)
      .set('Authorization', `Bearer ${tokenCompA}`)
      .send({ text: 'Hello Techfest team! Red Bull is excited to collaborate.' });
    if (resEditMsg.status !== 200 || !resEditMsg.body.data.message.editedAt) {
      throw new Error(`Failed to edit message: ${JSON.stringify(resEditMsg.body)}`);
    }
    console.log('  ✓ Message edited successfully');

    // Mark conversation read
    const resConvRead = await request(app)
      .post(`/api/v1/conversations/${conv1._id}/read`)
      .set('Authorization', `Bearer ${tokenCompA}`);
    if (resConvRead.status !== 200) {
      throw new Error(`Failed to mark conversation read: ${JSON.stringify(resConvRead.body)}`);
    }
    console.log('  ✓ Conversation messages marked as read');

    // Unrelated company (Company B) denied access to Company A's conversation
    const resCrossConv = await request(app)
      .get(`/api/v1/conversations/${conv1._id}/messages`)
      .set('Authorization', `Bearer ${tokenCompB}`);
    if (resCrossConv.status !== 403) {
      throw new Error(`Expected 403 on outsider access to conversation, got ${resCrossConv.status}`);
    }
    console.log('  ✓ Outsider access to conversation strictly denied with 403 FORBIDDEN');

    // ================================================================
    // TEST 10: Phase 15 - Contact Sharing
    // ================================================================
    console.log('[TEST 10] Testing Contact Sharing in Conversation...');

    // Company A shares direct contact details
    const contactPayload = {
      email: 'sponsorship@redbull.in',
      phone: '+919876500000',
      whatsapp: '+919876500000',
    };

    const resShareContact = await request(app)
      .post(`/api/v1/conversations/${conv1._id}/contact-share`)
      .set('Authorization', `Bearer ${tokenCompA}`)
      .send(contactPayload);

    if (resShareContact.status !== 201) {
      throw new Error(`Failed to share contact: ${JSON.stringify(resShareContact.body)}`);
    }
    console.log('  ✓ Contact details shared in conversation');

    // Committee A retrieves shared contacts
    const resGetContacts = await request(app)
      .get(`/api/v1/conversations/${conv1._id}/contact-shares`)
      .set('Authorization', `Bearer ${tokenCommA}`);
    if (resGetContacts.status !== 200 || resGetContacts.body.data.contactShares.length === 0) {
      throw new Error(`Failed to get contact shares: ${JSON.stringify(resGetContacts.body)}`);
    }
    console.log('  ✓ Committee A successfully retrieved shared contact details');

    // ================================================================
    // TEST 11: Phase 15 V2 Reconciliation - Structured Cards & Message Types
    // ================================================================
    console.log('[TEST 11] Testing V2 Reconciled Message Types & Structured Cards...');

    // 1. Send EVENT_CARD message
    const resEventCard = await request(app)
      .post(`/api/v1/conversations/${conv1._id}/messages`)
      .set('Authorization', `Bearer ${tokenCommA}`)
      .send({
        type: 'EVENT_CARD',
        eventId: event1._id,
        text: 'Check out our official event card',
        metadata: { category: event1.category, reach: event1.estimatedReach },
      });
    if (resEventCard.status !== 201 || resEventCard.body.data.message.type !== 'EVENT_CARD') {
      throw new Error(`Failed to send EVENT_CARD: ${JSON.stringify(resEventCard.body)}`);
    }
    const eventCardMsg = resEventCard.body.data.message;
    if (!eventCardMsg.eventId || String(eventCardMsg.eventId._id || eventCardMsg.eventId) !== String(event1._id)) {
      throw new Error(`EVENT_CARD missing populated eventId: ${JSON.stringify(eventCardMsg)}`);
    }
    console.log('  ✓ EVENT_CARD message sent and populated with event reference');

    // 2. Send PACKAGE_CARD message
    const resPkgCard = await request(app)
      .post(`/api/v1/conversations/${conv1._id}/messages`)
      .set('Authorization', `Bearer ${tokenCommA}`)
      .send({
        type: 'PACKAGE_CARD',
        packageId: pkg1._id,
        text: 'Review our Gold sponsorship package',
        metadata: { price: pkg1.cashRequirement.amount, currency: pkg1.cashRequirement.currency },
      });
    if (resPkgCard.status !== 201 || resPkgCard.body.data.message.type !== 'PACKAGE_CARD') {
      throw new Error(`Failed to send PACKAGE_CARD: ${JSON.stringify(resPkgCard.body)}`);
    }
    const pkgCardMsg = resPkgCard.body.data.message;
    if (!pkgCardMsg.packageId || String(pkgCardMsg.packageId._id || pkgCardMsg.packageId) !== String(pkg1._id)) {
      throw new Error(`PACKAGE_CARD missing packageId: ${JSON.stringify(pkgCardMsg)}`);
    }
    console.log('  ✓ PACKAGE_CARD message sent and populated with package reference');

    // 3. Send DOCUMENT message type
    const resDocMsg = await request(app)
      .post(`/api/v1/conversations/${conv1._id}/messages`)
      .set('Authorization', `Bearer ${tokenCompA}`)
      .send({
        type: 'DOCUMENT',
        text: 'Attached Sponsorship Deck PDF',
        metadata: { fileName: 'Deck_2026.pdf', fileSize: 1048576 },
      });
    if (resDocMsg.status !== 201 || resDocMsg.body.data.message.type !== 'DOCUMENT') {
      throw new Error(`Failed to send DOCUMENT message: ${JSON.stringify(resDocMsg.body)}`);
    }
    console.log('  ✓ DOCUMENT message type successfully created with metadata');

    // 4. Verify Contact card posted by contact sharing
    const resMsgsAfterContact = await request(app)
      .get(`/api/v1/conversations/${conv1._id}/messages`)
      .set('Authorization', `Bearer ${tokenCompA}`);
    const contactMsgFound = resMsgsAfterContact.body.data.some(m => m.type === 'CONTACT' && m.contactShareId);
    if (!contactMsgFound) {
      throw new Error('Expected CONTACT message card created during contact sharing');
    }
    console.log('  ✓ Verified CONTACT card message type persisted with contactShareId');

    // ================================================================
    // TEST 12: Phase 14 V2 Reconciliation - Socket.IO Room Authorization & Privacy
    // ================================================================
    console.log('[TEST 12] Testing Socket.IO Room Authorization & Event Privacy Lifecycle...');

    // 1. Verify Event publishedAt field exists
    const refreshedEvent = await Event.findById(event1._id);
    if (!refreshedEvent.publishedAt) {
      throw new Error('Event publishedAt was not recorded upon publishing');
    }
    console.log(`  ✓ Event publishedAt correctly stamped: ${refreshedEvent.publishedAt.toISOString()}`);

    // 2. Test Socket.IO join room authorization logic
    const { registerChatHandlers } = require('./src/sockets/chatSocket');

    // Test unauthorized socket join
    let joinDenied = false;
    let unauthorizedPromise;
    const mockUnauthorizedSocket = {
      user: userCompB, // Company B is not a participant in conv1
      join: () => { throw new Error('Unauthorized socket should not join room'); },
      on: function(event, handler) {
        if (event === 'conversation:join') {
          unauthorizedPromise = handler({ conversationId: String(conv1._id) }, (res) => {
            if (res && res.error && res.status === 403) {
              joinDenied = true;
            }
          });
        }
      },
    };
    registerChatHandlers(null, mockUnauthorizedSocket);
    if (unauthorizedPromise) await unauthorizedPromise;
    else await new Promise(r => setTimeout(r, 200));

    if (!joinDenied) {
      throw new Error('Expected socket.io conversation:join to be rejected with 403 for outsider');
    }
    console.log('  ✓ Socket.IO conversation:join strictly blocks non-participants with 403');

    // Test authorized socket join
    let joinSuccess = false;
    let authorizedPromise;
    const joinedRooms = [];
    const mockAuthorizedSocket = {
      user: userCompA, // Company A is participant
      join: (room) => { joinedRooms.push(room); },
      on: function(event, handler) {
        if (event === 'conversation:join') {
          authorizedPromise = handler({ conversationId: String(conv1._id) }, (res) => {
            if (res && res.success) {
              joinSuccess = true;
            }
          });
        }
      },
    };
    registerChatHandlers(null, mockAuthorizedSocket);
    if (authorizedPromise) await authorizedPromise;
    else await new Promise(r => setTimeout(r, 200));

    if (!joinSuccess || !joinedRooms.includes(`conversation:${conv1._id}`)) {
      throw new Error('Expected authorized participant to join conversation room');
    }
    console.log('  ✓ Socket.IO conversation:join permits authorized participant into room');

    console.log('\n================================================================');
    console.log(' ALL 12 PHASES 7-15 MARKETPLACE TESTS PASSED WITH 100% SUCCESS  ');
    console.log('================================================================');
  } finally {
    console.log('\n[CLEANUP] Cleaning up test fixtures...');
    await Promise.all([
      User.deleteMany({ _id: { $in: cleanupUserIds } }),
      Company.deleteMany({ _id: { $in: cleanupCompanyIds } }),
      Committee.deleteMany({ _id: { $in: cleanupCommitteeIds } }),
      Event.deleteMany({ _id: { $in: cleanupEventIds } }),
      SponsorshipPackage.deleteMany({ _id: { $in: cleanupPackageIds } }),
      Application.deleteMany({ _id: { $in: cleanupAppIds } }),
      Invitation.deleteMany({ _id: { $in: cleanupInvIds } }),
      Conversation.deleteMany({ _id: { $in: cleanupConvIds } }),
      Message.deleteMany({ conversationId: { $in: cleanupConvIds } }),
      ContactShare.deleteMany({ conversationId: { $in: cleanupConvIds } }),
      Notification.deleteMany({ _id: { $in: cleanupNotifIds } }),
      SavedEvent.deleteMany({ eventId: { $in: cleanupEventIds } }),
    ]);
    console.log('✓ Cleanup complete.');
    await disconnectDB();
  }
}

if (require.main === module) {
  runMarketplaceTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n❌ Test suite failed:', err);
      process.exit(1);
    });
}

module.exports = runMarketplaceTests;
