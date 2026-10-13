const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Usuario = sequelize.define('Usuario', {
    DNIUsuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true
    },
    NomApeU: {
        type: DataTypes.STRING,
        allowNull: false
    },
    EstadoU: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Activo'
    },
    EdadU: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    Email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    Password: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '123456'
    }
},
{
    tableName: 'Usuario',
    timestamps: false
})

module.exports = { Usuario }