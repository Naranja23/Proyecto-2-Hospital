const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Medico = sequelize.define('Medico', {
    Num_Medico: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
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
    tableName: 'Medico',
    timestamps: false
})

module.exports = { Medico }