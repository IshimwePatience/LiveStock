const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const VetRecord = sequelize.define('VetRecord', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  
  // Existing fields (make optional to support both flows)
  animal_tag: { type: DataTypes.STRING, allowNull: false },
  trip_id: { type: DataTypes.UUID, allowNull: true },
  type: { type: DataTypes.STRING, allowNull: true, defaultValue: 'VACCINATION' },
  
  // Who recorded it
  saro_id: { type: DataTypes.UUID, allowNull: false },
  
  // Home Info
  owner_name: { type: DataTypes.STRING, allowNull: true },
  owner_phone: { type: DataTypes.STRING, allowNull: true },
  owner_nid: { type: DataTypes.STRING, allowNull: true },
  district: { type: DataTypes.STRING, allowNull: true },
  sector: { type: DataTypes.STRING, allowNull: true },
  cell: { type: DataTypes.STRING, allowNull: true },
  village: { type: DataTypes.STRING, allowNull: true },
  
  // Animal details
  animal_type: { type: DataTypes.STRING, allowNull: true },
  
  // Medical details
  antibiotics: { type: DataTypes.STRING, allowNull: true },
  vaccines: { type: DataTypes.STRING, allowNull: true },
  dose_given: { type: DataTypes.INTEGER, allowNull: true },
  damaged_dose: { type: DataTypes.INTEGER, allowNull: true },
  date_given: { type: DataTypes.DATEONLY, allowNull: true },
  withdrawal_period_end: { type: DataTypes.DATEONLY, allowNull: true },
});

module.exports = VetRecord;
