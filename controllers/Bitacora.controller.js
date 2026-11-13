const { Bitacora } = require('../models/Bitacora.Model.js')

async function registrar(proceso, dni) {
  console.log(`[BITACORA] ${new Date().toISOString()} | usuario ${dni ?? '-'} | ${proceso}`)
  try {
    if (Bitacora) {
      const now = new Date()
      await Bitacora.create({
        Anio: now.getFullYear(),
        Dia: now.getDate(),
        Hora: now.getHours(),
        Min: now.getMinutes(),
        Seg: now.getSeconds(),
        Ms: now.getMilliseconds(),
        Proceso: String(proceso || 'Operación'),
        Explicacion: String(proceso || ''),
        Usuario: dni != null ? String(dni) : 'Anónimo',
        DVH: null
      })
    }
  } catch (err) {
    console.warn('[BITACORA] No se pudo guardar en base de datos:', err.message)
  }
}

module.exports = { registrar }
