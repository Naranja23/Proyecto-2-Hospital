const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const Plan = sequelize.define('Plan', {
    IDPlan: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true
    },
    NombrePlan: {
        type: DataTypes.STRING,
        allowNull: false
    },
    TipoPlan: {
        type: DataTypes.STRING,
        allowNull: false
    },
    EstadoPlan: {
        type: DataTypes.STRING,
        allowNull: false
    },
    IDPrepaga: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    IDHospital: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    DVV: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
{
    tableName: 'Plan',
    timestamps: false
})

module.exports = { Plan }