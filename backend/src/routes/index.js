const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const companyRoutes = require('./companyRoutes');
const committeeRoutes = require('./committeeRoutes');
const eventRoutes = require('./eventRoutes');

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
v1Router.use('/events', eventRoutes);

// Mount /api/v1 versioned path
router.use('/api/v1', v1Router);

// Mount backward-compatible / unversioned aliases
router.use('/api/health', healthRoutes);
router.use('/api/auth', authRoutes);

module.exports = router;
