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
<<<<<<< HEAD
        allowNull: false
    },
    DVH: {
        type: DataTypes.STRING
=======
        allowNull: false,
        defaultValue: '123456'
    },
    DVH: {
        type: DataTypes.STRING,
        allowNull: true
>>>>>>> 1a22381 (feat: add authentication state, navigation handling, and DVV fields to models)
    }
},
{
    tableName: 'Usuario',
    timestamps: false
})

module.exports = { Usuario }