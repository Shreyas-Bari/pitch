const mongoose = require('mongoose');
const { env } = require('./env');

const STATE_MAP = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

// Configure lifecycle event listeners once
let listenersConfigured = false;
function configureLifecycleListeners() {
  if (listenersConfigured) return;
  listenersConfigured = true;

  mongoose.connection.on('disconnected', () => {
    if (env.NODE_ENV !== 'test') {
      console.warn('[PITCH] MongoDB disconnected.');
    }
  });

  mongoose.connection.on('reconnected', () => {
    if (env.NODE_ENV !== 'test') {
      console.log('[PITCH] MongoDB reconnected.');
    }
  });

  mongoose.connection.on('error', (err) => {
    console.error('[PITCH] MongoDB connection event error:', err.message);
  });
}

/**
 * Connect to MongoDB Atlas / local instance.
 * Preserves database connection lifecycle.
 */
async function connectDB() {
  configureLifecycleListeners();

  // If already connected, return existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    if (env.NODE_ENV !== 'test') {
      console.log('[PITCH] MongoDB connected:', conn.connection.host);
    }
    return conn.connection;
  } catch (error) {
    console.error('[PITCH] MongoDB connection error:', error.message);
    throw error;
  }
}

/**
 * Disconnect from MongoDB cleanly (for graceful shutdown and test isolation).
 */
async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    if (env.NODE_ENV !== 'test') {
      console.log('[PITCH] MongoDB disconnected gracefully.');
    }
  }
}

/**
 * Get current database connection status metadata.
 */
function getConnectionStatus() {
  const readyState = mongoose.connection.readyState;
  return {
    state: readyState,
    stateName: STATE_MAP[readyState] || 'unknown',
    isConnected: readyState === 1,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
}

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.disconnectDB = disconnectDB;
module.exports.getConnectionStatus = getConnectionStatus;
