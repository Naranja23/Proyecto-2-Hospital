const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Rol = sequelize.define('Rol', {
    IDRol: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    DescripcionR: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ActivoR: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
},
{
    tableName: 'Rol',
    timestamps: false
})

module.exports = { Rol }