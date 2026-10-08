const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Config
const { env } = require('./config/env');

// Middleware
const loggerMiddleware = require('./middleware/loggerMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

// Central Router
const apiRouter = require('./routes');

// --------------- Initialize Express Application ---------------

const app = express();

// --------------- Global Middleware ---------------

// CORS
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie Parsing
app.use(cookieParser());

// Request Logging
app.use(loggerMiddleware);

// --------------- Mount Routes ---------------

app.use(apiRouter);

// --------------- Error Handling ---------------

// 404 Handler for unmatched routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
