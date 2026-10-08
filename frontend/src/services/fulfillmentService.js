import api from './api.js';

/**
 * Fulfillment API Service
 * Authoritative source: docs/PITCH_API_FINAL.md Section 14 & docs/PITCH_DATABASE_FINAL.md
 * Backend routes: /api/v1/deals/:dealId/fulfillment and /api/v1/fulfillment/:id/*
 */
export const fulfillmentService = {
  /**
   * Get fulfillment records for a deal
   * GET /api/v1/deals/:dealId/fulfillment
   */
  async getFulfillmentsByDeal(dealId) {
    const res = await api.get(`/deals/${dealId}/fulfillment`);
    return res.data;
  },

  /**
   * Add fulfillment item to deal
   * POST /api/v1/deals/:dealId/fulfillment
   */
  async addFulfillment(dealId, data) {
    const res = await api.post(`/deals/${dealId}/fulfillment`, data);
    return res.data;
  },

  /**
   * Update fulfillment record
   * PATCH /api/v1/fulfillment/:fulfillmentId
   */
  async updateFulfillment(fulfillmentId, data) {
    const res = await api.patch(`/fulfillment/${fulfillmentId}`, data);
    return res.data;
  },

  /**
   * Mark fulfillment item complete
   * POST /api/v1/fulfillment/:fulfillmentId/complete
   */
  async completeFulfillment(fulfillmentId, notes) {
    const res = await api.post(`/fulfillment/${fulfillmentId}/complete`, { notes });
    return res.data;
  },

  /**
   * Upload / submit evidence for fulfillment item
   * POST /api/v1/fulfillment/:fulfillmentId/evidence
   */
  async addEvidence(fulfillmentId, data) {
    const res = await api.post(`/fulfillment/${fulfillmentId}/evidence`, data);
    return res.data;
  },

  /**
   * Get evidence list for fulfillment item
   * GET /api/v1/fulfillment/:fulfillmentId/evidence
   */
  async getEvidence(fulfillmentId) {
    const res = await api.get(`/fulfillment/${fulfillmentId}/evidence`);
    return res.data;
  },
};

export default fulfillmentService;
