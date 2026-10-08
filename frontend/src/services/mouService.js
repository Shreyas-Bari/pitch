import api from './api.js';

/**
 * MoU, Versioning & Signing API Service
 * Authoritative source: docs/PITCH_MOU_FINAL.md & docs/PITCH_API_FINAL.md Section 12, 13
 * Backend routes: /api/v1/deals/:dealId/mou and /api/v1/mou/:mouId/*
 */
export const mouService = {
  /**
   * Get MoU for a deal
   * GET /api/v1/deals/:dealId/mou
   */
  async getMouByDeal(dealId) {
    const res = await api.get(`/deals/${dealId}/mou`);
    return res.data;
  },

  /**
   * Generate MoU for a deal
   * POST /api/v1/deals/:dealId/mou
   */
  async generateMou(dealId, data) {
    const res = await api.post(`/deals/${dealId}/mou`, data);
    return res.data;
  },

  /**
   * Get MoU by ID
   * GET /api/v1/mou/:mouId
   */
  async getMou(mouId) {
    const res = await api.get(`/mou/${mouId}`);
    return res.data;
  },

  /**
   * Get MoU preview data
   * GET /api/v1/mou/:mouId/preview
   */
  async getPreview(mouId) {
    const res = await api.get(`/mou/${mouId}/preview`);
    return res.data;
  },

  /**
   * Create new MoU version
   * POST /api/v1/mou/:mouId/versions
   */
  async createVersion(mouId, data) {
    const res = await api.post(`/mou/${mouId}/versions`, data);
    return res.data;
  },

  /**
   * Get version history
   * GET /api/v1/mou/:mouId/versions
   */
  async getVersions(mouId) {
    const res = await api.get(`/mou/${mouId}/versions`);
    return res.data;
  },

  /**
   * Get signing status
   * GET /api/v1/mou/:mouId/signing-status
   */
  async getSigningStatus(mouId) {
    const res = await api.get(`/mou/${mouId}/signing-status`);
    return res.data;
  },

  /**
   * Sign MoU version (academic/demo signature)
   * POST /api/v1/mou/:mouId/sign
   */
  async signMou(mouId, signatureData) {
    const res = await api.post(`/mou/${mouId}/sign`, signatureData);
    return res.data;
  },

  /**
   * Get signatures recorded
   * GET /api/v1/mou/:mouId/signatures
   */
  async getSignatures(mouId) {
    const res = await api.get(`/mou/${mouId}/signatures`);
    return res.data;
  },

  /**
   * Download executed MoU PDF
   * GET /api/v1/mou/:mouId/download
   */
  async downloadMou(mouId) {
    const res = await api.get(`/mou/${mouId}/download`, {
      responseType: 'blob',
    });
    return res.data;
  },

  /**
   * Get executed document record
   * GET /api/v1/mou/:mouId/executed-document
   */
  async getExecutedDocument(mouId) {
    const res = await api.get(`/mou/${mouId}/executed-document`);
    return res.data;
  },
};

export default mouService;
