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
  driver_name: { type: DataTypes.STRING, allowNull: true },
  driver_phone: { type: DataTypes.STRING, allowNull: true },
  driver_national_id: { type: DataTypes.STRING, allowNull: true },
  plate_number: { type: DataTypes.STRING, allowNull: true },
  driver_token: { type: DataTypes.STRING, allowNull: true, unique: true },
  imei_number: { type: DataTypes.STRING, allowNull: true },
  otp: { type: DataTypes.STRING, allowNull: true },
});

module.exports = Trip;
