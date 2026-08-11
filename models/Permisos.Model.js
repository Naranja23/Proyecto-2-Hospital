const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Permisos = sequelize.define('Permisos', {
    Nombre_Permiso: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true 
    },
    Descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Activop: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
},
{
    tableName: 'Permisos',
    timestamps: false
})

module.exports = { Permisos }