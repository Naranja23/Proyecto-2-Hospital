const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { sequelize } = require('../config/db.js')
const { DVV } = require('../models/index.model.js')

const hash = (txt) => crypto.createHash('sha256').update(txt).digest('hex')

// DVH: hash de todos los campos de la fila, menos el propio DVH
function calcularDVH(fila) {
  const { DVH, ...datos } = fila
  const texto = Object.keys(datos).sort().map(k => `${k}=${JSON.stringify(datos[k])}`).join('|')
  return hash(texto)
}

// DVV: hash de los DVH de toda la tabla (suma total de todos los DVH)
const calcularDVV = (dvhs) => hash(dvhs.join(''))

// Trae todas las filas de una tabla ordenadas por clave primaria(lo usa par acalculos)
function leerTabla(tabla) {
  const M = sequelize.models[tabla]
  return M.findAll({ order: [[M.primaryKeyAttribute, 'ASC']] })
}

// Recalcula DVH de cada fila y el DVV de la tabla (se llama después de escribir en la BD)
async function calcularDV(tabla) {
  const filas = await leerTabla(tabla)
  const dvhs = []
  for (const f of filas) {
    const dvh = calcularDVH(f.get({ plain: true }))
    if (f.DVH !== dvh) await f.update({ DVH: dvh })
    dvhs.push(dvh)
  }
  const totalDVV = calcularDVV(dvhs)
  if (DVV) {
    const existente = await DVV.findOne({ where: { Tabla: tabla } })
    if (existente) {
      await existente.update({ CalculoDVV: totalDVV, FechaActualizacion: new Date() })
    } else {
      await DVV.create({ Tabla: tabla, CalculoDVV: totalDVV, FechaActualizacion: new Date() })
    }
  }
}

// Middleware: valida la autenticación únicamente con el token JWT y su expiración
async function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '')
    const p = jwt.verify(token, process.env.JWT_SECRET || 'secreto_hospital')
    req.usuario = p // { DNIUsuario, Email }
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' })
  }
}

module.exports = { calcularDVH, calcularDVV, leerTabla, calcularDV, auth }