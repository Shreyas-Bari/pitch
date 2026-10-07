const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --------------- Middleware ---------------

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------- Routes ---------------

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'PITCH API is running',
    timestamp: new Date().toISOString(),
  });
});

// TODO: Mount feature routes here
// app.use('/api/auth', require('./src/routes/authRoutes'));

// --------------- Error Handling ---------------

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Central error middleware (placeholder)
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// --------------- Start Server ---------------

app.listen(PORT, () => {
  console.log(`[PITCH] Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
