import api from './api.js';

/**
 * Proposals API Service
 * Authoritative source: docs/PITCH_API_FINAL.md Section 11 & docs/PITCH_DATABASE_FINAL.md
 * Backend routes: /api/v1/proposals/*
 */
export const proposalService = {
  /**
   * Get proposals for a deal
   * GET /api/v1/deals/:dealId/proposals
   */
  async getProposals(dealId) {
    const res = await api.get(`/deals/${dealId}/proposals`);
    return res.data;
  },

  /**
   * Alias for get proposals for a deal
   * GET /api/v1/deals/:dealId/proposals
   */
  async getProposalsByDeal(dealId) {
    return this.getProposals(dealId);
  },

  /**
   * Get proposal details by ID
   * GET /api/v1/proposals/:id
   */
  async getProposal(id) {
    const res = await api.get(`/proposals/${id}`);
    return res.data;
  },

  /**
   * Create new proposal on deal
   * POST /api/v1/deals/:dealId/proposals
   */
  async createProposal(dealId, data) {
    const res = await api.post(`/deals/${dealId}/proposals`, data);
    return res.data;
  },

  /**
   * Counter proposal
   * POST /api/v1/proposals/:id/counter
   */
  async counterProposal(id, data) {
    const res = await api.post(`/proposals/${id}/counter`, data);
    return res.data;
  },

  /**
   * Accept proposal
   * POST /api/v1/proposals/:id/accept
   */
  async acceptProposal(id) {
    const res = await api.post(`/proposals/${id}/accept`);
    return res.data;
  },

  /**
   * Decline proposal
   * POST /api/v1/proposals/:id/decline
   */
  async declineProposal(id, reason) {
    const res = await api.post(`/proposals/${id}/decline`, { reason });
    return res.data;
  },

  /**
   * Withdraw proposal
   * POST /api/v1/proposals/:id/withdraw
   */
  async withdrawProposal(id) {
    const res = await api.post(`/proposals/${id}/withdraw`);
    return res.data;
  },
};

export default proposalService;
