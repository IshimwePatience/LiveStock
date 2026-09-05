const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Case = sequelize.define('Case', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  type: { 
    type: DataTypes.STRING, 
    allowNull: false,
    defaultValue: 'VEHICLE_CLAIM'
  },
  reporter_id: { type: DataTypes.UUID, allowNull: false },
  trip_id: { type: DataTypes.UUID, allowNull: true },
  vehicle_plate: { type: DataTypes.STRING, allowNull: true },
  location: { type: DataTypes.STRING, allowNull: true },
  status: { 
    type: DataTypes.STRING, 
    defaultValue: 'OPEN' 
  },
  details: { type: DataTypes.TEXT, allowNull: true },
});

module.exports = Case;
