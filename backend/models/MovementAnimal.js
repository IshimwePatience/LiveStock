const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MovementAnimal = sequelize.define('MovementAnimal', {
  id: { 
    type: DataTypes.UUID, 
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true 
  },
  movement_request_id: { 
    type: DataTypes.UUID, 
    allowNull: false 
  },
  tag_number: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  sex: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  quantity: { 
    type: DataTypes.INTEGER, 
    defaultValue: 1 
  },
  breed: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  color: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  description: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
});

module.exports = MovementAnimal;
