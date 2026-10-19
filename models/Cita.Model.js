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
<<<<<<< HEAD
    DVH: { 
        type: DataTypes.STRING 
=======
    FechaVisita: {
        type: DataTypes.DATE,
        allowNull: false
    },
    DVH: {
        type: DataTypes.STRING,
        allowNull: true
>>>>>>> 1a22381 (feat: add authentication state, navigation handling, and DVV fields to models)
    }
}, { tableName: 'Cita', timestamps: false })

module.exports = { Cita }