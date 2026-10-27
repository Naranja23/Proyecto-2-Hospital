const crypto = require('crypto')
const { sequelize } = require('../config/db.js')
const { DVV } = require('../models/index.model.js')

const hash = (txt) => crypto.createHash('sha256').update(txt).digest('hex')

// Helper para encontrar el modelo por nombre de modelo o por tableName
function obtenerModelo(nombreTablaOModelo) {
  if (!nombreTablaOModelo) return null
  if (sequelize.models[nombreTablaOModelo]) return sequelize.models[nombreTablaOModelo]
  const buscado = String(nombreTablaOModelo).toLowerCase()
  for (const m of Object.values(sequelize.models)) {
    if (m.name.toLowerCase() === buscado || (m.tableName && m.tableName.toLowerCase() === buscado)) {
      return m
    }
  }
  return null
}

// Retorna todas las tablas/modelos que tienen la columna DVH
function obtenerTablasConDV() {
  return Object.keys(sequelize.models).filter((n) => {
    const M = sequelize.models[n]
    return M && M.rawAttributes && M.rawAttributes.DVH
  })
}

// DVH: hash de todos los campos de la fila (ordenados alfabéticamente), menos el propio DVH
function calcularDVH(fila, nombreTabla = null) {
  const plain = fila && typeof fila.get === 'function' ? fila.get({ plain: true }) : { ...fila }
  const M = nombreTabla ? obtenerModelo(nombreTabla) : null

  const claves = M && M.rawAttributes
    ? Object.keys(M.rawAttributes).filter((col) => col !== 'DVH')
    : Object.keys(plain).filter((col) => col !== 'DVH' && (plain[col] === null || typeof plain[col] !== 'object' || plain[col] instanceof Date))

  const texto = claves
    .sort()
    .map((k) => {
      const valor = plain[k] === undefined ? null : plain[k]
      return `${k}=${JSON.stringify(valor)}`
    })
    .join('|')

  return hash(texto)
}

// DVV: hash de los DVH de toda la tabla ordenados por clave primaria
const calcularDVV = (dvhs) => hash(dvhs.join(''))

// Trae todas las filas de una tabla ordenadas por clave primaria
function leerTabla(tabla, options = {}) {
  const M = obtenerModelo(tabla)
  if (!M) throw new Error(`Modelo no encontrado para la tabla: ${tabla}`)
  return M.findAll({
    order: [[M.primaryKeyAttribute, 'ASC']],
    hooks: false,
    ...options
  })
}

// Recalcula DVH de cada fila y el DVV de la tabla
async function calcularDV(tabla, options = {}) {
  const M = obtenerModelo(tabla)
  if (!M || !M.rawAttributes?.DVH || M.name === 'DVV') return
  const nombreModelo = M.name

  const filas = await leerTabla(nombreModelo, options)
  const dvhs = []

  for (const f of filas) {
    const plain = f.get({ plain: true })
    const dvh = calcularDVH(plain, nombreModelo)
    if (f.DVH !== dvh) {
      await M.update(
        { DVH: dvh },
        {
          where: { [M.primaryKeyAttribute]: f.get(M.primaryKeyAttribute) },
          hooks: false,
          silent: true,
          transaction: options.transaction
        }
      )
      f.DVH = dvh
    }
    dvhs.push(dvh)
  }

  const totalDVV = calcularDVV(dvhs)
  const DVVModel = sequelize.models.DVV || DVV
  if (DVVModel) {
    const existente = await DVVModel.findOne({
      where: { Tabla: nombreModelo },
      hooks: false,
      transaction: options.transaction
    })
    if (existente) {
      await existente.update(
        { CalculoDVV: totalDVV, FechaActualizacion: new Date() },
        { hooks: false, silent: true, transaction: options.transaction }
      )
    } else {
      await DVVModel.create(
        { Tabla: nombreModelo, CalculoDVV: totalDVV, FechaActualizacion: new Date() },
        { hooks: false, silent: true, transaction: options.transaction }
      )
    }
  }

  return { ok: true, totalDVV, totalFilas: filas.length }
}

const ejecutarCasoDeUsoGlobal = calcularDV

// Inicializa o rectifica los DVs de todas las tablas con DVH
async function inicializarDVs() {
  const tablas = obtenerTablasConDV()
  for (const tabla of tablas) {
    await calcularDV(tabla)
  }
}

