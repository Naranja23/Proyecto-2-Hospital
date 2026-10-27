// MODELO: relación entre hospitales y obras sociales (tabla intermedia).

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.js');

// Tabla intermedia: qué hospitales integran la cartilla de cada obra social (Prepaga)
const Cartilla = sequelize.define(
  'Cartilla',
  {
    hospitalId: { type: DataTypes.INTEGER, primaryKey: true },
    prepagaId: { type: DataTypes.INTEGER, primaryKey: true },
  },
  { tableName: 'cartilla', timestamps: false }
);

module.exports = Cartilla;
