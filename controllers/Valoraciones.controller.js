const { fn, col } = require('sequelize')
const { Hospital, Valoracion } = require('../models/index.model.js')
const seguridad = require('./Seguridad.controller.js')
const bitacora = require('./Bitacora.controller.js')

const DIAS_PARA_EDITAR = 7

const COORDENADAS_HOSPITALES = {
  1: { lat: -34.6058, lon: -58.4241 }, // Hospital Italiano
  2: { lat: -34.5919, lon: -58.3995 }, // Hospital Alemán
  3: { lat: -34.6366, lon: -58.3846 }, // Hospital Británico
  4: { lat: -34.5975, lon: -58.4206 }, // Sanatorio Güemes
  5: { lat: -34.4533, lon: -58.8576 }, // Hospital Austral
  6: { lat: -34.5823, lon: -58.4069 }, // Hospital Fernández
  7: { lat: -34.6001, lon: -58.3996 }, // Hospital de Clínicas
  8: { lat: -34.5728, lon: -58.4194 }, // Trinidad Palermo
  9: { lat: -34.6012, lon: -58.4045 }, // Sanatorio Finochietto
  10: { lat: -34.5802, lon: -58.4312 }, // Sanatorio Los Arcos
  11: { lat: -34.5855, lon: -58.4014 }, // CEMIC
  12: { lat: -34.5779, lon: -58.4048 }, // Mater Dei
  13: { lat: -34.6291, lon: -58.3792 }, // Hospital de Niños Elizalde
  14: { lat: -34.5996, lon: -58.4012 }, // Sanatorio Otamendi
  15: { lat: -34.6318, lon: -58.3895 }, // Garrahan
}

const verHospitales = async (req, res) => {
  try {
    const hospitales = await Hospital.findAll({
      attributes: ['IDHospital', 'NombreH', 'DireccionH', 'SitioWeb', 'EstadoH']
    })
    const conCoordenadas = hospitales.map(h => {
      const plain = h.get({ plain: true })
      const coords = COORDENADAS_HOSPITALES[plain.IDHospital] || { lat: -34.6037, lon: -58.3816 }
      return { ...plain, lat: coords.lat, lon: coords.lon }
    })
    return res.status(200).json(conCoordenadas)
  } catch (error) {
    return res.status(500).json({ message: 'No se pudieron obtener los hospitales' })
  }
}

// CU019: consultar el promedio de valoraciones de un hospital.
const verPromedioHospital = async (req, res) => {
  const dni = req.usuario.DNIUsuario
  const IDHospital = Number(req.params.idHospital)
  if (!Number.isInteger(IDHospital) || IDHospital <= 0) {
    return res.status(400).json({ message: 'El identificador del hospital no es válido' })
  }

  try {
    const hospital = await Hospital.findByPk(IDHospital)
    if (!hospital || String(hospital.EstadoH).toLowerCase() !== 'activo') {
      await bitacora.registrar(`CU019: hospital ${IDHospital} no disponible`, dni)
      return res.status(404).json({ message: 'El hospital no está disponible para consulta' })
    }

    const resultado = await Valoracion.findOne({
      attributes: [[fn('AVG', col('Calificacion')), 'promedio'], [fn('COUNT', col('IDValoracion')), 'cantidad']], 
      where: { IDHospital }
    })
    const cantidad = Number(resultado.get('cantidad'))
    const promedio = cantidad ? Number(Number(resultado.get('promedio')).toFixed(2)) : null
    //await bitacora.registrar(`CU019: consulta de valoraciones del hospital ${IDHospital}`, dni)
    return res.status(200).json({
      hospital: { IDHospital: hospital.IDHospital, NombreH: hospital.NombreH },
      promedio,
      cantidad,
      message: cantidad ? undefined : 'Aún no se registraron calificaciones para este hospital'
    })
  } catch (error) {
    await bitacora.registrar(`CU019: error al obtener valoraciones del hospital ${IDHospital}`, dni)
    return res.status(500).json({ message: 'No fue posible cargar las valoraciones. Podés reintentar la operación' })
  }
}

