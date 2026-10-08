const app = require('./src/app');
const { env, validateEnv } = require('./src/config/env');
const { connectDB, disconnectDB } = require('./src/config/db');

let server = null;

/**
 * Start the PITCH HTTP backend server
 */
async function startServer() {
  try {
    // 1. Validate environment variables
    validateEnv();

    // 2. Connect to MongoDB
    await connectDB();

    // 3. Listen on configured PORT
    server = app.listen(env.PORT, () => {
      console.log(
        `[PITCH] Server running on port ${env.PORT} in ${env.NODE_ENV} mode`
      );
      console.log(`[PITCH] Base API path: ${env.API_PREFIX}`);
    });

    return server;
  } catch (error) {
    console.error('[PITCH] Failed to start server:', error.message);
    process.exit(1);
  }
}

/**
 * Stop server and clean up database connections gracefully
 */
async function stopServer() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    console.log('[PITCH] HTTP server closed.');
  }
  await disconnectDB();
}

// Graceful shutdown signals
process.on('SIGTERM', async () => {
  console.log('[PITCH] SIGTERM received. Shutting down gracefully...');
  await stopServer();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[PITCH] SIGINT received. Shutting down gracefully...');
  await stopServer();
  process.exit(0);
});

// Run directly when not required as a module in tests
if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
  stopServer,
};
