const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Turno = sequelize.define('Turno', {
    IDTurno: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    IDHospital: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    IDMedico: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    FechaT: {
        type: DataTypes.DATE,
        allowNull: false
    },
    EstadoT: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Pendiente'
    },
    DVH: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
{
    tableName: 'Turno',
    timestamps: false
})

module.exports = { Turno }
