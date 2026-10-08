import api from './api.js';

/**
 * Company Profiles & Management API Service
 * Authoritative source: docs/PITCH_API_FINAL.md Section 3 & docs/PITCH_DATABASE_FINAL.md
 * Backend routes: /api/v1/companies/*
 */
export const companyService = {
  /**
   * List public company profiles
   * GET /api/v1/companies
   */
  async getCompanies(params = {}) {
    const res = await api.get('/companies', { params });
    return res.data;
  },

  /**
   * Get company profile by ID
   * GET /api/v1/companies/:id
   */
  async getCompany(id) {
    const res = await api.get(`/companies/${id}`);
    return res.data;
  },

  /**
   * Get logged-in company profile
   * GET /api/v1/companies/me
   */
  async getMyProfile() {
    const res = await api.get('/companies/me');
    return res.data;
  },

  /**
   * Update logged-in company profile
   * PATCH /api/v1/companies/me
   */
  async updateMyProfile(data) {
    const res = await api.patch('/companies/me', data);
    return res.data;
  },

  /**
   * Get saved events for company
   * GET /api/v1/users/me/saved-events
   */
  async getSavedEvents(params = {}) {
    const res = await api.get('/users/me/saved-events', { params });
    return res.data;
  },

  /**
   * Save an event
   * POST /api/v1/events/:eventId/save
   */
  async saveEvent(eventId) {
    const res = await api.post(`/events/${eventId}/save`);
    return res.data;
  },

  /**
   * Remove saved event
   * DELETE /api/v1/events/:eventId/save
   */
  async unsaveEvent(eventId) {
    const res = await api.delete(`/events/${eventId}/save`);
    return res.data;
  },

  /**
   * Get self-reported history for logged-in company
   * GET /api/v1/companies/me/history
   */
  async getMyHistory() {
    const res = await api.get('/companies/me/history');
    return res.data;
  },

  /**
   * Create self-reported history item
   * POST /api/v1/companies/me/history
   */
  async createMyHistory(data) {
    const res = await api.post('/companies/me/history', data);
    return res.data;
  },

  /**
   * Update self-reported history item
   * PATCH /api/v1/companies/me/history/:historyId
   */
  async updateMyHistory(historyId, data) {
    const res = await api.patch(`/companies/me/history/${historyId}`, data);
    return res.data;
  },

  /**
   * Delete self-reported history item
   * DELETE /api/v1/companies/me/history/:historyId
   */
  async deleteMyHistory(historyId) {
    const res = await api.delete(`/companies/me/history/${historyId}`);
    return res.data;
  },

  /**
   * Get public company self-reported history
   * GET /api/v1/companies/:companyId/history
   */
  async getCompanyHistory(companyId) {
    const res = await api.get(`/companies/${companyId}/history`);
    return res.data;
  },

  /**
   * Get company reviews
   * GET /api/v1/companies/:companyId/reviews
   */
  async getCompanyReviews(companyId) {
    const res = await api.get(`/companies/${companyId}/reviews`);
    return res.data;
  },

  /**
   * Get company verified completed deal history
   * GET /api/v1/companies/:companyId/verified-history
   */
  async getCompanyVerifiedHistory(companyId) {
    const res = await api.get(`/companies/${companyId}/verified-history`);
    return res.data;
  },
};

export default companyService;
