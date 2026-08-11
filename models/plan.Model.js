const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Plan = sequelize.define('Plan', {
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
    }
},
{
    tableName: 'Plan',
    timestamps: false
})

module.exports = { Plan }