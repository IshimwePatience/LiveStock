const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MovementRequest = sequelize.define('MovementRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  type: { 
    type: DataTypes.ENUM('DISTRICT_TO_DISTRICT', 'SECTOR_TO_SECTOR'), 
    allowNull: false 
  },
  initiator_id: { type: DataTypes.UUID, allowNull: false },
  approver_id: { type: DataTypes.UUID, allowNull: true },
  origin_id: { type: DataTypes.UUID, allowNull: false }, // Could be Sector ID or District ID based on type
  destination_id: { type: DataTypes.UUID, allowNull: false },
  status: { 
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED'), 
    defaultValue: 'PENDING' 
  },
  animal_type: { type: DataTypes.STRING, allowNull: false },
  count: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.STRING, allowNull: true },
});

module.exports = MovementRequest;
