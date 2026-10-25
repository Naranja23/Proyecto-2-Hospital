const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Especialidad = sequelize.define('Especialidad', {
  IDEspecialidad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  NombreEspecialidad: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'Especialidad',
  timestamps: false
})

module.exports = { Especialidad }