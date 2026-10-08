import api from './api.js';

/**
 * Authentication API Service
 * Authoritative source: docs/PITCH_API_FINAL.md Section 2
 * Backend routes: /api/v1/auth/*
 */
export const authService = {
  /**
   * Register a new user and link role profile
   * POST /api/v1/auth/register
   */
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  /**
   * Log in an existing user
   * POST /api/v1/auth/login
   */
  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  /**
   * Log out user and clear refresh token cookie
   * POST /api/v1/auth/logout
   */
  async logout() {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  /**
   * Refresh access token using HttpOnly cookie
   * POST /api/v1/auth/refresh
   */
  async refresh() {
    const res = await api.post('/auth/refresh');
    return res.data;
  },

  /**
   * Get current authenticated user details and profile
   * GET /api/v1/auth/me
   */
  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  /**
   * Request password reset token
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(data) {
    const res = await api.post('/auth/forgot-password', data);
    return res.data;
  },

  /**
   * Reset password using token
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(data) {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },

  /**
   * Change password for authenticated user
   * PATCH /api/v1/auth/change-password
   */
  async changePassword(data) {
    const res = await api.patch('/auth/change-password', data);
    return res.data;
  },
};

export default authService;
