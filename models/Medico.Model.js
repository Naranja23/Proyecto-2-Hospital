const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Medico = sequelize.define('Medico', {
    IDMedico: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true
    },
    NomApeM: {
        type: DataTypes.STRING,
        allowNull: false
    },
    NombM: {
        type: DataTypes.STRING,
        allowNull: true
    },
    EspecialidadM: {
        type: DataTypes.STRING,
        allowNull: false
    },
    EdadM: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    EstadoM: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Activo'
    },
    DVH: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
{
    tableName: 'Medico',
    timestamps: false
})

module.exports = { Medico }
