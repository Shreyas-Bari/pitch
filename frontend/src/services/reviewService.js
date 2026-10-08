import api from './api.js';

/**
 * Reviews & Reputation API Service
 * Authoritative source: docs/PITCH_API_FINAL.md Section 17 & docs/PITCH_DATABASE_FINAL.md
 * Backend routes: /api/v1/deals/:dealId/reviews and /api/v1/reviews/:id
 */
export const reviewService = {
  /**
   * Get reviews for a deal
   * GET /api/v1/deals/:dealId/reviews
   */
  async getDealReviews(dealId) {
    const res = await api.get(`/deals/${dealId}/reviews`);
    return res.data;
  },

  /**
   * Submit review on completed deal
   * POST /api/v1/deals/:dealId/reviews
   */
  async createReview(dealId, data) {
    const res = await api.post(`/deals/${dealId}/reviews`, data);
    return res.data;
  },

  /**
   * Update existing review
   * PATCH /api/v1/reviews/:reviewId
   */
  async updateReview(reviewId, data) {
    const res = await api.patch(`/reviews/${reviewId}`, data);
    return res.data;
  },

  /**
   * Get reviews for a company
   * GET /api/v1/companies/:companyId/reviews
   */
  async getCompanyReviews(companyId) {
    const res = await api.get(`/companies/${companyId}/reviews`);
    return res.data;
  },

  /**
   * Get reviews for a committee
   * GET /api/v1/committees/:committeeId/reviews
   */
  async getCommitteeReviews(committeeId) {
    const res = await api.get(`/committees/${committeeId}/reviews`);
    return res.data;
  },
};

export default reviewService;
