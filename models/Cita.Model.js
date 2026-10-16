const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Cita = sequelize.define('Cita', {
    IDCita: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    FechaVisita: { 
        type: DataTypes.DATE, 
        allowNull: false 
    },
    Estado: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        defaultValue: 'Reservado' 
    },
    DVH: { 
        type: DataTypes.STRING 
    }
}, { tableName: 'Cita', timestamps: false })

module.exports = { Cita }