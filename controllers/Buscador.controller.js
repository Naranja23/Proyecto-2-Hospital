const { Op } = require('sequelize')
const { Hospital, Medico, Prepaga, Plan } = require('../models')
//caso de uso n1

async function opciones(req, res) {
  try {
    const [esp, pre, planes] = await Promise.all([
      Medico.findAll({ attributes: ['EspecialidadM'], group: ['EspecialidadM'], raw: true }),
      Prepaga.findAll({ attributes: ['NombreComercial'], group: ['NombreComercial'], raw: true }),
      Plan.findAll({
        attributes: ['NombrePlan'],
        include: [{ model: Prepaga, attributes: ['NombreComercial'] }],
        raw: true
      })
    ])
  

    // planes sin repetir, cada uno con su prepaga
    const vistos = new Set()
    const planesUnicos = planes.map(p => ({ nombre: p.NombrePlan, prepaga: p['Prepaga.NombreComercial'] }))
      .filter(p => {
        const k = p.prepaga + '|' + p.nombre
        if (vistos.has(k)) return false
        vistos.add(k)
        return true
      })

    res.json({
      especialidades: esp.map(e => e.EspecialidadM).sort(),
      prepagas: pre.map(p => p.NombreComercial).sort(),
      planes: planesUnicos
    })
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: err.message })
  }
}

// Búsqueda: todos los filtros son opcionales y se combinan
async function buscar(req, res) {
  try {
    const { nombre, especialidad, prepaga, plan } = req.query

    const where = { EstadoH: 'Activo' }
    if (nombre) where.NombreH = { [Op.like]: `%${nombre}%` }

    const include = []
    if (especialidad)
      include.push({ model: Medico, where: { EspecialidadM: especialidad }, attributes: [], required: true })
    if (prepaga)
      include.push({ model: Prepaga, where: { NombreComercial: prepaga }, attributes: [], required: true })
    if (plan)
      include.push({ model: Plan, where: { NombrePlan: plan }, attributes: [], required: true })

    const hospitales = await Hospital.findAll({ where, include })
    res.json(hospitales)
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: err.message })
  }
}

module.exports = { opciones, buscar }