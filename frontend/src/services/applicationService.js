import api from './api.js';

/**
 * Applications API Service
 * Authoritative source: docs/PITCH_API_FINAL.md Section 6
 * Backend routes: /api/v1/applications/*
 */
export const applicationService = {
  /**
   * Submit application to an event (Company role only)
   * POST /api/v1/events/:eventId/applications
   */
  async applyToEvent(eventId, data) {
    const res = await api.post(`/events/${eventId}/applications`, data);
    return res.data;
  },

  /**
   * Legacy alias for submit application
   * POST /api/v1/events/:eventId/applications
   */
  async createApplication(eventId, data) {
    return this.applyToEvent(eventId, data);
  },

  /**
   * Get applications for a specific event (Committee role only)
   * GET /api/v1/events/:eventId/applications
   */
  async getEventApplications(eventId, params = {}) {
    const res = await api.get(`/events/${eventId}/applications`, { params });
    return res.data;
  },

  /**
   * List applications (Company see sent, Committee see received)
   * GET /api/v1/applications
   */
  async getApplications(params = {}) {
    const res = await api.get('/applications', { params });
    return res.data;
  },

  /**
   * Get single application details
   * GET /api/v1/applications/:id
   */
  async getApplication(id) {
    const res = await api.get(`/applications/${id}`);
    return res.data;
  },

  /**
   * Update pending application (Company only)
   * PATCH /api/v1/applications/:id
   */
  async updateApplication(id, data) {
    const res = await api.patch(`/applications/${id}`, data);
    return res.data;
  },

  /**
   * Accept application (Committee only)
   * POST /api/v1/applications/:id/accept
   */
  async acceptApplication(id) {
    const res = await api.post(`/applications/${id}/accept`);
    return res.data;
  },

  /**
   * Reject application (Committee only)
   * POST /api/v1/applications/:id/reject
   */
  async rejectApplication(id) {
    const res = await api.post(`/applications/${id}/reject`);
    return res.data;
  },

  /**
   * Withdraw application (Company only)
   * POST /api/v1/applications/:id/withdraw
   */
  async withdrawApplication(id) {
    const res = await api.post(`/applications/${id}/withdraw`);
    return res.data;
  },
};

export default applicationService;
