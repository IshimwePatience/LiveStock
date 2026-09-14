const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Feedback = sequelize.define('Feedback', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  user_name: { type: DataTypes.STRING, allowNull: true },
  user_email: { type: DataTypes.STRING, allowNull: true },
  user_role: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: false },
  screenshot_url: { type: DataTypes.TEXT, allowNull: true },
  status: { 
    type: DataTypes.ENUM('OPEN', 'RESOLVED'), 
    defaultValue: 'OPEN' 
  },
  resolved_at: { type: DataTypes.DATE, allowNull: true },
  resolved_by: { type: DataTypes.UUID, allowNull: true }
});

module.exports = Feedback;
