const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Hospital = sequelize.define('Hospital', {
    Nombre_Hospital: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Ubicacion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Num_Hospital: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    }
},
{
    tableName: 'Hospital',
    timestamps: false
})

module.exports = { Hospital }