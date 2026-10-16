const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Sesion = sequelize.define('Sesion', {
    IDSesion: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    DNIUsuario: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    Inicio: { 
        type: DataTypes.DATE, 
        allowNull: false 
    },
    Fin: { 
        type: DataTypes.DATE, 
        allowNull: true 
    },
    DVH: { 
        type: DataTypes.STRING 
    }
}, { tableName: 'Sesion', timestamps: false })

module.exports = { Sesion }