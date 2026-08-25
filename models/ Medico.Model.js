const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Medico = sequelize.define('Medico', {
    DNIMedico: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true
    },
    NombM: {
        type: DataTypes.STRING,
        allowNull: false
    },
    NomApeM: {
        type: DataTypes.STRING,
        allowNull: false
    },
    EspecialidadM: {
        type: DataTypes.STRING,
        allowNull: false
    },
    EdadM: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
},
{
    tableName: 'Medico',
    timestamps: false
})

module.exports = { Medico }