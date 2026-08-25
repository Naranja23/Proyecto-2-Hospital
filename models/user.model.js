const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const User = sequelize.define('User', {
    Nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Apellido: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dni: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
        Email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
        Password: {
        type: DataTypes.STRING,
        allowNull: false,
    }
},
{
    tableName: 'user',
    timestamps: false
})

module.exports = { User }