// CU020: mostrar las valoraciones propias disponibles para edición.
const verMisValoraciones = async (req, res) => {
  try {
    const valoraciones = await Valoracion.findAll({
      where: { DNIUsuario: req.usuario.DNIUsuario },
      include: [{ model: Hospital, attributes: ['IDHospital', 'NombreH'] }],
      order: [['FechaValoracion', 'DESC']]
    })
    const ahora = Date.now()
    return res.status(200).json(valoraciones.map(v => {
      const valoracion = v.get({ plain: true })
      const vence = new Date(valoracion.FechaValoracion).getTime() + DIAS_PARA_EDITAR * 24 * 60 * 60 * 1000
      return { ...valoracion, editable: ahora <= vence, fechaLimiteEdicion: new Date(vence).toISOString() }
    }))
  } catch {
    return res.status(500).json({ message: 'No se pudieron obtener tus valoraciones' })
  }
}

// CU020: editar calificación y/o comentario propios dentro de los siete días.
const editarValoracion = async (req, res) => {
  const dni = req.usuario.DNIUsuario
  const IDValoracion = Number(req.params.idValoracion)
  if (!Number.isInteger(IDValoracion) || IDValoracion <= 0) {
    return res.status(400).json({ message: 'El identificador de la valoración no es válido' })
  }
  const campos = Object.keys(req.body || {})
  const permitidos = ['Calificacion', 'Comentario']
  if (!campos.length || campos.some(campo => !permitidos.includes(campo))) {
    return res.status(400).json({ message: 'Indicá una calificación y/o un comentario válidos para actualizar' })
  }
  const { Calificacion, Comentario } = req.body
  if (Calificacion !== undefined && (!Number.isInteger(Calificacion) || Calificacion < 1 || Calificacion > 5)) {
    return res.status(400).json({ message: 'La calificación debe ser un número entero entre 1 y 5' })
  }
  if (Comentario !== undefined && Comentario !== null && typeof Comentario !== 'string') {
    return res.status(400).json({ message: 'El comentario debe ser texto o null' })
  }

  try {
    const valoracion = await Valoracion.findOne({
      where: { IDValoracion, DNIUsuario: dni }
    })
    if (!valoracion) return res.status(404).json({ message: 'No se encontró una valoración propia con ese identificador' })

    const fechaLimite = new Date(valoracion.FechaValoracion).getTime() + DIAS_PARA_EDITAR * 24 * 60 * 60 * 1000
    if (Date.now() > fechaLimite) {
      await bitacora.registrar(`CU020: plazo vencido para valoración ${valoracion.IDValoracion}`, dni)
      return res.status(409).json({ message: 'La valoración ya no puede editarse porque venció el plazo de 7 días', valoracion })
    }

    if (Calificacion !== undefined) valoracion.Calificacion = Calificacion
    if (Comentario !== undefined) valoracion.Comentario = Comentario
    await valoracion.save()
    await seguridad.calcularDV('Valoracion')
    const promedio = await Valoracion.findOne({
      attributes: [[fn('AVG', col('Calificacion')), 'promedio']],
      where: { IDHospital: valoracion.IDHospital }
    })
    const valoracionActualizada = await Valoracion.findByPk(valoracion.IDValoracion, {
      include: [{ model: Hospital, attributes: ['IDHospital', 'NombreH'] }]
    })
    await bitacora.registrar(`CU020: valoración ${valoracion.IDValoracion} editada`, dni)
    return res.status(200).json({
      message: 'La valoración se actualizó correctamente',
      valoracion: valoracionActualizada || valoracion,
      promedioHospital: Number(Number(promedio.get('promedio')).toFixed(2))
    })
  } catch (error) {
    console.error('Error al editar valoracion:', error)
    await bitacora.registrar(`CU020: error al actualizar valoración ${req.params.idValoracion}`, dni)
    return res.status(500).json({ message: 'No fue posible actualizar la valoración. Podés reintentar la operación' })
  }
}

module.exports = { verHospitales, verPromedioHospital, verMisValoraciones, editarValoracion }
