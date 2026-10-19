const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Hospital = sequelize.define('Hospital', {
    IDHospital: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    NombreH: {
        type: DataTypes.STRING,
        allowNull: false
    },
    DireccionH: {
        type: DataTypes.STRING,
        allowNull: false
    },
    SitioWeb: {
        type: DataTypes.STRING,
        allowNull: true
    },
    EstadoH: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Activo'
    },
    DVV: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
{
    tableName: 'Hospital',
    timestamps: false
})

module.exports = { Hospital }