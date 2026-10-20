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
    Calificada: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
       Calificacion: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    Comentario: {
        type: DataTypes.STRING,
        allowNull: true
    },
    DVH: { 
        type: DataTypes.STRING,
        allowNull: true
    },

}, { 
    tableName: 'Cita', 
    timestamps: false 
})

module.exports = { Cita }