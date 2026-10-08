/**
 * Notification Socket Handler
 * Sources: docs/PITCH_FINAL_BUILD_SPEC.md Section 40, 41
 */

function registerNotificationHandlers(io, socket) {
  if (socket.user && socket.user._id) {
    const userId = String(socket.user._id);
    socket.join(`user:${userId}`);
    socket.join(`user_${userId}`);
  }
}

module.exports = { registerNotificationHandlers };
