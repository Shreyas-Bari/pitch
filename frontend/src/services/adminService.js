import api from './api.js';

/**
 * Admin API Service
 * Authoritative source: docs/PITCH_API_FINAL.md Section 20
 * Backend routes: /api/v1/admin/*
 */
export const adminService = {
  /**
   * Get paginated users
   * GET /api/v1/admin/users
   */
  async getUsers(params = {}) {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  /**
   * Update user status (ACTIVE, SUSPENDED, PENDING, DEACTIVATED)
   * PATCH /api/v1/admin/users/:userId/status
   */
  async updateUserStatus(userId, status) {
    const payload = typeof status === 'object' ? status : { status };
    const res = await api.patch(`/admin/users/${userId}/status`, payload);
    return res.data;
  },

  /**
   * Get all events for moderation
   * GET /api/v1/admin/events
   */
  async getEvents(params = {}) {
    const res = await api.get('/admin/events', { params });
    return res.data;
  },

  /**
   * Update event status
   * PATCH /api/v1/admin/events/:eventId/status
   */
  async updateEventStatus(eventId, status) {
    const res = await api.patch(`/admin/events/${eventId}/status`, { status });
    return res.data;
  },

  /**
   * Get all deals
   * GET /api/v1/admin/deals
   */
  async getDeals(params = {}) {
    const res = await api.get('/admin/deals', { params });
    return res.data;
  },

  /**
   * Get reports and disputes
   * GET /api/v1/admin/reports
   */
  async getReports(params = {}) {
    const res = await api.get('/admin/reports', { params });
    return res.data;
  },

  /**
   * Get analytics overview
   * GET /api/v1/admin/analytics/overview
   */
  async getAnalyticsOverview() {
    const res = await api.get('/admin/analytics/overview');
    return res.data;
  },

  /**
   * Get analytics events breakdown
   * GET /api/v1/admin/analytics/events
   */
  async getAnalyticsEvents() {
    const res = await api.get('/admin/analytics/events');
    return res.data;
  },

  /**
   * Get analytics deals breakdown
   * GET /api/v1/admin/analytics/deals
   */
  async getAnalyticsDeals() {
    const res = await api.get('/admin/analytics/deals');
    return res.data;
  },

  /**
   * Get analytics users breakdown
   * GET /api/v1/admin/analytics/users
   */
  async getAnalyticsUsers() {
    const res = await api.get('/admin/analytics/users');
    return res.data;
  },

  /**
   * Get single user details
   * GET /api/v1/admin/users/:userId
   */
  async getUser(userId) {
    const res = await api.get(`/admin/users/${userId}`);
    return res.data;
  },

  /**
   * Get single deal details
   * GET /api/v1/admin/deals/:dealId
   */
  async getDeal(dealId) {
    const res = await api.get(`/admin/deals/${dealId}`);
    return res.data;
  },

  /**
   * Get single report details
   * GET /api/v1/admin/reports/:reportId
   */
  async getReport(reportId) {
    const res = await api.get(`/admin/reports/${reportId}`);
    return res.data;
  },

  /**
   * Update report status / resolution
   * PATCH /api/v1/admin/reports/:reportId
   */
  async updateReport(reportId, data) {
    const res = await api.patch(`/admin/reports/${reportId}`, data);
    return res.data;
  },

  /**
   * Get audit logs
   * GET /api/v1/admin/audit-logs
   */
  async getAuditLogs(params = {}) {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },
};

export default adminService;
