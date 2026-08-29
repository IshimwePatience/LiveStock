const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Trip = sequelize.define('Trip', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  request_id: { type: DataTypes.UUID, allowNull: false },
  status: { 
    type: DataTypes.ENUM('ACTIVE', 'ARRIVED', 'CONFIRMED'), 
    defaultValue: 'ACTIVE' 
  },
  current_lat: { type: DataTypes.FLOAT, allowNull: true },
  current_lng: { type: DataTypes.FLOAT, allowNull: true },
});

module.exports = Trip;
