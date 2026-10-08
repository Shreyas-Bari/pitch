const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const companyRoutes = require('./companyRoutes');
const committeeRoutes = require('./committeeRoutes');
const eventRoutes = require('./eventRoutes');
// Phase 7-15 Marketplace, Communication & Discovery Routes
const packageRoutes = require('./packageRoutes');
const searchRoutes = require('./searchRoutes');
const applicationRoutes = require('./applicationRoutes');
const invitationRoutes = require('./invitationRoutes');
const notificationRoutes = require('./notificationRoutes');
const conversationRoutes = require('./conversationRoutes');
const messageRoutes = require('./messageRoutes');
const searchController = require('../controllers/searchController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireCompany, requireCommittee } = require('../middleware/roleMiddleware');

// Phase 16-22 Deal, Proposal & MoU Routes
const dealRoutes = require('./dealRoutes');
const proposalRoutes = require('./proposalRoutes');
const mouRoutes = require('./mouRoutes');

// Phase 23-31 Fulfillment, Reviews, Reports & Audit
const fulfillmentRoutes = require('./fulfillmentRoutes');
const reviewRoutes = require('./reviewRoutes');
const reportRoutes = require('./reportRoutes');

const router = express.Router();

/**
 * PITCH Central API Router
 * Enforces API Versioning (/api/v1) per docs/PITCH_API_FINAL.md Section 1.
 */

// v1 Router
const v1Router = express.Router();

// Health Endpoints under v1 (/api/v1/health and /api/v1/health/db)
v1Router.use('/health', healthRoutes);

// Auth & User Endpoints under v1 (/api/v1/auth and /api/v1/users)
v1Router.use('/auth', authRoutes);
v1Router.use('/users', userRoutes);

// RBAC & Ownership Authorized Endpoints
v1Router.use('/admin', adminRoutes);
v1Router.use('/companies', companyRoutes);
v1Router.use('/committees', committeeRoutes);

// Marketplace, Discovery & Communication Endpoints (Phases 7-15)
v1Router.use('/events', eventRoutes);
v1Router.use('/packages', packageRoutes);
v1Router.use('/search', searchRoutes);

// Recommendations (/api/v1/recommendations/events and /api/v1/recommendations/companies)
const recommendationsRouter = express.Router();
recommendationsRouter.get('/events', authMiddleware, requireCompany, searchController.getEventRecommendations);
recommendationsRouter.get('/companies', authMiddleware, requireCommittee, searchController.getCompanyRecommendations);
v1Router.use('/recommendations', recommendationsRouter);

v1Router.use('/applications', applicationRoutes);
v1Router.use('/invitations', invitationRoutes);
v1Router.use('/notifications', notificationRoutes);
v1Router.use('/conversations', conversationRoutes);
v1Router.use('/messages', messageRoutes);

// Deal, Proposal, MoU & Signature Workflow Endpoints (Phases 16 - 22)
v1Router.use('/deals', dealRoutes);
v1Router.use('/proposals', proposalRoutes);
v1Router.use('/mous', mouRoutes);
v1Router.use('/mou', mouRoutes); // Convenience alias

// Post-agreement, fulfillment, reviews & reports (Phases 23 - 31)
v1Router.use('/fulfillment', fulfillmentRoutes);
v1Router.use('/reviews', reviewRoutes);
v1Router.use('/reports', reportRoutes);

// Mount /api/v1 versioned path
router.use('/api/v1', v1Router);

// Mount backward-compatible / unversioned aliases
router.use('/api/health', healthRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/deals', dealRoutes);
router.use('/api/proposals', proposalRoutes);
router.use('/api/mous', mouRoutes);
router.use('/api/mou', mouRoutes);

module.exports = router;
