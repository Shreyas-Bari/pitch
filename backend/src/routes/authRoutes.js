const express = require('express');
const authController = require('../controllers/authController');
const { validateRequest } = require('../middleware/validationMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
} = require('../validators/authValidator');

const { authRateLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

/**
 * Authentication Routes
 * Base path: /api/v1/auth
 * Source: docs/PITCH_API_FINAL.md Section 2
 */

// Registration & Login
router.post('/register', authRateLimiter, validateRequest({ body: validateRegister }), authController.register);
router.post('/login', authRateLimiter, validateRequest({ body: validateLogin }), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authRateLimiter, authController.refresh);

// Authenticated current user
router.get('/me', authMiddleware, authController.getMe);

// Password recovery & management
router.post('/forgot-password', authRateLimiter, validateRequest({ body: validateForgotPassword }), authController.forgotPassword);
router.post('/reset-password', authRateLimiter, validateRequest({ body: validateResetPassword }), authController.resetPassword);
router.patch('/change-password', authRateLimiter, authMiddleware, validateRequest({ body: validateChangePassword }), authController.changePassword);

module.exports = router;
