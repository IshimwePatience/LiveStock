const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const VetRecord = sequelize.define('VetRecord', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  animal_tag: { type: DataTypes.STRING, allowNull: false },
  trip_id: { type: DataTypes.UUID, allowNull: false },
  saro_id: { type: DataTypes.UUID, allowNull: false },
  antibiotics: { type: DataTypes.STRING, allowNull: true },
  vaccines: { type: DataTypes.STRING, allowNull: true },
  withdrawal_period_end: { type: DataTypes.DATE, allowNull: true },
});

module.exports = VetRecord;
