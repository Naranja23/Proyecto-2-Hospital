const { sequelize } = require('../config/db.js')
const { leerTabla, calcularDVH, calcularDVV, calcularDV } = require('./Dvv y Dvh.js')
const bitacora = require('./Bitacora.controller.js')

// solo se verifican las tablas que tienen columna DVH
const tablasConDV = () =>
  Object.keys(sequelize.models).filter(n => sequelize.models[n].rawAttributes.DVH)

async function verificar(DNIUsuario = null) {
  await sequelize.authenticate()                                   // ConectarBaseDatos()
  const errores = []
  for (const tabla of tablasConDV()) {                             // loop tablas
    const filas = await leerTabla(tabla)
    const dvhs = []
    for (const f of filas) {                                       // loop tuplas
      if (f.DVH !== calcularDVH(f.get({ plain: true }), tabla))
        errores.push({ tabla, tipo: 'DVH', fila: f.get(f.constructor.primaryKeyAttribute) })
      dvhs.push(f.DVH ?? '')
    }
    const { DVV } = sequelize.models
    const reg = await DVV.findOne({ where: { Tabla: tabla } })
    const guardado = reg?.CalculoDVV
    if ((guardado ?? calcularDVV([])) !== calcularDVV(dvhs)) errores.push({ tabla, tipo: 'DVV' })
  }
  const resultado = { ok: errores.length === 0, errores }
  await bitacora.registrar(`Verificar integridad BD: ${resultado.ok ? 'OK' : errores.length + ' error(es)'}`, DNIUsuario)
  return resultado
}

// Extensión del CU (Rectificar integridad). OJO: "acepta" los datos actuales como correctos;
// lo ideal es restaurar desde un backup.
async function rectificar(errores, DNIUsuario = null) {
  for (const tabla of new Set(errores.map(e => e.tabla))) await calcularDV(tabla)
  await bitacora.registrar('Rectificar integridad BD', DNIUsuario)
  return verificar(DNIUsuario)
}

// CU013 - Verificar integridad BD
const verificarIntegridad = async (req, res) => {
  try {
    const r = await verificar(req.usuario?.DNIUsuario)
    res.status(r.ok ? 200 : 409).json(r)
  } catch (e) {
    await bitacora.registrar('Error al verificar integridad BD', req.usuario?.DNIUsuario)
    res.status(500).json({ message: 'No fue posible completar la verificación', reintentar: true })
  }
}
const rectificarIntegridad = async (req, res) => {
  try {
    const previo = await verificar(req.usuario?.DNIUsuario)
    if (previo.ok) return res.status(200).json(previo)
    res.status(200).json(await rectificar(previo.errores, req.usuario?.DNIUsuario))
  } catch (e) { res.status(500).json({ message: 'No fue posible rectificar la integridad' }) }
}

module.exports = { verificar, verificarIntegridad, rectificarIntegridad }