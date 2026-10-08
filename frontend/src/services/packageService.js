import api from './api.js';

/**
 * Sponsorship Packages API Service
 * Authoritative source: docs/PITCH_API_FINAL.md Section 5
 * Backend routes: /api/v1/packages/*
 */
export const packageService = {
  /**
   * Get packages for an event
   * GET /api/v1/events/:eventId/packages
   */
  async getPackagesByEvent(eventId) {
    const res = await api.get(`/events/${eventId}/packages`);
    return res.data;
  },

  /**
   * Get package details
   * GET /api/v1/packages/:packageId
   */
  async getPackage(id) {
    const res = await api.get(`/packages/${id}`);
    return res.data;
  },

  /**
   * Create package for event (Committee owner only)
   * POST /api/v1/events/:eventId/packages
   */
  async createPackage(eventId, data) {
    const res = await api.post(`/events/${eventId}/packages`, data);
    return res.data;
  },

  /**
   * Update package (Committee owner or admin)
   * PATCH /api/v1/packages/:packageId
   */
  async updatePackage(id, data) {
    const res = await api.patch(`/packages/${id}`, data);
    return res.data;
  },

  /**
   * Delete / deactivate package (Committee owner or admin)
   * DELETE /api/v1/packages/:packageId
   */
  async deletePackage(id) {
    const res = await api.delete(`/packages/${id}`);
    return res.data;
  },
};

export default packageService;
