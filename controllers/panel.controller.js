const { Op, fn, col, ConnectionError } = require('sequelize')
const { Usuario, Rol, Permisos, Hospital, Cita, Valoracion } = require('../models/index.model.js')
const registrarBitacora = require('../helpers/registrarBitacora.js')
const { calcularDV } = require('./Dvv y Dvh.js')

const MENSAJE_503 = 'No se puede completar la operación en este momento. Intentá de nuevo más tarde.'

// CAMBIO 1: la función tienePermiso, la tuya
async function tienePermiso(nombreRol) {
  const rol = await Rol.findOne({
    where: { DescripcionR: nombreRol, ActivoR: true },
    include: [{
      model: Permisos,
      required: true,
      where: { DescripcionP: 'accesoPanel', ActivoP: true },
      through: { attributes: [] }
    }]
  })
  return Boolean(rol)
}

// Trae los datos de la base y arma lo que se le manda al front
async function armarPanel() {
  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const fin = new Date(inicio.getTime() + 24 * 3600 * 1000)

  const usuariosActivos = await Usuario.count({ where: { EstadoU: 'Activo' } })
  const usuariosBloqueados = await Usuario.count({ where: { EstadoU: 'Bloqueado' } })
  const hospitalesActivos = await Hospital.count({ where: { EstadoH: 'Activo' } })
  const hospitalesBloqueados = await Hospital.count({ where: { EstadoH: 'Bloqueado' } })

  const turnosHoy = await Cita.count({
    where: {
      FechaVisita: { [Op.gte]: inicio, [Op.lt]: fin },
      Estado: { [Op.ne]: 'Cancelado' }
    }
  })

  const valoraciones = await Valoracion.findOne({
    attributes: [
      [fn('AVG', col('Calificacion')), 'promedio'],
      [fn('COUNT', col('IDValoracion')), 'cantidad']
    ],
    raw: true
  })

  // La base devuelve los números como texto: los pasamos a número
  valoraciones.cantidad = Number(valoraciones.cantidad)

  if (valoraciones.cantidad > 0) {
    valoraciones.promedio = Number(Number(valoraciones.promedio).toFixed(2))
  } else {
    valoraciones.promedio = null // el front muestra "Sin información disponible"
  }

  return {
    usuarios: { activos: usuariosActivos, bloqueados: usuariosBloqueados },
    turnosHoy: turnosHoy,
    hospitales: { activos: hospitalesActivos, bloqueados: hospitalesBloqueados },
     valoraciones: valoraciones,
    actualizado: new Date().toISOString()
  }
}

const obtenerPanel = async (req, res) => {
  try {
    const dni = req.usuario.DNIUsuario

    if (!(await tienePermiso(req.usuario.rol))) {
      await registrarBitacora(req, {
        proceso: 'Acceso denegado al panel administrativo (CU009)',
        explicacion: `El usuario ${dni} intentó acceder al panel sin permiso`
      })
      await calcularDV('Bitacora')
      return res.status(403).json({ message: 'No cuenta con los permisos necesarios para acceder al panel administrativo.' })
    }

    // 3. Traemos los datos
    const panel = await armarPanel()

    await registrarBitacora(req, {
      proceso: 'Consulta del panel administrativo (CU009)',
      explicacion: `El usuario ${dni} consultó el panel administrativo`
    })

    // 4. Se los mandamos al front
    return res.status(200).json(panel)
  } catch (e) {
    if (e instanceof ConnectionError) return res.status(503).json({ message: MENSAJE_503, reintentar: true })
    console.error('Error en CU009:', e)
    return res.status(500).json({ message: 'No se pudo cargar el panel administrativo.', reintentar: true })
  }
}

module.exports = { obtenerPanel }