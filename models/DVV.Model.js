const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const DVV = sequelize.define('DVV', {
    IDDVV: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    Tabla: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    CalculoDVV: {
        type: DataTypes.STRING,
        allowNull: false
    },
    FechaActualizacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'DVV',
    timestamps: false
})

module.exports = { DVV }
