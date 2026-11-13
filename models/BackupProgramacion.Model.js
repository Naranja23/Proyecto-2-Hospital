const { sequelize } = require('../config/db.js')
const { DataTypes } = require('sequelize')

const BackupProgramacion = sequelize.define('BackupProgramacion', {
  IDBackupProgramacion: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Frecuencia: {
    type: DataTypes.ENUM('diaria', 'semanal', 'mensual'),
    allowNull: false
  },
  Hora: {
    type: DataTypes.STRING(5),
    allowNull: false
  },
  DiaSemana: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  DiaMes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Destino: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  Activa: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  UltimaEjecucion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  UltimoResultado: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  UltimoMensaje: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'BackupProgramacion',
  timestamps: false
})

module.exports = { BackupProgramacion }