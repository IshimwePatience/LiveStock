const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Geofence = sequelize.define('Geofence', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rule_type: {
    type: DataTypes.ENUM('ALLOWED', 'FORBIDDEN'),
    defaultValue: 'ALLOWED'
  },
  zone_type: {
    type: DataTypes.ENUM('DISTRICT', 'SECTOR', 'CUSTOM_POLYGON'),
    defaultValue: 'DISTRICT'
  },
  district_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sector_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  geometry: {
    type: DataTypes.JSON,
    allowNull: true
  },
  vehicle_plate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Geofence;
