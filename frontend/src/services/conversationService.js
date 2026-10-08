import api from './api.js';

/**
 * Conversations API Service
 * Authoritative source: docs/PITCH_API_FINAL.md Section 9
 * Backend routes: /api/v1/conversations/*
 */
export const conversationService = {
  /**
   * List conversations for logged-in user
   * GET /api/v1/conversations
   */
  async getConversations(params = {}) {
    const res = await api.get('/conversations', { params });
    return res.data;
  },

  /**
   * Open or get existing conversation between company and committee
   * POST /api/v1/conversations
   */
  async openConversation(data) {
    const res = await api.post('/conversations', data);
    return res.data;
  },

  /**
   * Get conversation details by ID
   * GET /api/v1/conversations/:id
   */
  async getConversation(id) {
    const res = await api.get(`/conversations/${id}`);
    return res.data;
  },

  /**
   * Archive conversation
   * POST /api/v1/conversations/:id/archive
   */
  async archiveConversation(id) {
    const res = await api.post(`/conversations/${id}/archive`);
    return res.data;
  },

  /**
   * Share contact details in conversation
   * POST /api/v1/conversations/:id/contact-share
   */
  async shareContact(id, data) {
    const res = await api.post(`/conversations/${id}/contact-share`, data);
    return res.data;
  },

  /**
   * Get shared contacts in conversation
   * GET /api/v1/conversations/:id/contact-shares
   */
  async getContactShares(id) {
    const res = await api.get(`/conversations/${id}/contact-shares`);
    return res.data;
  },
};

export default conversationService;
