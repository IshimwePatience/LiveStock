const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const NotificationLog = sequelize.define('NotificationLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { 
    type: DataTypes.TEXT, 
    allowNull: false,
    defaultValue: 'ALERT'
  },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = NotificationLog;
