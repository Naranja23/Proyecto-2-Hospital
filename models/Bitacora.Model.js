const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Bitacora = sequelize.define('Bitacora', {
    IDBitacora: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    Anio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Dia: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Hora: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Min: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Seg: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Ms: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Proceso: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Explicacion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    Usuario: {
        type: DataTypes.STRING,
        allowNull: true
    },
    DVV: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'Bitacora',
    timestamps: false,
    hooks: {
        beforeValidate: (bitacora) => {
            const now = new Date()
            if (bitacora.Anio === undefined || bitacora.Anio === null) bitacora.Anio = now.getFullYear()
            if (bitacora.Dia === undefined || bitacora.Dia === null) bitacora.Dia = now.getDate()
            if (bitacora.Hora === undefined || bitacora.Hora === null) bitacora.Hora = now.getHours()
            if (bitacora.Min === undefined || bitacora.Min === null) bitacora.Min = now.getMinutes()
            if (bitacora.Seg === undefined || bitacora.Seg === null) bitacora.Seg = now.getSeconds()
            if (bitacora.Ms === undefined || bitacora.Ms === null) bitacora.Ms = now.getMilliseconds()
        }
    }
})

module.exports = { Bitacora }
