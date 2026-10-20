const { Op , ConnectionError  } = require('sequelize')
const { sequelize } = require('../config/db.js')
const { Hospital, Medico, Cita } = require('../models/index.model.js')
const seguridad = require('./Seguridad.controller.js')
const bitacora = require('./Bitacora.controller.js')

const aFecha = (fecha, hora) => new Date(`${fecha}T${hora}:00`)
const medicosDe = (especialidad) => Medico.findAll({ where: { EspecialidadM: especialidad }, include: [Hospital] })
const resumen = (m) => ({ DNIMedico: m.DNIMedico, NomApeM: m.NomApeM, IDHospital: m.IDHospital })

// VerificarDatos() del diagrama
function verificarDatos({ fecha, hora, especialidad }) {
  const errores = []
  const inicio = aFecha(fecha, hora)
  if (!fecha || isNaN(inicio) || inicio < new Date()) errores.push('Fecha u hora inválida')
  if (!/^\d{2}:\d{2}$/.test(hora || '')) errores.push('Hora inválida (HH:MM)')
  if (!especialidad || typeof especialidad !== 'string') errores.push('Falta la especialidad')
  return errores
}

// buscarSucursales(): hospitales con algún médico de la especialidad libre a esa hora
async function buscarSucursales(especialidad, inicio) {
  const medicos = await medicosDe(especialidad)
  if (!medicos.length) return []
  const ocupadas = await Cita.findAll({
    where: { FechaVisita: inicio, Estado: 'Reservado', DNIMedico: medicos.map(m => m.DNIMedico) } })
  const ocupados = new Set(ocupadas.map(c => c.DNIMedico))
  const porHospital = new Map()
  for (const m of medicos.filter(m => !ocupados.has(m.DNIMedico))) {
    const h = porHospital.get(m.IDHospital) || { hospital: m.Hospital.get({ plain: true }), medicos: [] }
    h.medicos.push(resumen(m)); porHospital.set(m.IDHospital, h)
  }
  return [...porHospital.values()]
}

// alternativas: próximos horarios libres (9 a 17 hs, hasta 7 días)
async function buscarAlternativas(especialidad, inicio, max = 5) {
  const medicos = await medicosDe(especialidad)
  if (!medicos.length) return []
  const hasta = new Date(inicio.getTime() + 7 * 24 * 3600 * 1000)
  const citas = await Cita.findAll({ where: { Estado: 'Reservado',
    DNIMedico: medicos.map(m => m.DNIMedico), FechaVisita: { [Op.between]: [inicio, hasta] } } })
  const ocupado = new Set(citas.map(c => `${c.DNIMedico}|${new Date(c.FechaVisita).getTime()}`))
  const res = []
  for (let d = 0; d < 7 && res.length < max; d++)
    for (let h = 9; h <= 17 && res.length < max; h++) {
      const slot = new Date(inicio); slot.setDate(slot.getDate() + d); slot.setHours(h, 0, 0, 0)
      if (slot.getTime() === inicio.getTime() || slot < new Date()) continue
      const libres = medicos.filter(m => !ocupado.has(`${m.DNIMedico}|${slot.getTime()}`))
      if (libres.length) res.push({ fecha: slot, medicos: libres.map(resumen) })
    }
  return res
}

// guardarTurno(): vuelve a chequear que siga libre, dentro de una transacción
function guardarTurno({ DNIUsuario, DNIMedico, IDHospital, FechaVisita }) {
  return sequelize.transaction(async (t) => {
    const ocupado = await Cita.findOne({ where: { DNIMedico, FechaVisita, Estado: 'Reservado' }, transaction: t })
    if (ocupado) throw Object.assign(new Error('Turno ocupado'), { codigo: 'TURNO_OCUPADO' })
    return Cita.create({ DNIUsuario, DNIMedico, IDHospital, FechaVisita }, { transaction: t })
  })
}

