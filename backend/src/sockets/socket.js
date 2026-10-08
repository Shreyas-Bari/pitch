const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models');
const { env } = require('../config/env');
const { registerChatHandlers } = require('./chatSocket');
const { registerNotificationHandlers } = require('./notificationSocket');
const messageService = require('../services/messageService');
const notificationService = require('../services/notificationService');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Provide IO instance to services for push notifications & messages
  messageService.setSocketIo(io);
  notificationService.setSocketIo(io);

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
      }

      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';');
        for (const cookie of cookies) {
          const [name, val] = cookie.trim().split('=');
          if (name === 'accessToken') {
            token = val;
            break;
          }
        }
      }

      if (token) {
        try {
          const decoded = verifyAccessToken(token);
          const user = await User.findById(decoded.userId);
          if (user && user.isActive) {
            socket.user = user;
          }
        } catch (_) {
          // Token verification failed; proceed as guest
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on('connection', (socket) => {
    registerChatHandlers(io, socket);
    registerNotificationHandlers(io, socket);

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = {
  initSocket,
  getIO,
};
