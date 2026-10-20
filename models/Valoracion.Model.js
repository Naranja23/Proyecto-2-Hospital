const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Valoracion = sequelize.define('Valoracion', {
  IDValoracion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  Calificacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  Comentario: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  FechaValoracion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  DVH: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Valoracion',
  timestamps: false
})

module.exports = { Valoracion }
