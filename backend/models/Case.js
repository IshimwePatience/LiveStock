const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Case = sequelize.define('Case', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  type: { 
    type: DataTypes.ENUM('THEFT', 'ROBBERY'), 
    allowNull: false 
  },
  reporter_id: { type: DataTypes.UUID, allowNull: false },
  trip_id: { type: DataTypes.UUID, allowNull: true },
  status: { 
    type: DataTypes.ENUM('OPEN', 'RESOLVED', 'CLOSED'), 
    defaultValue: 'OPEN' 
  },
  details: { type: DataTypes.TEXT, allowNull: true },
});

module.exports = Case;
