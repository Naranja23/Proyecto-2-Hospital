const { sequelize } = require('../config/db.js')
const { DataTypes } = require("sequelize")

const Prepaga = sequelize.define('Prepaga', {
    Id_prepaga: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Nombre: {
        type:DataTypes.STRING
    },
    maxUsuarios:{
        type:DataTypes.INTEGER,
    },
    Precio:{
        type:DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'Prepaga',
    timestamps: false
})

module.exports = { Prepaga }