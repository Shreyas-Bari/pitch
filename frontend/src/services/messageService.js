import api from './api.js';

/**
 * Messages API Service
 * Authoritative source: docs/PITCH_API_FINAL.md Section 9 & docs/PITCH_DATABASE_FINAL.md
 * Backend routes: /api/v1/messages/*
 */
export const messageService = {
  /**
   * Get messages for conversation (paginated)
   * GET /api/v1/conversations/:conversationId/messages
   */
  async getMessages(conversationId, params = {}) {
    const res = await api.get(`/conversations/${conversationId}/messages`, {
      params,
    });
    return res.data;
  },

  /**
   * Send message in conversation
   * POST /api/v1/conversations/:conversationId/messages
   */
  async sendMessage(conversationId, data) {
    const res = await api.post(`/conversations/${conversationId}/messages`, data);
    return res.data;
  },

  /**
   * Mark messages in conversation as read
   * POST /api/v1/conversations/:conversationId/read
   */
  async markAsRead(conversationId) {
    const res = await api.post(`/conversations/${conversationId}/read`);
    return res.data;
  },

  /**
   * Edit message
   * PATCH /api/v1/messages/:messageId
   */
  async editMessage(messageId, data) {
    const res = await api.patch(`/messages/${messageId}`, data);
    return res.data;
  },

  /**
   * Delete message (soft delete)
   * DELETE /api/v1/messages/:messageId
   */
  async deleteMessage(messageId) {
    const res = await api.delete(`/messages/${messageId}`);
    return res.data;
  },
};

export default messageService;
