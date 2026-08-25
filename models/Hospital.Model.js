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
    DireccionH: {
        type: DataTypes.STRING,
        allowNull: false
    },
    NombreH: {
        type: DataTypes.STRING,
        allowNull: false
    },
    SitioWeb: {
        type: DataTypes.STRING,
        allowNull: false
    }
},
{
    tableName: 'Hospital',
    timestamps: false
})

module.exports = { Hospital }