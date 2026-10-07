const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas using Mongoose.
 * Reads the connection URI from process.env.MONGODB_URI.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[PITCH Database] ⚠️  MONGODB_URI is not set in environment variables.');
    console.warn('[PITCH Database] Please add your MongoDB Atlas connection string to backend/.env');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[PITCH Database] 🚀 MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[PITCH Database] ❌ MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('[PITCH Database] Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error(`[PITCH Database] Mongoose connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('[PITCH Database] Mongoose disconnected from DB');
});

// Graceful application shutdown
const gracefulExit = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('[PITCH Database] Mongoose connection closed through app termination');
  }
};

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);

module.exports = connectDB;
