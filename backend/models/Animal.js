const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Animal = sequelize.define('Animal', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tag_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  type: { type: DataTypes.ENUM('COW', 'SHEEP', 'GOAT'), allowNull: false },
  breed: { type: DataTypes.STRING, allowNull: true },
  owner_name: { type: DataTypes.STRING, allowNull: true },
  sector_id: { type: DataTypes.UUID, allowNull: false },
});

module.exports = Animal;
