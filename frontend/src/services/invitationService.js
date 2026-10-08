import api from './api.js';

/**
 * Invitations API Service
 * Authoritative source: docs/PITCH_API_FINAL.md Section 7
 * Backend routes: /api/v1/invitations/*
 */
export const invitationService = {
  /**
   * Send invitation to a company (Committee only)
   * POST /api/v1/events/:eventId/invitations
   */
  async sendInvitation(eventId, data) {
    const res = await api.post(`/events/${eventId}/invitations`, data);
    return res.data;
  },

  /**
   * Legacy alias for send invitation
   * POST /api/v1/events/:eventId/invitations
   */
  async createInvitation(eventId, data) {
    return this.sendInvitation(eventId, data);
  },

  /**
   * List invitations (Committee see sent, Company see received)
   * GET /api/v1/invitations
   */
  async getInvitations(params = {}) {
    const res = await api.get('/invitations', { params });
    return res.data;
  },

  /**
   * Get invitation details
   * GET /api/v1/invitations/:id
   */
  async getInvitation(id) {
    const res = await api.get(`/invitations/${id}`);
    return res.data;
  },

  /**
   * Accept invitation (Company recipient only)
   * POST /api/v1/invitations/:id/accept
   */
  async acceptInvitation(id) {
    const res = await api.post(`/invitations/${id}/accept`);
    return res.data;
  },

  /**
   * Decline invitation (Company recipient only)
   * POST /api/v1/invitations/:id/decline
   */
  async declineInvitation(id) {
    const res = await api.post(`/invitations/${id}/decline`);
    return res.data;
  },

  /**
   * Cancel invitation (Owning committee only)
   * POST /api/v1/invitations/:id/cancel
   */
  async cancelInvitation(id) {
    const res = await api.post(`/invitations/${id}/cancel`);
    return res.data;
  },
};

export default invitationService;
