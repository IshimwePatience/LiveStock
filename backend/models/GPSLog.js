const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GPSLog = sequelize.define('GPSLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  trip_id: { type: DataTypes.UUID, allowNull: false },
  lat: { type: DataTypes.FLOAT, allowNull: false },
  lng: { type: DataTypes.FLOAT, allowNull: false },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = GPSLog;