// CU014 - Sacar turno (paso 1: buscar sucursales / alternativas)
const sacarTurno = async (req, res) => {
  const errores = verificarDatos(req.body)
  if (errores.length) {
    await bitacora.registrar('Error de validación al sacar turno', req.usuario.DNIUsuario)
    return res.status(400).json({ errores })
  }
  try {
    const { fecha, hora, especialidad } = req.body
    const inicio = aFecha(fecha, hora)
    const sucursales = await buscarSucursales(especialidad, inicio)
    if (sucursales.length) return res.status(200).json({ disponible: true, sucursales })
    await bitacora.registrar('Sacar turno: sin disponibilidad', req.usuario.DNIUsuario)
    res.status(200).json({ disponible: false, alternativas: await buscarAlternativas(especialidad, inicio) })
  } catch (e) { res.status(500).json({ message: 'Error al buscar sucursales' }) }
}

// CU014 - Sacar turno (paso 2: reservar)
const reservarTurno = async (req, res) => {
  try {
    const { DNIMedico, IDHospital, fecha, hora } = req.body
    const turno = await guardarTurno({ DNIUsuario: req.usuario.DNIUsuario, DNIMedico, IDHospital, FechaVisita: aFecha(fecha, hora) })
    await seguridad.calcularDV('Cita')
    await bitacora.registrar(`Turno ${turno.IDCita} reservado`, req.usuario.DNIUsuario)
    res.status(201).json({ message: 'Turno reservado exitosamente', turno })
  } catch (e) {
    await bitacora.registrar(`Error al reservar turno: ${e.codigo || e.message}`, req.usuario.DNIUsuario)
    if (e.codigo === 'TURNO_OCUPADO') return res.status(409).json({ message: 'Ese turno ya fue tomado' })
    res.status(500).json({ message: 'No se pudo reservar el turno' })
  }
}


// CU012 - Ver historial de consultas
const verHistorial = async (req, res) => {
  const dni = req.usuario.DNIUsuario
  try {
    // Paso b: consulta a la BD
    const citas = await Cita.findAll({
      where: { DNIUsuario: dni },
      include: [Medico, Hospital],
      order: [['FechaVisita', 'DESC']]
    })
    const historial = citas.map(c => ({
      IDCita: c.IDCita,
      FechaVisita: c.FechaVisita,
      Medico: c.Medico?.NomApeM ?? null,
      Hospital: c.Hospital?.NombreH ?? null,
      Estado: c.Estado,
      Calificada: c.Calificada,
      Calificacion: c.Calificacion,
      Comentario: c.Comentario
    }))
    // Paso d (también en F1, historial vacío): bitácora
    await bitacora.registrar('Consulta de historial (CU012)', dni)
    await seguridad.calcularDV('Bitacora')
    res.status(200).json({ historial })
  } catch (e) {
    console.log(e)
    // F2: caída de BD, no se devuelven datos parciales
    if (e instanceof ConnectionError)
      return res.status(503).json({ message: 'No se puede completar la operación en este momento. Intentá de nuevo más tarde.' })
    res.status(500).json({ message: 'Error al obtener el historial' })
  }
}


// CU010 - Calificar atención recibida
const calificarTurno = async (req, res) => {
  const { IDCita, calificacion, comentario } = req.body
  const dni = req.usuario.DNIUsuario
  const errores = []
  if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5)
    errores.push('Elegí una calificación de 1 a 5 estrellas')
  if (comentario && comentario.length > 255)
    errores.push('El comentario no puede superar los 255 caracteres')
  if (errores.length) return res.status(400).json({ errores })

  try {
    const cita = await Cita.findOne({ where: { IDCita, DNIUsuario: dni } })
    if (!cita) return res.status(404).json({ message: 'No se encontró la consulta' })
    if (cita.Estado !== 'Finalizada')
      return res.status(409).json({ message: 'Solo se pueden calificar consultas finalizadas' })
    if (cita.Calificada)
      return res.status(409).json({ message: 'Esta consulta ya fue calificada' })

    await cita.update({
      Calificacion: calificacion,
      Comentario: comentario?.trim() || null,
      Calificada: true
    })
    await seguridad.calcularDV('Cita')
    res.status(200).json({ message: 'Gracias por calificar tu atención' })
  } catch (e) {
    if (e instanceof ConnectionError)
      return res.status(503).json({ message: 'No se puede completar la operación en este momento. Intentá de nuevo más tarde.' })
    res.status(500).json({ message: 'No se pudo guardar la calificación' })
  }
}

module.exports = { sacarTurno, reservarTurno, verHistorial , calificarTurno }