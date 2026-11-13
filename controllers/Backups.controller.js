const fs = require('fs/promises')
const fsNative = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const { BackupProgramacion } = require('../models/index.model.js')
const registrarBitacora = require('../helpers/registrarBitacora.js')
const { sequelize } = require('../config/db.js')

async function destinoValido(destino) {
  if (typeof destino !== 'string' || !destino.trim()) return false

  try {
    const carpeta = destino.trim()
    const info = await fs.stat(carpeta)
    await fs.access(carpeta, fsNative.constants.W_OK)
    return info.isDirectory()
  } catch {
    return false
  }
}

async function obtener(req, res) {
  const programacion = await BackupProgramacion.findByPk(1)
  return res.json(programacion)
}

async function guardar(req, res) {
  const { frecuencia, hora, destino, diaSemana, diaMes } = req.body || {}

  // F2: faltan campos obligatorios.
  if (!frecuencia || !hora || !destino) {
    return res.status(400).json({
      message: 'Completá la frecuencia, el horario y el destino.'
    })
  }

  // F1: frecuencia u horario inválidos.
  if (
    !['diaria', 'semanal', 'mensual'].includes(frecuencia) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)
  ) {
    return res.status(400).json({
      message: 'La frecuencia o el horario no son válidos.'
    })
  }

  if (
    frecuencia === 'semanal' &&
    (!Number.isInteger(Number(diaSemana)) ||
      Number(diaSemana) < 0 ||
      Number(diaSemana) > 6)
  ) {
    return res.status(400).json({
      message: 'Elegí un día válido de la semana.'
    })
  }

  if (
    frecuencia === 'mensual' &&
    (!Number.isInteger(Number(diaMes)) ||
      Number(diaMes) < 1 ||
      Number(diaMes) > 31)
  ) {
    return res.status(400).json({
      message: 'Elegí un día válido del mes (1 a 31).'
    })
  }

  if (!(await destinoValido(destino))) {
    return res.status(400).json({
      message: 'El destino no existe o no está disponible para escritura.'
    })
  }

  const valores = {
    Frecuencia: frecuencia,
    Hora: hora,
    DiaSemana: frecuencia === 'semanal' ? Number(diaSemana) : null,
    DiaMes: frecuencia === 'mensual' ? Number(diaMes) : null,
    Destino: path.resolve(destino.trim()),
    Activa: true,
    UltimaEjecucion: null,
    UltimoResultado: null,
    UltimoMensaje: null
  }

  const [programacion] = await BackupProgramacion.findOrCreate({
    where: { IDBackupProgramacion: 1 },
    defaults: valores
  })

  const cambioLaConfiguracion =
    programacion.Frecuencia !== valores.Frecuencia ||
    programacion.Hora !== valores.Hora ||
    programacion.Destino !== valores.Destino ||
    programacion.DiaSemana !== valores.DiaSemana ||
    programacion.DiaMes !== valores.DiaMes

  if (cambioLaConfiguracion) {
    await programacion.update(valores)
  } else if (!programacion.Activa) {
    await programacion.update({ Activa: true })
  }

  return res.json({
    message: 'La programación de copias se guardó correctamente.',
    programacion
  })
}

async function ejecutarBackup(programacion, req = null) {
  const config = sequelize.config
  const ahora = new Date()
  const marca = ahora.toISOString().replace(/[:.]/g, '-')
  const archivo = path.join(
    programacion.Destino,
    `backup-${marca}.dump`
  )

  let resultado = 'error'
  let mensaje = ''

  try {
    if (!(await destinoValido(programacion.Destino))) {
      throw new Error('El destino de almacenamiento no está disponible.')
    }

    await new Promise((resolve, reject) => {
      const argumentos = [
        '--format=custom',
        '--no-password',
        '--host',
        config.host,
        '--port',
        String(config.port),
        '--username',
        config.username,
        '--file',
        archivo,
        config.database
      ]

      const proceso = spawn(
        process.env.PG_DUMP_PATH || 'pg_dump',
        argumentos,
        {
          env: {
            ...process.env,
            PGPASSWORD: config.password || ''
          },
          windowsHide: true
        }
      )

      let salidaError = ''

      proceso.stderr.on('data', (chunk) => {
        salidaError += chunk.toString()
      })

      proceso.on('error', reject)

      proceso.on('close', (codigo) => {
        if (codigo === 0) {
          resolve()
        } else {
          reject(
            new Error(
              salidaError.trim() ||
                `pg_dump finalizó con código ${codigo}.`
            )
          )
        }
      })
    })

    resultado = 'éxito'
    mensaje = `Copia creada: ${archivo}`
  } catch (error) {
    mensaje = error.message || 'No se pudo guardar la copia.'
    await fs.rm(archivo, { force: true }).catch(() => {})
  }

  await programacion.update({
    UltimaEjecucion: ahora,
    UltimoResultado: resultado,
    UltimoMensaje: mensaje
  })

  await sequelize.transaction(async (transaction) => {
    await registrarBitacora(
      req || { user: { id: 'Sistema' } },
      {
        proceso: 'Generar backup automático',
        explicacion:
          resultado === 'éxito'
            ? mensaje
            : `Error al generar backup: ${mensaje}`
      },
      transaction
    )
  })

  return { resultado, mensaje }
}

async function ejecutarAhora(req, res) {
  const programacion = await BackupProgramacion.findByPk(1)

  if (!programacion) {
    return res.status(400).json({
      message: 'Primero configurá una programación y un destino.'
    })
  }

  const resultado = await ejecutarBackup(programacion, req)

  return res
    .status(resultado.resultado === 'éxito' ? 200 : 500)
    .json(resultado)
}

let intervalo = null
let backupEnCurso = false

function iniciarScheduler() {
  if (intervalo) return

  intervalo = setInterval(async () => {
    if (backupEnCurso) return

    const ahora = new Date()

    const [programacion] = await BackupProgramacion.findAll({
      where: {
        IDBackupProgramacion: 1,
        Activa: true
      },
      limit: 1
    }).catch(() => [])

    if (!programacion) return

    const horaActual = ahora.toTimeString().slice(0, 5)
    if (programacion.Hora !== horaActual) return

    const corresponde =
      programacion.Frecuencia === 'diaria' ||
      (programacion.Frecuencia === 'semanal' &&
        programacion.DiaSemana === ahora.getDay()) ||
      (programacion.Frecuencia === 'mensual' &&
        programacion.DiaMes === ahora.getDate())

    if (!corresponde) return

    const ultima = programacion.UltimaEjecucion
      ? new Date(programacion.UltimaEjecucion)
      : null

    const yaSeEjecutoEsteMinuto =
      ultima &&
      ultima.toDateString() === ahora.toDateString() &&
      ultima.getHours() === ahora.getHours() &&
      ultima.getMinutes() === ahora.getMinutes()

    if (yaSeEjecutoEsteMinuto) return

    backupEnCurso = true

    try {
      await ejecutarBackup(programacion)
    } catch (error) {
      console.error('Error en backup automático:', error.message)
    } finally {
      backupEnCurso = false
    }
  }, 15000)

  intervalo.unref?.()
}

module.exports = {
  obtener,
  guardar,
  ejecutarAhora,
  iniciarScheduler,
  ejecutarBackup
}