// LISTA DE CASOS DE USO SELECCIONADOS PARA MONITOREO
const CASOS_DE_USO_MONITOREADOS = [
  // CU014 - Sacar / Reservar Turno
  { metodo: 'POST',   ruta: '/turnos/reservar',                        tabla: 'Cita',       nombreCU: 'CU014 - Reservar Turno' },
  // CU010 - Calificar Consulta
  { metodo: 'PUT',    ruta: '/turnos/calificar',                       tabla: 'Cita',       nombreCU: 'CU010 - Calificar Consulta' },
  // CU021 - Valorar Paciente
  { metodo: 'POST',   ruta: '/turnos/:id/valorar',                     tabla: 'Cita',       nombreCU: 'CU021 - Valorar Paciente' },

  // CU001 - Registrar Usuario
  { metodo: 'POST',   ruta: '/users/register',                         tabla: 'Usuario',    nombreCU: 'CU001 - Registrar Usuario' },
  { metodo: 'POST',   ruta: '/users',                                  tabla: 'Usuario',    nombreCU: 'Crear Usuario' },
  // Cambiar datos del usuario
  { metodo: 'PUT',    ruta: '/users/perfil',                           tabla: 'Usuario',    nombreCU: 'Cambiar Datos de Perfil' },
  { metodo: 'PUT',    ruta: '/users/cambiar-datos',                    tabla: 'Usuario',    nombreCU: 'Cambiar Datos' },
  { metodo: 'PUT',    ruta: '/users/:id',                              tabla: 'Usuario',    nombreCU: 'Actualizar Usuario' },
  { metodo: 'DELETE', ruta: '/users/:id',                              tabla: 'Usuario',    nombreCU: 'Eliminar Usuario' },

  // CU002 / CU016 - Sesiones
  { metodo: 'POST',   ruta: '/users/login',                            tabla: 'Sesion',     nombreCU: 'CU002 - Iniciar Sesión' },
  { metodo: 'POST',   ruta: '/users/logout',                           tabla: 'Sesion',     nombreCU: 'CU016 - Cerrar Sesión' },

  // CU015 - Planes
  { metodo: 'PUT',    ruta: '/planes/actual',                          tabla: 'Usuario',    nombreCU: 'CU015 - Cambiar Plan' },
  { metodo: 'DELETE', ruta: '/planes/actual',                          tabla: 'Usuario',    nombreCU: 'CU015 - Eliminar Plan' },

  // CU020 - Valoraciones
  { metodo: 'PUT',    ruta: '/valoraciones/:id',                       tabla: 'Valoracion', nombreCU: 'CU020 - Editar Valoración' },

  // CU023 - Desbloquear Hospital
  { metodo: 'PATCH',  ruta: '/seguridad/hospitales/:id/desbloquear',   tabla: 'Hospital',   nombreCU: 'CU023 - Desbloquear Hospital' }
]

// Verifica si la ruta real solicitada coincide con el patrón del caso de uso
function coincideRuta(rutaPatron, rutaReal) {
  const regexPattern = '^' + rutaPatron.replace(/:[^\s/]+/g, '[^/]+') + '(?:\\?.*)?$'
  return new RegExp(regexPattern).test(rutaReal)
}

function interceptorCasoDeUsoGlobal(req, res, next) {
  const rutaCompleta = (req.baseUrl || '') + (req.path || '')
  const metodo = req.method

  // Buscar si la petición actual corresponde a un caso de uso monitoreado
  const casoEncontrado = CASOS_DE_USO_MONITOREADOS.find((cu) =>
    cu.metodo === metodo && (coincideRuta(cu.ruta, rutaCompleta) || coincideRuta(cu.ruta, req.originalUrl))
  )

  if (!casoEncontrado) {
    return next()
  }

  // Escuchar cuando el caso de uso termina de enviar su respuesta al cliente
  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      try {
        // 1° Calcula DVH y 2° Calcula DVV de la tabla del caso de uso
        await ejecutarCasoDeUsoGlobal(casoEncontrado.tabla)

        // Si se generó registro en Bitacora durante el caso de uso, también se sincroniza
        if (casoEncontrado.tabla !== 'Bitacora' && sequelize.models.Bitacora) {
          await ejecutarCasoDeUsoGlobal('Bitacora')
        }
      } catch (error) {
        console.error(`[CU GLOBAL] Error al actualizar integridad tras ${casoEncontrado.nombreCU}:`, error)
      }
    }
  })

  next()
}

module.exports = {
  hash,
  obtenerModelo,
  obtenerTablasConDV,
  calcularDVH,
  calcularDVV,
  leerTabla,
  calcularDV,
  ejecutarCasoDeUsoGlobal,
  inicializarDVs,
  CASOS_DE_USO_MONITOREADOS,
  coincideRuta,
  interceptorCasoDeUsoGlobal
}
