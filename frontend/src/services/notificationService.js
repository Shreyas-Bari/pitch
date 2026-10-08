import api from './api.js';

/**
 * Notifications API Service
 * Authoritative source: docs/PITCH_API_FINAL.md Section 18
 * Backend routes: /api/v1/notifications/*
 */
export const notificationService = {
  /**
   * List notifications for logged-in user
   * GET /api/v1/notifications
   */
  async getNotifications(params = {}) {
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  /**
   * Get unread notification count
   * GET /api/v1/notifications/unread-count
   */
  async getUnreadCount() {
    const res = await api.get('/notifications/unread-count');
    return res.data;
  },

  /**
   * Mark single notification as read
   * POST /api/v1/notifications/:id/read
   */
  async markAsRead(id) {
    const res = await api.post(`/notifications/${id}/read`);
    return res.data;
  },

  /**
   * Mark all notifications as read
   * POST /api/v1/notifications/read-all
   */
  async markAllAsRead() {
    const res = await api.post('/notifications/read-all');
    return res.data;
  },

  /**
   * Delete notification
   * DELETE /api/v1/notifications/:id
   */
  async deleteNotification(id) {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },
};

export default notificationService;
