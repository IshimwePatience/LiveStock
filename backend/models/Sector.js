const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Sector = sequelize.define('Sector', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  district_id: { type: DataTypes.UUID, allowNull: false },
  polygon: { type: DataTypes.TEXT, allowNull: true },
});

module.exports = Sector;
