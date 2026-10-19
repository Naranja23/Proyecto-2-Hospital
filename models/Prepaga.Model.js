const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Prepaga = sequelize.define('Prepaga', {
    IDPrepaga: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    NombreComercial: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Cuit: {
        type: DataTypes.STRING,
        allowNull: false
    },
    EmailFacturacion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    IDHospital: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    IDPlanes: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    DVH: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
{
    tableName: 'Prepaga',
    timestamps: false
})

module.exports = { Prepaga }