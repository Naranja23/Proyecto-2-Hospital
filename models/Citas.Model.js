const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const citas = sequelize.define('citas', {
    Id_cita: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true

    },
    Paciente: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Medico: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
        comentario: {
        type: DataTypes.STRING,
        allowNull: false,
    }
},
{
    tableName: 'citas',
    timestamps: false
})

module.exports = { citas }