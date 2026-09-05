const { NotificationLog, User } = require('../models');
const { Op } = require('sequelize');
const socketService = require('./socketService');

let notifColsEnsured = false;
async function ensureNotificationColumns() {
  if (notifColsEnsured) return;
  try {
    const { sequelize } = require('../models');
    await sequelize.query('ALTER TABLE "NotificationLogs" ALTER COLUMN message TYPE TEXT;').catch(() => {});
    await sequelize.query('ALTER TABLE "NotificationLogs" ALTER COLUMN type TYPE TEXT USING type::TEXT;').catch(() => {});
    notifColsEnsured = true;
  } catch (err) {
    console.error('Failed to alter NotificationLogs table columns:', err.message);
  }
}

class NotificationService {
  async notifyUser(userId, message, type = 'ALERT') {
    if (!userId) return null;
    await ensureNotificationColumns();
    
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

  async notifyRoles(roles, message, type = 'ALERT') {
    try {
      const rawRoles = Array.isArray(roles) ? roles : [roles];
      const roleSet = new Set();
      for (const r of rawRoles) {
        if (!r || typeof r !== 'string') continue;
        roleSet.add(r.toUpperCase());
        roleSet.add(r.toLowerCase());
        roleSet.add(r.charAt(0).toUpperCase() + r.slice(1).toLowerCase());
      }
      const roleList = Array.from(roleSet);

      const users = await User.findAll({
        where: {
          role: { [Op.in]: roleList }
        }
      });

      console.log(`Notifying ${users.length} users for roles [${roleList.join(', ')}]`);

      const logs = [];
      for (const user of users) {
        const log = await this.notifyUser(user.id, message, type);
        if (log) logs.push(log);
      }
      return logs;
    } catch (err) {
      console.error('Failed to notify roles:', err.message);
      return [];
    }
  }
}

module.exports = new NotificationService();
