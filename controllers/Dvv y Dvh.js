const { sequelize } = require('../config/db.js')
const { DVV } = require('../models/index.model.js')

// Cálculo numérico de DVH y DVV (sin hashes criptográficos)

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

function obtenerTablasConDV() {
  return Object.keys(sequelize.models).filter((n) => {
    const M = sequelize.models[n]
    return M && M.rawAttributes && M.rawAttributes.DVH && M.name !== 'DVV'
  })
}

// DVH: Dígito Verificador Horizontal numérico calculado a partir de todos los campos de la tupla (menos DVH)
function calcularDVH(fila, nombreTabla = null) {
  const plain = fila && typeof fila.get === 'function' ? fila.get({ plain: true }) : { ...fila }
  const M = nombreTabla ? obtenerModelo(nombreTabla) : null

  const claves = M && M.rawAttributes
    ? Object.keys(M.rawAttributes).filter((col) => col !== 'DVH')
    : Object.keys(plain).filter((col) => col !== 'DVH')

  let suma = 0
  claves.sort().forEach((col, colIdx) => {
    const val = plain[col]
    if (val !== null && val !== undefined) {
      let str = ''
      if (val instanceof Date) {
        str = String(val.getTime())
      } else if (typeof val === 'string' && (val.includes('T') || val.includes('-')) && !isNaN(Date.parse(val))) {
        str = String(new Date(val).getTime())
      } else if (typeof val === 'object') {
        str = JSON.stringify(val)
      } else {
        str = String(val)
      }

      for (let i = 0; i < str.length; i++) {
        suma = (suma + str.charCodeAt(i) * (i + 1) * (colIdx + 1)) % 1000000007
      }
    }
  })

  return suma
}

// DVV: Dígito Verificador Vertical numérico = sumatoria de todos los DVH de la tabla
const calcularDVV = (dvhs) => {
  if (!Array.isArray(dvhs) || dvhs.length === 0) return 0
  const suma = dvhs.reduce((acc, v) => acc + (Number(v) || 0), 0)
  return suma % 2147483647
}

function leerTabla(tabla, options = {}) {
  const M = obtenerModelo(tabla)
  if (!M) throw new Error(`Modelo no encontrado para la tabla: ${tabla}`)

  const pkAttr = M.primaryKeyAttribute ||
    (M.primaryKeyAttributes && M.primaryKeyAttributes[0]) ||
    Object.keys(M.rawAttributes)[0]

  return M.findAll({
    order: [[pkAttr, 'ASC']],
    hooks: false,
    ...options
  })
}

