const mongoose = require('mongoose');
const { env } = require('../config/env');
const { getConnectionStatus } = require('../config/db');

/**
 * Health Service
 * Provides health checks for the Express application server and MongoDB database.
 */
class HealthService {
  /**
   * Basic server health status
   */
  static getServerHealth() {
    return {
      status: 'ok',
      message: 'PITCH API is running',
      environment: env.NODE_ENV,
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Database connectivity health status
   */
  static async getDatabaseHealth() {
    const connStatus = getConnectionStatus();

    if (!connStatus.isConnected) {
      return {
        healthy: false,
        status: 'error',
        database: connStatus.stateName,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Ping the MongoDB database to verify round-trip responsiveness
      await mongoose.connection.db.admin().ping();
      return {
        healthy: true,
        status: 'ok',
        database: connStatus.stateName,
        host: connStatus.host,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        healthy: false,
        status: 'error',
        database: 'unresponsive',
        error: err.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = HealthService;
