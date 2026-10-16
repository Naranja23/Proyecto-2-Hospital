const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const DigitoVerificador = sequelize.define('DigitoVerificador', {
    Tabla: { 
        type: DataTypes.STRING, 
        primaryKey: true 
    },
    DVV: { 
        type: DataTypes.STRING, 
        allowNull: false 
    }
}, { tableName: 'DigitoVerificador', timestamps: false })

module.exports = { DigitoVerificador }