const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role: { 
    type: DataTypes.ENUM('RAB', 'DARO', 'SARO', 'POLICE'), 
    allowNull: false 
  },
  district_id: { type: DataTypes.STRING, allowNull: true },
  sector_id: { type: DataTypes.STRING, allowNull: true },
  reset_token: { type: DataTypes.STRING, allowNull: true },
  reset_token_expires: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  permissions: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
});

module.exports = User;
