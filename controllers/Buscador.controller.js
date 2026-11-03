const { Op } = require('sequelize')
const { Hospital, Medico, Prepaga, Plan } = require('../models')

// Llena los desplegables del frontend
async function opciones(req, res) {
  try {
    // Las 3 consultas se lanzan a la vez
    const [esp, pre, planes] = await Promise.all([
      // Especialidades sin repetir
      Medico.findAll({
        attributes: ['EspecialidadM'],
        group: ['EspecialidadM'],
        raw: true
      }),
      // Prepagas sin repetir
      Prepaga.findAll({
        attributes: ['NombreComercial'],
        group: ['NombreComercial'],
        raw: true
      }),
      // Planes sin repetir, cada uno con su prepaga
      Plan.findAll({
        attributes: ['NombrePlan'],
        include: [{ model: Prepaga, attributes: ['NombreComercial'] }],
        group: ['NombrePlan', 'Prepaga.NombreComercial'],
        raw: true
      })
    ])

    res.json({
      especialidades: esp.map(e => e.EspecialidadM).sort(),
      prepagas: pre.map(p => p.NombreComercial).sort(),
      // Solo renombra la clave fea 'Prepaga.NombreComercial'
      planes: planes.map(p => ({
        nombre: p.NombrePlan,
        prepaga: p['Prepaga.NombreComercial']
      }))
    })
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: err.message })
  }
}

// Devuelve los hospitales que cumplen los filtros elegidos
async function buscar(req, res) {
  try {
    // Filtros que llegan por la URL (los no elegidos vienen vacíos)
    const { nombre, especialidad, prepaga, plan } = req.query

    // Nota de condiciones sobre la tabla Hospital
    const condicion = { EstadoH: 'Activo' }
    if (nombre) condicion.NombreH = { [Op.iLike]: `%${nombre}%` }

    // Nota de tablas a unir (solo las de los filtros elegidos)
    const tablarelacion = []
    if (especialidad)
      tablarelacion.push({ model: Medico, where: { EspecialidadM: especialidad }, attributes: [], required: true })
    if (prepaga)
      tablarelacion.push({ model: Prepaga, where: { NombreComercial: prepaga }, attributes: [], required: true })
    if (plan)
      tablarelacion.push({ model: Plan, where: { NombrePlan: plan }, attributes: [], required: true })

    // Acá recién se consulta la base
    const hospitales = await Hospital.findAll({ where: condicion, include:  tablarelacion})
    res.json(hospitales)
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: err.message })
  }
}

module.exports = { opciones, buscar }
