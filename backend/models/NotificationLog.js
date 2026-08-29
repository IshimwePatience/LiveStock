const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const NotificationLog = sequelize.define('NotificationLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  message: { type: DataTypes.STRING, allowNull: false },
  type: { 
    type: DataTypes.ENUM('ARRIVAL', 'APPROVAL', 'ALERT', 'SYSTEM'), 
    allowNull: false 
  },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = NotificationLog;
