const { Op } = require('sequelize')
const { sequelize } = require('../config/db.js')
const { Especialidad, Medico } = require('../models/index.model.js')
const registrarBitacora = require('../helpers/registrarBitacora.js')

const nombreValido = (value) =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.trim().length <= 100

// Migra las especialidades que ya estaban guardadas como texto en Medico.
async function migrarEspecialidadesLegadas() {
  const medicos = await Medico.findAll({
    attributes: ['IDMedico', 'EspecialidadM']
  })

  for (const medico of medicos) {
    const nombre = medico.EspecialidadM?.trim()
    if (!nombre) continue

    const [especialidad] = await Especialidad.findOrCreate({
      where: { NombreEspecialidad: nombre },
      defaults: { NombreEspecialidad: nombre }
    })

    const asociadas = await medico.getEspecialidades({
      attributes: ['IDEspecialidad']
    })

    if (!asociadas.some(
      (item) => item.IDEspecialidad === especialidad.IDEspecialidad
    )) {
      await medico.addEspecialidad(especialidad)
    }
  }
}

async function listar(req, res) {
  try {
    const especialidades = await Especialidad.findAll({
      include: [{
        model: Medico,
        as: 'medicos',
        attributes: ['IDMedico', 'NomApeM'],
        through: { attributes: [] }
      }],
      order: [['NombreEspecialidad', 'ASC']]
    })

    return res.status(200).json(especialidades)
  } catch {
    return res.status(500).json({
      message: 'No se pudieron obtener las especialidades'
    })
  }
}

async function crear(req, res) {
  const nombre = req.body?.nombre

  if (!nombreValido(nombre)) {
    return res.status(400).json({
      message: 'El nombre es obligatorio y debe tener hasta 100 caracteres'
    })
  }

  try {
    const especialidad = await sequelize.transaction(async (transaction) => {
      const existente = await Especialidad.findOne({
        where: {
          NombreEspecialidad: { [Op.iLike]: nombre.trim() }
        },
        transaction
      })

      if (existente) {
        const error = new Error('La especialidad ya existe')
        error.status = 409
        throw error
      }

      const creada = await Especialidad.create({
        NombreEspecialidad: nombre.trim()
      }, { transaction })

      await registrarBitacora(req, {
        proceso: 'Crear especialidad',
        explicacion:
          `Se agregó la especialidad "${creada.NombreEspecialidad}" ` +
          `(ID ${creada.IDEspecialidad})`
      }, transaction)

      return creada
    })

    return res.status(201).json({
      message: 'Especialidad creada correctamente',
      especialidad
    })
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : 'No se pudo crear la especialidad'
    })
  }
}

async function actualizar(req, res) {
  const id = Number(req.params.id)
  const nombre = req.body?.nombre

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El identificador no es válido'
    })
  }

  if (!nombreValido(nombre)) {
    return res.status(400).json({
      message: 'El nombre es obligatorio y debe tener hasta 100 caracteres'
    })
  }

  try {
    const especialidad = await sequelize.transaction(async (transaction) => {
      const registro = await Especialidad.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      })

      if (!registro) {
        const error = new Error('La especialidad no existe')
        error.status = 404
        throw error
      }

      const duplicada = await Especialidad.findOne({
        where: {
          IDEspecialidad: { [Op.ne]: id },
          NombreEspecialidad: { [Op.iLike]: nombre.trim() }
        },
        transaction
      })

      if (duplicada) {
        const error = new Error(
          'Ya existe una especialidad con ese nombre'
        )
        error.status = 409
        throw error
      }

      const anterior = registro.NombreEspecialidad
      registro.NombreEspecialidad = nombre.trim()
      await registro.save({ transaction })

      await registrarBitacora(req, {
        proceso: 'Editar especialidad',
        explicacion:
          `Se cambió "${anterior}" por ` +
          `"${registro.NombreEspecialidad}" (ID ${id})`
      }, transaction)

      return registro
    })

    return res.status(200).json({
      message: 'Especialidad actualizada correctamente',
      especialidad
    })
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : 'No se pudo actualizar la especialidad'
    })
  }
}

async function eliminar(req, res) {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El identificador no es válido'
    })
  }

  try {
    await sequelize.transaction(async (transaction) => {
      const registro = await Especialidad.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      })

      if (!registro) {
        const error = new Error('La especialidad no existe')
        error.status = 404
        throw error
      }

      const cantidadMedicos = await registro.countMedicos({ transaction })

      if (cantidadMedicos > 0) {
        const error = new Error(
          'No se puede eliminar: hay médicos asociados a esta especialidad'
        )
        error.status = 409
        throw error
      }

      await registro.destroy({ transaction })

      await registrarBitacora(req, {
        proceso: 'Eliminar especialidad',
        explicacion:
          `Se eliminó "${registro.NombreEspecialidad}" (ID ${id})`
      }, transaction)
    })

    return res.status(200).json({
      message: 'Especialidad eliminada correctamente'
    })
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : 'No se pudo eliminar la especialidad'
    })
  }
}

async function asignarMedicos(req, res) {
  const id = Number(req.params.id)
  const ids = req.body?.idsMedicos

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'El identificador no es válido'
    })
  }

  if (
    !Array.isArray(ids) ||
    ids.some((item) => !Number.isInteger(Number(item)) || Number(item) <= 0)
  ) {
    return res.status(400).json({
      message: 'idsMedicos debe ser una lista de identificadores válidos'
    })
  }

  const idsUnicos = [...new Set(ids.map(Number))]

  try {
    const medicos = await sequelize.transaction(async (transaction) => {
      const especialidad = await Especialidad.findByPk(id, { transaction })

      if (!especialidad) {
        const error = new Error('La especialidad no existe')
        error.status = 404
        throw error
      }

      const medicosEncontrados = await Medico.findAll({
        where: { IDMedico: { [Op.in]: idsUnicos } },
        transaction
      })

      if (medicosEncontrados.length !== idsUnicos.length) {
        const error = new Error('Uno o más médicos no existen')
        error.status = 400
        throw error
      }

      await especialidad.setMedicos(medicosEncontrados, { transaction })

      await registrarBitacora(req, {
        proceso: 'Asignar médicos a especialidad',
        explicacion:
          `Se actualizaron los médicos asociados a ` +
          `"${especialidad.NombreEspecialidad}" (ID ${id})`
      }, transaction)

      return especialidad.getMedicos({
        attributes: ['IDMedico', 'NomApeM'],
        transaction
      })
    })

    return res.status(200).json({
      message: 'Médicos asociados correctamente',
      medicos
    })
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : 'No se pudieron asociar los médicos'
    })
  }
}

async function listarMedicos(req, res) {
  try {
    const medicos = await Medico.findAll({
      attributes: ['IDMedico', 'NomApeM', 'EspecialidadM'],
      order: [['NomApeM', 'ASC']]
    })
    return res.status(200).json(medicos)
  } catch (error) {
    return res.status(500).json({
      message: 'No se pudieron obtener los médicos'
    })
  }
}

module.exports = {
  listar,
  listarMedicos,
  crear,
  actualizar,
  eliminar,
  asignarMedicos,
  migrarEspecialidadesLegadas
}