// Recalcula DVH de cada fila y el DVV de la tabla
async function calcularDV(tabla, options = {}) {
  if (Array.isArray(tabla)) {
    const resultados = []
    for (const t of tabla) {
      if (t) resultados.push(await calcularDV(t, options))
    }
    return { ok: true, resultados }
  }

  const M = obtenerModelo(tabla)
  if (!M || !M.rawAttributes?.DVH || M.name === 'DVV') return { ok: true }
  const nombreModelo = M.name

  const filas = await leerTabla(nombreModelo, options)
  const dvhs = []

  const pkAttrs = M.primaryKeyAttributes && M.primaryKeyAttributes.length
    ? M.primaryKeyAttributes
    : (M.primaryKeyAttribute ? [M.primaryKeyAttribute] : [])

  for (const f of filas) {
    const plain = f.get({ plain: true })
    const dvh = calcularDVH(plain, nombreModelo)
    const dvhActual = f.DVH != null ? Number(f.DVH) : null

    if (dvhActual !== dvh) {
      const whereCondition = {}
      for (const pk of pkAttrs) {
        whereCondition[pk] = f.get(pk)
      }

      if (Object.keys(whereCondition).length > 0) {
        await M.update(
          { DVH: dvh },
          {
            where: whereCondition,
            hooks: false,
            silent: true,
            transaction: options.transaction
          }
        )
      }
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

// LISTA COMPLETA DE CASOS DE USO MONITOREADOS PARA INTEGRIDAD GLOBAL (DVH / DVV)
const CASOS_DE_USO_MONITOREADOS = [
  // CU001 - Gestionar usuarios
  { metodo: 'POST',   ruta: '/users/register',                         tabla: ['Usuario', 'Bitacora'], nombreCU: 'CU001 - Registrar Usuario' },
  { metodo: 'POST',   ruta: '/users',                                  tabla: ['Usuario', 'Bitacora'], nombreCU: 'CU001 - Crear Usuario' },
  { metodo: 'PUT',    ruta: '/users/:id',                              tabla: ['Usuario', 'Bitacora'], nombreCU: 'CU001 - Modificar Usuario' },
  { metodo: 'PUT',    ruta: '/users/:id/bloquear',                     tabla: ['Usuario', 'Bitacora'], nombreCU: 'CU001 - Bloquear Usuario' },
  { metodo: 'PATCH',  ruta: '/users/:id/bloquear',                     tabla: ['Usuario', 'Bitacora'], nombreCU: 'CU001 - Bloquear Usuario' },
  { metodo: 'PUT',    ruta: '/users/:id/reactivar',                    tabla: ['Usuario', 'Bitacora'], nombreCU: 'CU001 - Reactivar Usuario' },
  { metodo: 'PATCH',  ruta: '/users/:id/reactivar',                    tabla: ['Usuario', 'Bitacora'], nombreCU: 'CU001 - Reactivar Usuario' },
  { metodo: 'DELETE', ruta: '/users/:id',                              tabla: ['Usuario', 'Bitacora'], nombreCU: 'CU001 - Eliminar Usuario' },

  // CU005 - Alta de hospital
  { metodo: 'POST',   ruta: '/hospitales',                             tabla: ['Hospital', 'Bitacora'], nombreCU: 'CU005 - Alta de hospital' },

  // CU006 - Actualizar Cartilla
  { metodo: 'PUT',    ruta: '/cartilla/:prepagaId',                    tabla: ['Cartilla', 'Bitacora'], nombreCU: 'CU006 - Actualizar Cartilla' },

  // CU007 - Sacar un hospital
  { metodo: 'DELETE', ruta: '/hospitales/:id',                         tabla: ['Hospital', 'Bitacora'], nombreCU: 'CU007 - Sacar Hospital' },
  { metodo: 'DELETE', ruta: '/sacar-hospital/:id',                     tabla: ['Hospital', 'Bitacora'], nombreCU: 'CU007 - Sacar Hospital' },

  // CU008 - Bloquear hospital
  { metodo: 'PUT',    ruta: '/bloquear-hospital/:id/bloquear',         tabla: ['Hospital', 'Bitacora'], nombreCU: 'CU008 - Bloquear Hospital' },
  { metodo: 'PUT',    ruta: '/hospitales/:id/bloquear',                tabla: ['Hospital', 'Bitacora'], nombreCU: 'CU008 - Bloquear Hospital' },
  { metodo: 'PATCH',  ruta: '/hospitales/:id/bloquear',                tabla: ['Hospital', 'Bitacora'], nombreCU: 'CU008 - Bloquear Hospital' },

  // CU009 - Gestionar Panel administrativo
  { metodo: 'GET',    ruta: '/panel',                                  tabla: 'Bitacora',              nombreCU: 'CU009 - Gestionar Panel administrativo' },

  // CU010 - Calificar Consulta / Atención
  { metodo: 'PUT',    ruta: '/turnos/calificar',                       tabla: ['Cita', 'Bitacora'],    nombreCU: 'CU010 - Calificar Consulta' },

  // CU012 - Ver Historial de Consultas
  { metodo: 'GET',    ruta: '/turnos/historial',                       tabla: 'Bitacora',              nombreCU: 'CU012 - Ver Historial' },

  // CU013 - Rectificar Integridad
  { metodo: 'POST',   ruta: '/seguridad/integridad/rectificar',        tabla: 'Bitacora',              nombreCU: 'CU013 - Rectificar Integridad' },

  // CU014 - Sacar / Reservar Turno
  { metodo: 'POST',   ruta: '/turnos/buscar',                          tabla: 'Bitacora',              nombreCU: 'CU014 - Buscar Turno' },
  { metodo: 'POST',   ruta: '/turnos/reservar',                        tabla: ['Cita', 'Bitacora'],    nombreCU: 'CU014 - Reservar Turno' },
  { metodo: 'POST',   ruta: '/turnos',                                 tabla: ['Turno', 'Bitacora'],   nombreCU: 'CU014 - Crear Turno' },
  { metodo: 'PUT',    ruta: '/turnos/:id',                             tabla: ['Turno', 'Bitacora'],   nombreCU: 'CU014 - Modificar Turno' },
  { metodo: 'DELETE', ruta: '/turnos/:id',                             tabla: ['Turno', 'Bitacora'],   nombreCU: 'CU014 - Eliminar Turno' },

  // CU015 - Gestionar Planes
  { metodo: 'PUT',    ruta: '/planes/actual',                          tabla: ['Usuario', 'Bitacora'], nombreCU: 'CU015 - Cambiar Plan' },
  { metodo: 'DELETE', ruta: '/planes/actual',                          tabla: ['Usuario', 'Bitacora'], nombreCU: 'CU015 - Eliminar Plan' },

  // CU016 - Cerrar Sesión
  { metodo: 'POST',   ruta: '/users/logout',                           tabla: ['Sesion', 'Bitacora'],  nombreCU: 'CU016 - Cerrar Sesión' },

  // CU017 - Gestionar Especialidades Médicas
  { metodo: 'POST',   ruta: '/especialidades',                         tabla: 'Bitacora',              nombreCU: 'CU017 - Crear Especialidad' },
  { metodo: 'PUT',    ruta: '/especialidades/:id',                     tabla: 'Bitacora',              nombreCU: 'CU017 - Actualizar Especialidad' },
  { metodo: 'DELETE', ruta: '/especialidades/:id',                     tabla: 'Bitacora',              nombreCU: 'CU017 - Eliminar Especialidad' },
  { metodo: 'PUT',    ruta: '/especialidades/:id/medicos',             tabla: 'Bitacora',              nombreCU: 'CU017 - Asignar Médicos' },

  // CU019 - Consultar Promedio de Valoraciones
  { metodo: 'GET',    ruta: '/valoraciones/hospital/:idHospital/promedio', tabla: 'Bitacora',          nombreCU: 'CU019 - Promedio Valoraciones' },

  // CU020 - Editar Valoración
  { metodo: 'PUT',    ruta: '/valoraciones/:id',                       tabla: ['Valoracion', 'Bitacora'], nombreCU: 'CU020 - Editar Valoración' },
  { metodo: 'PUT',    ruta: '/valoraciones/:idValoracion',             tabla: ['Valoracion', 'Bitacora'], nombreCU: 'CU020 - Editar Valoración' },

  // CU021 - Valorar Paciente / Consulta
  { metodo: 'POST',   ruta: '/turnos/:id/valorar',                     tabla: ['Cita', 'Bitacora'],    nombreCU: 'CU021 - Valorar Paciente' },
  { metodo: 'PUT',    ruta: '/turnos/:id/valorar',                     tabla: ['Cita', 'Bitacora'],    nombreCU: 'CU021 - Valorar Paciente' },
  { metodo: 'POST',   ruta: '/valoraciones',                           tabla: ['Valoracion', 'Bitacora'], nombreCU: 'CU021 - Crear Valoración' },

  // CU022 - Recuperar Contraseña
  { metodo: 'POST',   ruta: '/seguridad/recuperar-password',           tabla: 'Bitacora',              nombreCU: 'CU022 - Recuperar Contraseña' },

  // CU023 - Desbloquear Hospital
  { metodo: 'PATCH',  ruta: '/seguridad/hospitales/:id/desbloquear',   tabla: ['Hospital', 'Bitacora'], nombreCU: 'CU023 - Desbloquear Hospital' },
  { metodo: 'PUT',    ruta: '/seguridad/hospitales/:id/desbloquear',   tabla: ['Hospital', 'Bitacora'], nombreCU: 'CU023 - Desbloquear Hospital' },
  { metodo: 'PATCH',  ruta: '/hospitales/:id/desbloquear',             tabla: ['Hospital', 'Bitacora'], nombreCU: 'CU023 - Desbloquear Hospital' },
  { metodo: 'PUT',    ruta: '/hospitales/:id/desbloquear',             tabla: ['Hospital', 'Bitacora'], nombreCU: 'CU023 - Desbloquear Hospital' },
]

function coincideRuta(rutaPatron, rutaReal) {
  if (!rutaPatron || !rutaReal) return false
  const limpia = rutaReal.split('?')[0].replace(/\/+$/, '') || '/'
  const patronLimpio = rutaPatron.replace(/\/+$/, '') || '/'
  const regexPattern = '^' + patronLimpio.replace(/:[^\s/]+/g, '[^/]+') + '$'
  return new RegExp(regexPattern).test(limpia)
}

function interceptorCasoDeUsoGlobal(req, res, next) {
  const rutaCompleta = (req.baseUrl || '') + (req.path || '')
  const metodo = req.method

  const casoEncontrado = CASOS_DE_USO_MONITOREADOS.find((cu) =>
    cu.metodo === metodo && (coincideRuta(cu.ruta, rutaCompleta) || coincideRuta(cu.ruta, req.originalUrl))
  )

  if (!casoEncontrado) {
    return next()
  }

  res.on('finish', async () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      try {
        const tablas = Array.isArray(casoEncontrado.tabla)
          ? casoEncontrado.tabla
          : [casoEncontrado.tabla]

        for (const t of tablas) {
          if (t) await ejecutarCasoDeUsoGlobal(t)
        }

        if (!tablas.includes('Bitacora') && sequelize.models.Bitacora) {
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
