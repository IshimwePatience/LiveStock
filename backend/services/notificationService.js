const { NotificationLog, User } = require('../models');
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

  async notifyRoles(roles, message, type) {
    try {
      const users = await User.findAll({ where: { role: roles } });
      const logs = [];
      for (const user of users) {
        const log = await this.notifyUser(user.id, message, type);
        logs.push(log);
      }
      return logs;
    } catch (err) {
      console.error('Failed to notify roles:', err.message);
      return [];
    }
  }
}

module.exports = new NotificationService();
