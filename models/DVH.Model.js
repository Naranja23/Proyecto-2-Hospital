const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const DVH = sequelize.define('DVH', {
    NombreTabla: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    DVH: {
        type: DataTypes.STRING,
        allowNull: false
    },
    FechaActualizacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'DVH',
    timestamps: false
})

module.exports = { DVH }
