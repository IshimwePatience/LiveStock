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
  origin_id: { type: DataTypes.STRING, allowNull: false }, // Could be Sector ID or District ID based on type
  destination_id: { type: DataTypes.STRING, allowNull: false },
  status: { 
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED'), 
    defaultValue: 'PENDING' 
  },
  animal_type: { type: DataTypes.STRING, allowNull: false },
  count: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.STRING, allowNull: true },
  reject_reason: { type: DataTypes.STRING, allowNull: true },

  // Permit Form Specific Fields
  owner_name: { type: DataTypes.STRING, allowNull: true },
  owner_id_number: { type: DataTypes.STRING, allowNull: true },
  owner_phone: { type: DataTypes.STRING, allowNull: true },
  priority: { type: DataTypes.STRING, allowNull: true },
  transport_type: { type: DataTypes.STRING, allowNull: true },
  plate_number: { type: DataTypes.STRING, allowNull: true },
  
  // Origin String Chain
  origin_district: { type: DataTypes.STRING, allowNull: true },
  origin_sector: { type: DataTypes.STRING, allowNull: true },
  origin_cell: { type: DataTypes.STRING, allowNull: true },
  origin_village: { type: DataTypes.STRING, allowNull: true },
  
  // Destination String Chain
  dest_district: { type: DataTypes.STRING, allowNull: true },
  dest_sector: { type: DataTypes.STRING, allowNull: true },
  dest_cell: { type: DataTypes.STRING, allowNull: true },
  dest_village: { type: DataTypes.STRING, allowNull: true },
  
  // Permit Tracking
  permit_number: { type: DataTypes.STRING, allowNull: true, unique: true },
  valid_until: { type: DataTypes.DATE, allowNull: true },

  // Driver Information
  driver_name: { type: DataTypes.STRING, allowNull: true },
  driver_phone: { type: DataTypes.STRING, allowNull: true },
  driver_nid: { type: DataTypes.STRING, allowNull: true },

  // Buyer Information (Person or Company)
  buyer_type: { type: DataTypes.STRING, allowNull: true },
  buyer_name: { type: DataTypes.STRING, allowNull: true },
  buyer_phone: { type: DataTypes.STRING, allowNull: true },
  buyer_id_tin: { type: DataTypes.STRING, allowNull: true },

  // Transporter Mode & Batch Cargo Photo
  transporter_mode: { type: DataTypes.STRING, defaultValue: 'DRIVER_VEHICLE' },
  cargo_photo: { type: DataTypes.TEXT, allowNull: true },
});

module.exports = MovementRequest;
