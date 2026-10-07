const HealthService = require('../services/healthService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Health Controller
 * Implements GET /api/v1/health and GET /api/v1/health/db
 * Source: docs/PITCH_API_FINAL.md Section 22
 */
class HealthController {
  /**
   * GET /health
   */
  static getHealth(_req, res) {
    const health = HealthService.getServerHealth();
    return sendSuccess(res, health, 200);
  }

  /**
   * GET /health/db
   */
  static async getDatabaseHealth(_req, res) {
    const dbHealth = await HealthService.getDatabaseHealth();

    if (dbHealth.healthy) {
      const { healthy, ...data } = dbHealth;
      return sendSuccess(res, data, 200);
    }

    return sendError(
      res,
      {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection is not available',
        details: dbHealth,
      },
      503
    );
  }
}

module.exports = HealthController;
