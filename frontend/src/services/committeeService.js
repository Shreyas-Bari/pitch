import api from './api.js';

/**
 * Committee Profiles & Management API Service
 * Authoritative source: docs/PITCH_API_FINAL.md Section 3 & docs/PITCH_DATABASE_FINAL.md
 * Backend routes: /api/v1/committees/*
 */
export const committeeService = {
  /**
   * List public committee profiles
   * GET /api/v1/committees
   */
  async getCommittees(params = {}) {
    const res = await api.get('/committees', { params });
    return res.data;
  },

  /**
   * Get committee profile by ID
   * GET /api/v1/committees/:id
   */
  async getCommittee(id) {
    const res = await api.get(`/committees/${id}`);
    return res.data;
  },

  /**
   * Get logged-in committee profile
   * GET /api/v1/committees/me
   */
  async getMyProfile() {
    const res = await api.get('/committees/me');
    return res.data;
  },

  /**
   * Update logged-in committee profile
   * PATCH /api/v1/committees/me
   */
  async updateMyProfile(data) {
    const res = await api.patch('/committees/me', data);
    return res.data;
  },

  /**
   * Get committee self-reported history
   * GET /api/v1/committees/me/history
   */
  async getMyHistory() {
    const res = await api.get('/committees/me/history');
    return res.data;
  },

  /**
   * Create self-reported history item
   * POST /api/v1/committees/me/history
   */
  async createMyHistory(data) {
    const res = await api.post('/committees/me/history', data);
    return res.data;
  },

  /**
   * Update self-reported history item
   * PATCH /api/v1/committees/me/history/:historyId
   */
  async updateMyHistory(historyId, data) {
    const res = await api.patch(`/committees/me/history/${historyId}`, data);
    return res.data;
  },

  /**
   * Delete self-reported history item
   * DELETE /api/v1/committees/me/history/:historyId
   */
  async deleteMyHistory(historyId) {
    const res = await api.delete(`/committees/me/history/${historyId}`);
    return res.data;
  },

  /**
   * Get public committee self-reported history
   * GET /api/v1/committees/:committeeId/history
   */
  async getCommitteeHistory(committeeId) {
    const res = await api.get(`/committees/${committeeId}/history`);
    return res.data;
  },

  /**
   * Get committee reviews
   * GET /api/v1/committees/:committeeId/reviews
   */
  async getCommitteeReviews(committeeId) {
    const res = await api.get(`/committees/${committeeId}/reviews`);
    return res.data;
  },

  /**
   * Get committee verified completed deal history
   * GET /api/v1/committees/:committeeId/verified-history
   */
  async getCommitteeVerifiedHistory(committeeId) {
    const res = await api.get(`/committees/${committeeId}/verified-history`);
    return res.data;
  },
};

export default committeeService;
