import api from './api.js';

/**
 * Deals API Service
 * Authoritative source: docs/PITCH_API_FINAL.md Section 10 & docs/PITCH_DATABASE_FINAL.md
 * Backend routes: /api/v1/deals/*
 */
export const dealService = {
  /**
   * List deals for authenticated company or committee
   * GET /api/v1/deals
   */
  async getDeals(params = {}) {
    const res = await api.get('/deals', { params });
    return res.data;
  },

  /**
   * Get deal details by ID
   * GET /api/v1/deals/:id
   */
  async getDeal(id) {
    const res = await api.get(`/deals/${id}`);
    return res.data;
  },

  /**
   * Create new deal negotiation
   * POST /api/v1/deals
   */
  async createDeal(data) {
    const res = await api.post('/deals', data);
    return res.data;
  },

  /**
   * Update deal details
   * PATCH /api/v1/deals/:id
   */
  async updateDeal(id, data) {
    const res = await api.patch(`/deals/${id}`, data);
    return res.data;
  },

  /**
   * Get deal timeline
   * GET /api/v1/deals/:id/timeline
   */
  async getTimeline(id) {
    const res = await api.get(`/deals/${id}/timeline`);
    return res.data;
  },

  /**
   * Cancel deal negotiation
   * POST /api/v1/deals/:id/cancel
   */
  async cancelDeal(id, reason) {
    const res = await api.post(`/deals/${id}/cancel`, { reason });
    return res.data;
  },

  /**
   * Mutually agree on current deal proposal
   * POST /api/v1/deals/:id/agree
   */
  async agreeDeal(id) {
    const res = await api.post(`/deals/${id}/agree`);
    return res.data;
  },

  /**
   * Get agreed deal agreement state
   * GET /api/v1/deals/:id/agreement
   */
  async getAgreement(id) {
    const res = await api.get(`/deals/${id}/agreement`);
    return res.data;
  },

  /**
   * Complete deal
   * POST /api/v1/deals/:id/complete
   */
  async completeDeal(id, data = {}) {
    const res = await api.post(`/deals/${id}/complete`, data);
    return res.data;
  },

  /**
   * Get deal completion status
   * GET /api/v1/deals/:id/completion
   */
  async getCompletion(id) {
    const res = await api.get(`/deals/${id}/completion`);
    return res.data;
  },

  /**
   * Raise a dispute on a deal
   * POST /api/v1/deals/:id/dispute
   */
  async raiseDispute(id, data) {
    const res = await api.post(`/deals/${id}/dispute`, data);
    return res.data;
  },

  /**
   * Get disputes on a deal
   * GET /api/v1/deals/:id/disputes
   */
  async getDisputes(id) {
    const res = await api.get(`/deals/${id}/disputes`);
    return res.data;
  },
};

export default dealService;
