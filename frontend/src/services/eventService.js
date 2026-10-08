import api from './api.js';

/**
 * Events API Service
 * Authoritative source: docs/PITCH_API_FINAL.md Section 4 & docs/PITCH_DATABASE_FINAL.md
 * Backend routes: /api/v1/events/* and /api/v1/committees/me/events
 */
export const eventService = {
  /**
   * Get public published events with search/filter/pagination
   * GET /api/v1/events
   */
  async getEvents(params = {}) {
    const res = await api.get('/events', { params });
    return res.data;
  },

  /**
   * Get event details by ID
   * GET /api/v1/events/:id
   */
  async getEvent(id) {
    const res = await api.get(`/events/${id}`);
    return res.data;
  },

  /**
   * Create new event (Committee only)
   * POST /api/v1/events
   */
  async createEvent(data) {
    const res = await api.post('/events', data);
    return res.data;
  },

  /**
   * Update event (Committee owner only)
   * PATCH /api/v1/events/:id
   */
  async updateEvent(id, data) {
    const res = await api.patch(`/events/${id}`, data);
    return res.data;
  },

  /**
   * Publish event (transitions DRAFT -> PUBLISHED)
   * POST /api/v1/events/:id/publish
   */
  async publishEvent(id) {
    const res = await api.post(`/events/${id}/publish`);
    return res.data;
  },

  /**
   * Delete event (owner committee or admin)
   * DELETE /api/v1/events/:id
   */
  async deleteEvent(id) {
    const res = await api.delete(`/events/${id}`);
    return res.data;
  },

  /**
   * Unpublish event (reverts to DRAFT)
   * POST /api/v1/events/:id/unpublish
   */
  async unpublishEvent(id) {
    const res = await api.post(`/events/${id}/unpublish`);
    return res.data;
  },

  /**
   * Archive event
   * POST /api/v1/events/:id/archive
   */
  async archiveEvent(id) {
    const res = await api.post(`/events/${id}/archive`);
    return res.data;
  },

  /**
   * Get committee's own events
   * GET /api/v1/committees/me/events
   */
  async getMyEvents(params = {}) {
    const res = await api.get('/committees/me/events', { params });
    return res.data;
  },

  /**
   * Save an event (Company role)
   * POST /api/v1/events/:id/save
   */
  async saveEvent(id) {
    const res = await api.post(`/events/${id}/save`);
    return res.data;
  },

  /**
   * Unsave an event (Company role)
   * DELETE /api/v1/events/:id/save
   */
  async unsaveEvent(id) {
    const res = await api.delete(`/events/${id}/save`);
    return res.data;
  },

  /**
   * Get saved events for authenticated company
   * GET /api/v1/users/me/saved-events
   */
  async getSavedEvents(params = {}) {
    const res = await api.get('/users/me/saved-events', { params });
    return res.data;
  },

  /**
   * Add media item to event
   * POST /api/v1/events/:id/media
   */
  async addMedia(id, data) {
    const res = await api.post(`/events/${id}/media`, data);
    return res.data;
  },

  /**
   * Remove media item from event
   * DELETE /api/v1/events/:id/media/:mediaId
   */
  async removeMedia(id, mediaId) {
    const res = await api.delete(`/events/${id}/media/${mediaId}`);
    return res.data;
  },
};

export default eventService;
