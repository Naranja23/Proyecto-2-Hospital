const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Permisos = sequelize.define('Permisos', {
    IDPermisos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    DescripcionP: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ActivoP: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    DVH: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
{
    tableName: 'Permisos',
    timestamps: false
})

module.exports = { Permisos }