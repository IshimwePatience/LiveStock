const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const District = sequelize.define('District', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  polygon: { type: DataTypes.TEXT, allowNull: true }, // Stored as JSON string for now
});

module.exports = District;
