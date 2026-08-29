const { NotificationLog } = require('../models');
const socketService = require('./socketService');

class NotificationService {
  async notifyUser(userId, message, type) {
    // 1. Log to DB
    const log = await NotificationLog.create({
      user_id: userId,
      message,
      type
    });

    // 2. Emit real-time if connected
    try {
      const io = socketService.getIO();
      // Emit to the user's specific room
      io.to(`user_${userId}`).emit('notification', log);
    } catch (err) {
      console.error('Socket not initialized, pushing to DB only');
    }

    return log;
  }
}

module.exports = new NotificationService();
