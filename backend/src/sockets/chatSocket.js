const messageService = require('../services/messageService');

/**
 * Chat Socket Handler
 * Sources: docs/PITCH_FINAL_BUILD_SPEC.md Section 40 & docs/PITCH_API_FINAL.md Section 10
 */

function registerChatHandlers(io, socket) {
  // Join a conversation room (enforces authentication & participant authorization)
  socket.on('conversation:join', async (data, callback) => {
    try {
      const conversationId = typeof data === 'string' ? data : data?.conversationId;
      if (!conversationId) {
        if (typeof callback === 'function') callback({ error: 'Conversation ID required' });
        return;
      }
      if (!socket.user) {
        if (typeof callback === 'function') callback({ error: 'Authentication required', status: 401 });
        return;
      }

      // Authorize participant before joining room
      await messageService.verifyConversationAccess(conversationId, socket.user._id, socket.user.role);

      socket.join(`conversation:${conversationId}`);
      socket.join(`conversation_${conversationId}`);
      if (typeof callback === 'function') callback({ success: true, conversationId });
    } catch (err) {
      if (typeof callback === 'function') callback({ error: err.message, status: err.statusCode || 403 });
    }
  });

  // Leave a conversation room
  socket.on('conversation:leave', (data, callback) => {
    const conversationId = typeof data === 'string' ? data : data?.conversationId;
    if (conversationId) {
      socket.leave(`conversation:${conversationId}`);
      socket.leave(`conversation_${conversationId}`);
      if (typeof callback === 'function') callback({ success: true, conversationId });
    }
  });

  // Realtime typing indicator
  socket.on('typing:start', (data) => {
    const conversationId = data?.conversationId;
    if (conversationId && socket.user) {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId: socket.user._id,
        name: socket.user.name,
      });
      socket.to(`conversation_${conversationId}`).emit('typing:start', {
        conversationId,
        userId: socket.user._id,
        name: socket.user.name,
      });
    }
  });

  socket.on('typing:stop', (data) => {
    const conversationId = data?.conversationId;
    if (conversationId && socket.user) {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId: socket.user._id,
      });
      socket.to(`conversation_${conversationId}`).emit('typing:stop', {
        conversationId,
        userId: socket.user._id,
      });
    }
  });

  // Realtime message sending via socket (persistence before broadcast)
  socket.on('message:send', async (data, callback) => {
    try {
      if (!socket.user) {
        if (typeof callback === 'function') callback({ error: 'Unauthenticated', status: 401 });
        return;
      }
      const message = await messageService.sendMessage({
        conversationId: data.conversationId,
        senderUserId: socket.user._id,
        userRole: socket.user.role,
        data,
      });
      if (typeof callback === 'function') callback({ success: true, message });
    } catch (err) {
      if (typeof callback === 'function') callback({ error: err.message, status: err.statusCode || 400 });
    }
  });

  // Realtime read indicator with persistence-before-broadcast
  socket.on('message:read', async (data, callback) => {
    try {
      const conversationId = data?.conversationId;
      if (conversationId && socket.user) {
        await messageService.markConversationAsRead(conversationId, socket.user._id, socket.user.role);
        socket.to(`conversation:${conversationId}`).emit('message:read', {
          conversationId,
          userId: socket.user._id,
        });
        socket.to(`conversation_${conversationId}`).emit('message:read', {
          conversationId,
          userId: socket.user._id,
        });
        if (typeof callback === 'function') callback({ success: true });
      }
    } catch (err) {
      if (typeof callback === 'function') callback({ error: err.message });
    }
  });
}

module.exports = { registerChatHandlers };
