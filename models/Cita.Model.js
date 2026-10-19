const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Cita = sequelize.define('Cita', {
    IDCita: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    NombreVisita: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Parentesco: {
        type: DataTypes.STRING,
        allowNull: false
    },
    FechaVisita: {
        type: DataTypes.DATE,
        allowNull: false
    },
    DVV: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
{
    tableName: 'Cita',
    timestamps: false
})

module.exports = { Cita }