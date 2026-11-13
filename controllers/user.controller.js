const { Usuario, Plan, Rol, Prepaga } = require('../models/index.model.js')
const { Op } = require('sequelize')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { crearSesion } = require('./Sesion.controller.js')
const registrarBitacora = require('../helpers/registrarBitacora')
const { calcularDV } = require('./Dvv y Dvh.js')

// CU001 - Paso 2: El sistema muestra la lista de usuarios registrados
const getUsers = async (req, res) => {
    try {
        const { incluirInactivos, estado, rol } = req.query
        const where = {}

        if (estado && estado !== 'Todos') {
            where.EstadoU = estado
        } else if (incluirInactivos !== 'true' && req.query.todos !== 'true' && !req.user?.rol?.includes('Admin')) {
            where.EstadoU = { [Op.ne]: 'Inactivo' }
        }

        const includeRoles = {
            model: Rol,
            attributes: ['IDRol', 'DescripcionR'],
            through: { attributes: [] },
            required: false
        }
        if (rol && rol !== 'Todos') {
            includeRoles.where = { DescripcionR: rol }
            includeRoles.required = true
        }

        const users = await Usuario.findAll({
            where,
            attributes: { exclude: ['Password'] },
            include: [
                { model: Plan, attributes: ['IDPlan', 'NombrePlan', 'TipoPlan'], required: false },
                includeRoles
            ],
            order: [['DNIUsuario', 'ASC']]
        })
        return res.status(200).json(users)
    } catch (error) {
        // Flujo Alternativo F 2: La lista de usuarios no es mandada de forma correcta o no existe.
        return res.status(500).json({
            ok: false,
            codigo: 'F2',
            message: "Error al obtener la lista de usuarios del sistema",
            error: error.message
        })
    }
}

// Obtener usuario por ID (DNIUsuario)
const getUserByID = async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (!id || isNaN(id)) {
            return res.status(400).json({ ok: false, codigo: 'F4', message: "Identificador de usuario no válido" })
        }

        const user = await Usuario.findByPk(id, {
            attributes: { exclude: ['Password'] },
            include: [
                { model: Plan, attributes: ['IDPlan', 'NombrePlan', 'TipoPlan'], required: false },
                { model: Rol, attributes: ['IDRol', 'DescripcionR'], through: { attributes: [] }, required: false }
            ]
        })
        // Flujo Alternativo F 3: El usuario seleccionado no existe.
        if (!user) {
            return res.status(404).json({ ok: false, codigo: 'F3', message: `El usuario seleccionado con DNI ${req.params.id} no existe` })
        }
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({ ok: false, codigo: 'F6', message: "Error al obtener el usuario", error: error.message })
    }
}

// Registrar / Crear usuario
const register = async (req, res) => {
    try {
        // Preservar exactamente el nombre y apellido tal como se ingresaron
        const nombreFinal = req.body.NomApeU
            ? String(req.body.NomApeU).trim()
            : (req.body.nombre && req.body.apellido ? `${String(req.body.nombre).trim()} ${String(req.body.apellido).trim()}` : '')

        const dniFinal = Number(req.body.dni || req.body.DNIUsuario)
        const emailFinal = (req.body.email || req.body.Email || '').trim()
        const passwordFinal = req.body.password || req.body.Password
        const fechaNacimiento = req.body.fechaNacimiento || req.body.FechaNacimiento

        if (!nombreFinal) {
            return res.status(400).json({ message: "El nombre y el apellido son obligatorios" })
        }
        if (!dniFinal || isNaN(dniFinal)) {
            return res.status(400).json({ message: "El DNI es obligatorio y debe ser numérico" })
        }
        if (!emailFinal) {
            return res.status(400).json({ message: "El correo electrónico es obligatorio" })
        }
        if (!passwordFinal || passwordFinal.length < 6) {
            return res.status(400).json({ message: "La contraseña es obligatoria (mínimo 6 caracteres)" })
        }

        // Verificar si el email ya existe
        const userPorEmail = await Usuario.findOne({ where: { Email: emailFinal } })
        if (userPorEmail) {
            if (userPorEmail.EstadoU && userPorEmail.EstadoU.toLowerCase() === 'inactivo') {
                return res.status(400).json({ message: "El correo electrónico pertenece a una cuenta inactiva" })
            }
            return res.status(400).json({ message: "El correo electrónico ya está registrado" })
        }

        // Verificar si el DNI ya existe
        const userPorDni = await Usuario.findByPk(dniFinal)
        if (userPorDni) {
            if (userPorDni.EstadoU && userPorDni.EstadoU.toLowerCase() === 'inactivo') {
                return res.status(400).json({ message: "El DNI pertenece a una cuenta inactiva. Comuníquese con administración para reactivarla." })
            }
            return res.status(400).json({ message: "El DNI ya está registrado" })
        }

        // Si se envió la edad directamente, respetarla sin modificar; sino calcularla desde fechaNacimiento
        let edadCalculada = null
        if (req.body.EdadU !== undefined && req.body.EdadU !== null && req.body.EdadU !== '') {
            edadCalculada = Number(req.body.EdadU)
        } else if (req.body.edad !== undefined && req.body.edad !== null && req.body.edad !== '') {
            edadCalculada = Number(req.body.edad)
        } else if (fechaNacimiento) {
            const fecha = new Date(fechaNacimiento)
            if (!isNaN(fecha.getTime())) {
                const dif = Date.now() - fecha.getTime()
                edadCalculada = Math.abs(new Date(dif).getUTCFullYear() - 1970)
            }
        }

        // Resolver IDPlanes si se envió idPlan o nombre de obra social
        let idPlanes = req.body.IDPlanes || req.body.idPlan || req.body.IDPlan || null
        if (!idPlanes && req.body.obraSocial && Prepaga) {
            try {
                const prepaga = await Prepaga.findOne({
                    where: { NombreComercial: req.body.obraSocial }
                })
                if (prepaga && prepaga.IDPlanes) {
                    idPlanes = prepaga.IDPlanes
                } else if (prepaga && Plan) {
                    const plan = await Plan.findOne({ where: { IDPrepaga: prepaga.IDPrepaga } })
                    if (plan) idPlanes = plan.IDPlan
                }
            } catch (_) {}
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(passwordFinal, 10)

        // Crear usuario con todos sus datos completos
        const nuevoUsuario = await Usuario.create({
            DNIUsuario: dniFinal,
            NomApeU: nombreFinal,
            Email: emailFinal,
            Password: hashedPassword,
            EdadU: edadCalculada,
            EstadoU: 'Activo',
            IDPlanes: idPlanes
        })

        // Asignar rol por defecto (Paciente = 3)
        try {
            if (Rol) {
                const rolPaciente = await Rol.findOne({ where: { DescripcionR: 'Paciente' } })
                if (rolPaciente) {
                    await nuevoUsuario.addRol(rolPaciente)
                } else {
                    const rolPorId = await Rol.findByPk(3)
                    if (rolPorId) {
                        await nuevoUsuario.addRol(rolPorId)
                    }
                }
            }
        } catch (_) {}

        res.status(201).json({
            message: "Cuenta creada con éxito",
            usuario: {
                DNIUsuario: nuevoUsuario.DNIUsuario,
                NomApeU: nuevoUsuario.NomApeU,
                Email: nuevoUsuario.Email,
                EdadU: nuevoUsuario.EdadU,
                EstadoU: nuevoUsuario.EstadoU,
                IDPlanes: nuevoUsuario.IDPlanes
            }
        })
        // Registrar en bitácora la creación del usuario por registro público
        await registrarBitacora(req, { proceso: 'Registro Usuario', explicacion: `Usuario ${nuevoUsuario.DNIUsuario} registrado públicamente` })
        await calcularDV('Usuario')
        await calcularDV('Bitacora')
    } catch (error) {
        res.status(500).json({ message: "Error al registrar usuario", error: error.message })
    }
}

// ============================================================================
// CU001 - GESTIONAR USUARIOS (ADMINISTRADOR)
// ============================================================================

// CU001 - Acción: Crear Usuario
const createUser = async (req, res) => {
    try {
        const dniFinal = Number(req.body.dni || req.body.DNIUsuario)
        const nombreFinal = req.body.NomApeU
            ? String(req.body.NomApeU).trim()
            : (req.body.nombre && req.body.apellido ? `${String(req.body.nombre).trim()} ${String(req.body.apellido).trim()}` : '')
        const emailFinal = (req.body.email || req.body.Email || '').trim()
        const passwordFinal = req.body.password || req.body.Password
        const estadoFinal = req.body.EstadoU || req.body.estado || 'Activo'
        const rolElegido = req.body.rol || req.body.IDRol || 'Paciente'

        // Flujo Alternativo F 4: Los datos ingresados son inválidos
        if (!dniFinal || isNaN(dniFinal) || dniFinal < 1000000 || dniFinal > 99999999) {
            return res.status(400).json({ ok: false, codigo: 'F4', message: "El DNI es obligatorio, numérico y debe tener entre 7 y 8 dígitos" })
        }
        if (!nombreFinal || nombreFinal.length < 3) {
            return res.status(400).json({ ok: false, codigo: 'F4', message: "El nombre y apellido son obligatorios (mínimo 3 caracteres)" })
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailFinal || !emailRegex.test(emailFinal)) {
            return res.status(400).json({ ok: false, codigo: 'F4', message: "El correo electrónico es obligatorio y debe tener un formato válido" })
        }
        if (!passwordFinal || String(passwordFinal).length < 6) {
            return res.status(400).json({ ok: false, codigo: 'F4', message: "La contraseña es obligatoria y debe tener al menos 6 caracteres" })
        }

        // Verificar unicidad de DNI
        const existenteDni = await Usuario.findByPk(dniFinal)
        if (existenteDni) {
            return res.status(400).json({ ok: false, codigo: 'F4', message: `El DNI ${dniFinal} ya se encuentra registrado en el sistema` })
        }

        // Verificar unicidad de Email
        const existenteEmail = await Usuario.findOne({ where: { Email: emailFinal } })
        if (existenteEmail) {
            return res.status(400).json({ ok: false, codigo: 'F4', message: "El correo electrónico ya está registrado por otro usuario" })
        }

        // Validar edad
        let edadCalculada = null
        if (req.body.EdadU !== undefined && req.body.EdadU !== null && req.body.EdadU !== '') {
            edadCalculada = Number(req.body.EdadU)
            if (isNaN(edadCalculada) || edadCalculada < 1 || edadCalculada > 125) {
                return res.status(400).json({ ok: false, codigo: 'F4', message: "La edad debe ser un número entero entre 1 y 125" })
            }
        }

        // Resolver IDPlanes
        let idPlanes = req.body.IDPlanes || req.body.idPlan || req.body.IDPlan || null

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(String(passwordFinal), 10)

        // Crear usuario
        const nuevoUsuario = await Usuario.create({
            DNIUsuario: dniFinal,
            NomApeU: nombreFinal,
            Email: emailFinal,
            Password: hashedPassword,
            EdadU: edadCalculada,
            EstadoU: estadoFinal,
            IDPlanes: idPlanes,
            DVH: null
        })

        // Asignar rol
        let rolAsignadoNombre = 'Paciente'
        try {
            if (Rol) {
                let rolObj = null
                if (typeof rolElegido === 'number' || !isNaN(Number(rolElegido))) {
                    rolObj = await Rol.findByPk(Number(rolElegido))
                } else if (typeof rolElegido === 'string') {
                    rolObj = await Rol.findOne({ where: { DescripcionR: rolElegido } })
                }
                if (!rolObj) {
                    rolObj = await Rol.findOne({ where: { DescripcionR: 'Paciente' } })
                }
                if (rolObj) {
                    await nuevoUsuario.addRol(rolObj)
                    rolAsignadoNombre = rolObj.DescripcionR
                }
            }
        } catch (_) {}

        // CU001 - Paso 6: Se usa el Dígito Verificador (DVH y DVV de Usuario)
        await calcularDV('Usuario')

        // CU001 - Paso 7 y 8: Registro en bitácora con cálculo de DVH y DVV de Bitácora
        await registrarBitacora(req, {
            proceso: 'CU001 - Gestionar usuarios',
            modulo: 'Usuarios',
            accion: 'Crear usuario',
            detalle: `Se creó el usuario ${nuevoUsuario.NomApeU} (DNI ${nuevoUsuario.DNIUsuario}) con rol ${rolAsignadoNombre} y estado ${nuevoUsuario.EstadoU}`
        })
        await calcularDV('Bitacora')

        return res.status(201).json({
            ok: true,
            message: "Usuario creado correctamente",
            usuario: {
                DNIUsuario: nuevoUsuario.DNIUsuario,
                NomApeU: nuevoUsuario.NomApeU,
                Email: nuevoUsuario.Email,
                EdadU: nuevoUsuario.EdadU,
                EstadoU: nuevoUsuario.EstadoU,
                IDPlanes: nuevoUsuario.IDPlanes,
                Rol: rolAsignadoNombre
            }
        })
    } catch (error) {
        // Flujo Alternativo F 6: Ocurre un error al guardar los cambios.
        return res.status(500).json({
            ok: false,
            codigo: 'F6',
            message: "Ocurrió un error al guardar los cambios en la base de datos",
            error: error.message
        })
    }
}

// CU001 - Acción: Modificar Usuario
const putUser = async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (!id || isNaN(id)) {
            return res.status(400).json({ ok: false, codigo: 'F4', message: "Identificador de usuario no válido" })
        }

        const user = await Usuario.findByPk(id)
        // Flujo Alternativo F 3: El usuario seleccionado no existe.
        if (!user) {
            return res.status(404).json({ ok: false, codigo: 'F3', message: `El usuario seleccionado con DNI ${req.params.id} no existe` })
        }

        // Flujo Alternativo F 4: Validación de datos
        if (req.body.NomApeU !== undefined) {
            const nom = String(req.body.NomApeU).trim()
            if (nom.length < 3) {
                return res.status(400).json({ ok: false, codigo: 'F4', message: "El nombre y apellido deben tener al menos 3 caracteres" })
            }
            user.NomApeU = nom
        } else if (req.body.nombre && req.body.apellido) {
            user.NomApeU = `${String(req.body.nombre).trim()} ${String(req.body.apellido).trim()}`
        }

        if (req.body.Email !== undefined || req.body.email !== undefined) {
            const emailLimpio = String(req.body.Email || req.body.email).trim()
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailLimpio || !emailRegex.test(emailLimpio)) {
                return res.status(400).json({ ok: false, codigo: 'F4', message: "El formato de correo electrónico no es válido" })
            }
            if (emailLimpio.toLowerCase() !== user.Email.toLowerCase()) {
                const yaExiste = await Usuario.findOne({ where: { Email: emailLimpio } })
                if (yaExiste && yaExiste.DNIUsuario !== id) {
                    return res.status(409).json({ ok: false, codigo: 'F4', message: "El correo electrónico ya está registrado por otro usuario" })
                }
            }
            user.Email = emailLimpio
        }

        if (req.body.EdadU !== undefined || req.body.edad !== undefined) {
            const e = req.body.EdadU !== undefined ? req.body.EdadU : req.body.edad
            if (e !== null && e !== '') {
                const eNum = Number(e)
                if (isNaN(eNum) || eNum < 1 || eNum > 125) {
                    return res.status(400).json({ ok: false, codigo: 'F4', message: "La edad debe ser un número entero entre 1 y 125" })
                }
                user.EdadU = eNum
            } else {
                user.EdadU = null
            }
        }

        if (req.body.EstadoU !== undefined) {
            const estadosValidos = ['Activo', 'Bloqueado', 'Inactivo']
            if (!estadosValidos.includes(req.body.EstadoU)) {
                return res.status(400).json({ ok: false, codigo: 'F4', message: "Estado no válido. Valores admitidos: Activo, Bloqueado, Inactivo" })
            }
            user.EstadoU = req.body.EstadoU
        }

        if (req.body.IDPlanes !== undefined || req.body.idPlan !== undefined) {
            const pId = req.body.IDPlanes !== undefined ? req.body.IDPlanes : req.body.idPlan
            user.IDPlanes = pId ? Number(pId) : null
        }

        // Si se envió nueva contraseña, actualizarla hasheada
        if (req.body.password || req.body.Password) {
            const pwd = String(req.body.password || req.body.Password)
            if (pwd.length < 6) {
                return res.status(400).json({ ok: false, codigo: 'F4', message: "La contraseña debe tener un mínimo de 6 caracteres" })
            }
            user.Password = await bcrypt.hash(pwd, 10)
        }

        // Actualizar rol si fue provisto
        let rolActualizado = null
        if (req.body.rol || req.body.IDRol) {
            const rolParam = req.body.rol || req.body.IDRol
            let rolObj = null
            if (typeof rolParam === 'number' || !isNaN(Number(rolParam))) {
                rolObj = await Rol.findByPk(Number(rolParam))
            } else if (typeof rolParam === 'string') {
                rolObj = await Rol.findOne({ where: { DescripcionR: rolParam } })
            }
            if (rolObj) {
                await user.setRols([rolObj])
                rolActualizado = rolObj.DescripcionR
            }
        }

        await user.save()

        // CU001 - Paso 6: Se usa el Dígito Verificador (DVH y DVV de Usuario)
        await calcularDV('Usuario')

        // CU001 - Paso 7 y 8: Registro en bitácora con cálculo de DVH y DVV de Bitácora
        await registrarBitacora(req, {
            proceso: 'CU001 - Gestionar usuarios',
            modulo: 'Usuarios',
            accion: 'Modificar usuario',
            detalle: `Se modificaron los datos del usuario ${user.NomApeU} (DNI ${user.DNIUsuario})`
        })
        await calcularDV('Bitacora')

        return res.status(200).json({
            ok: true,
            message: "La información del usuario fue actualizada correctamente",
            usuario: {
                DNIUsuario: user.DNIUsuario,
                NomApeU: user.NomApeU,
                Email: user.Email,
                EdadU: user.EdadU,
                EstadoU: user.EstadoU,
                IDPlanes: user.IDPlanes,
                Rol: rolActualizado
            }
        })
    } catch (error) {
        // Flujo Alternativo F 6: Ocurre un error al guardar los cambios.
        return res.status(500).json({
            ok: false,
            codigo: 'F6',
            message: "Ocurrió un error al guardar los cambios en la base de datos",
            error: error.message
        })
    }
}

// CU001 - Acción: Bloquear / Desbloquear Usuario
const bloquearUser = async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (!id || isNaN(id)) {
            return res.status(400).json({ ok: false, codigo: 'F4', message: "Identificador de usuario no válido" })
        }

        const user = await Usuario.findByPk(id)
        // Flujo Alternativo F 3: El usuario seleccionado no existe.
        if (!user) {
            return res.status(404).json({ ok: false, codigo: 'F3', message: `El usuario seleccionado con DNI ${req.params.id} no existe` })
        }

        // Evitar que el administrador se bloquee a sí mismo
        if (req.user?.DNIUsuario && Number(req.user.DNIUsuario) === id) {
            return res.status(400).json({ ok: false, codigo: 'F4', message: "No podés bloquear tu propia cuenta de administrador" })
        }

        let nuevoEstado = 'Bloqueado'
        if (req.body.estado && ['Activo', 'Bloqueado', 'Inactivo'].includes(req.body.estado)) {
            nuevoEstado = req.body.estado
        } else if (user.EstadoU === 'Bloqueado') {
            nuevoEstado = 'Activo'
        }

        user.EstadoU = nuevoEstado
        await user.save()

        // CU001 - Paso 6: Se usa el Dígito Verificador (DVH y DVV de Usuario)
        await calcularDV('Usuario')

        // CU001 - Paso 7 y 8: Registro en bitácora con cálculo de DVH y DVV de Bitácora
        const accionDesc = nuevoEstado === 'Bloqueado' ? 'Bloquear usuario' : 'Desbloquear usuario'
        await registrarBitacora(req, {
            proceso: 'CU001 - Gestionar usuarios',
            modulo: 'Usuarios',
            accion: accionDesc,
            detalle: `Se cambió el estado del usuario ${user.NomApeU} (DNI ${user.DNIUsuario}) a '${nuevoEstado}'`
        })
        await calcularDV('Bitacora')

        return res.status(200).json({
            ok: true,
            message: `El usuario fue ${nuevoEstado === 'Bloqueado' ? 'bloqueado' : 'desbloqueado'} correctamente`,
            usuario: {
                DNIUsuario: user.DNIUsuario,
                NomApeU: user.NomApeU,
                EstadoU: user.EstadoU
            }
        })
    } catch (error) {
        // Flujo Alternativo F 6: Ocurre un error al guardar los cambios.
        return res.status(500).json({
            ok: false,
            codigo: 'F6',
            message: "Ocurrió un error al guardar los cambios en la base de datos",
            error: error.message
        })
    }
}

// CU001 - Acción: Eliminar Usuario (Borrado Lógico)
const deleteUser = async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (!id || isNaN(id)) {
            return res.status(400).json({ ok: false, codigo: 'F4', message: "Identificador de usuario no válido" })
        }

        const user = await Usuario.findByPk(id)
        // Flujo Alternativo F 3: El usuario seleccionado no existe.
        if (!user) {
            return res.status(404).json({ ok: false, codigo: 'F3', message: `El usuario seleccionado con DNI ${req.params.id} no existe` })
        }

        // Evitar que el administrador se elimine a sí mismo
        if (req.user?.DNIUsuario && Number(req.user.DNIUsuario) === id) {
            return res.status(400).json({ ok: false, codigo: 'F4', message: "No podés eliminar tu propia cuenta de administrador" })
        }

        if (user.EstadoU && user.EstadoU.toLowerCase() === 'inactivo') {
            return res.status(400).json({ ok: false, codigo: 'F4', message: "El usuario ya se encuentra dado de baja (Inactivo)" })
        }

        // Borrado lógico: se preservan todos los datos intactos y se actualiza a Inactivo
        user.EstadoU = 'Inactivo'
        await user.save()

        // CU001 - Paso 6: Se usa el Dígito Verificador (DVH y DVV de Usuario)
        await calcularDV('Usuario')

        // CU001 - Paso 7 y 8: Registro en bitácora con cálculo de DVH y DVV de Bitácora
        await registrarBitacora(req, {
            proceso: 'CU001 - Gestionar usuarios',
            modulo: 'Usuarios',
            accion: 'Eliminar usuario',
            detalle: `Se dio de baja (borrado lógico) al usuario ${user.NomApeU} (DNI ${user.DNIUsuario})`
        })
        await calcularDV('Bitacora')

        return res.status(200).json({
            ok: true,
            message: "Usuario eliminado correctamente del sistema (borrado lógico)",
            usuario: {
                DNIUsuario: user.DNIUsuario,
                NomApeU: user.NomApeU,
                EstadoU: user.EstadoU
            }
        })
    } catch (error) {
        // Flujo Alternativo F 6: Ocurre un error al guardar los cambios.
        return res.status(500).json({
            ok: false,
            codigo: 'F6',
            message: "Ocurrió un error al guardar los cambios en la base de datos",
            error: error.message
        })
    }
}

// CU001 - Acción complementaria: Reactivar Usuario
const reactivarUser = async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (!id || isNaN(id)) {
            return res.status(400).json({ ok: false, codigo: 'F4', message: "Identificador de usuario no válido" })
        }

        const user = await Usuario.findByPk(id)
        if (!user) {
            return res.status(404).json({ ok: false, codigo: 'F3', message: `El usuario seleccionado con DNI ${req.params.id} no existe` })
        }

        user.EstadoU = 'Activo'
        await user.save()

        await calcularDV('Usuario')
        await registrarBitacora(req, {
            proceso: 'CU001 - Gestionar usuarios',
            modulo: 'Usuarios',
            accion: 'Reactivar usuario',
            detalle: `Se reactivó al usuario ${user.NomApeU} (DNI ${user.DNIUsuario}) a estado Activo`
        })
        await calcularDV('Bitacora')

        return res.status(200).json({
            ok: true,
            message: "Usuario reactivado correctamente a estado Activo",
            usuario: {
                DNIUsuario: user.DNIUsuario,
                NomApeU: user.NomApeU,
                EstadoU: user.EstadoU
            }
        })
    } catch (error) {
        return res.status(500).json({
            ok: false,
            codigo: 'F6',
            message: "Ocurrió un error al guardar los cambios en la base de datos",
            error: error.message
        })
    }
}

// Iniciar sesión
const login = async (req, res) => {
    try {
        const email = (req.body.Email || req.body.email || '').trim()
        const password = req.body.Password || req.body.password

        if (!email || !password) {
            return res.status(400).json({ message: "Email y contraseña son obligatorios" })
        }

        const usuario = await Usuario.findOne({
            where: { Email: email },
            include: [{ model: Rol, attributes: ['IDRol', 'DescripcionR'], through: { attributes: [] }, required: false }]
        })

        if (!usuario) {
            return res.status(401).json({ message: "Credenciales inválidas" })
        }

        const match = await bcrypt.compare(password, usuario.Password)
        if (!match) {
            return res.status(401).json({ message: "Credenciales inválidas" })
        }

        if (usuario.EstadoU && (usuario.EstadoU.toLowerCase() === "inactivo" || usuario.EstadoU.toLowerCase() === "bloqueado")) {
            return res.status(403).json({
                message: usuario.EstadoU.toLowerCase() === "bloqueado"
                    ? "Tu cuenta ha sido bloqueada por un administrador"
                    : "Tu cuenta está inactiva"
            })
        }

        const esAdmin = usuario.Rols?.some(r => r.DescripcionR === 'Administrador')
        const rolPrincipal = esAdmin ? 'Administrador' : (usuario.Rols?.[0]?.DescripcionR || 'Paciente')
        const sesion = await crearSesion(usuario.DNIUsuario)
        const token = jwt.sign(
            { DNIUsuario: usuario.DNIUsuario, Email: usuario.Email, sid: sesion.IDSesion, rol: rolPrincipal },
            process.env.JWT_SECRET || "secreto_hospital",
            { expiresIn: "2h" }
        )

        res.status(200).json({
            message: "Login exitoso",
            token,
            usuario: {
                DNIUsuario: usuario.DNIUsuario,
                NomApeU: usuario.NomApeU,
                Email: usuario.Email,
                EstadoU: usuario.EstadoU,
                rol: rolPrincipal,
                roles: usuario.Rols || []
            }
        })
    } catch (error) {
        res.status(500).json({ message: "Error al iniciar sesión", error: error.message })
    }
}

// Controlador específico para Cambiar Datos del Perfil
const cambiarDatos = async (req, res) => {
    try {
        const dni = req.usuario?.DNIUsuario || Number(req.params.id)
        if (!dni || isNaN(dni)) {
            return res.status(400).json({ message: "Identificador de usuario no válido" })
        }

        const user = await Usuario.findByPk(dni)
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" })
        }

        // DATOS PERMITIDOS PARA EDITAR EN PERFIL:
        const { NomApeU, Email, EdadU } = req.body

        // Validación de Nombre y Apellido
        if (NomApeU !== undefined) {
            const nombreLimpio = String(NomApeU).trim()
            if (!nombreLimpio) {
                return res.status(400).json({ message: "El nombre y apellido no pueden estar vacíos" })
            }
            user.NomApeU = nombreLimpio
        }

        // Validación de Correo Electrónico
        if (Email !== undefined) {
            const emailLimpio = String(Email).trim()
            if (!emailLimpio) {
                return res.status(400).json({ message: "El correo electrónico es obligatorio" })
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
                return res.status(400).json({ message: "El formato del correo electrónico no es válido" })
            }

            // Comprobar que otro usuario no esté usando ya este email
            if (emailLimpio.toLowerCase() !== user.Email.toLowerCase()) {
                const yaExiste = await Usuario.findOne({ where: { Email: emailLimpio } })
                if (yaExiste && yaExiste.DNIUsuario !== dni) {
                    return res.status(409).json({ message: "El correo electrónico ya está registrado por otro usuario" })
                }
            }
            user.Email = emailLimpio
        }

        // Validación de Edad
        if (EdadU !== undefined) {
            if (EdadU === null || EdadU === '') {
                user.EdadU = null
            } else {
                const edadNum = Number(EdadU)
                if (isNaN(edadNum) || edadNum < 1 || edadNum > 125) {
                    return res.status(400).json({ message: "La edad debe ser un número entero entre 1 y 125" })
                }
                user.EdadU = edadNum
            }
        }

        await user.save()

        res.status(200).json({
            message: "Datos del perfil actualizados correctamente",
            usuario: {
                DNIUsuario: user.DNIUsuario,
                NomApeU: user.NomApeU,
                Email: user.Email,
                EdadU: user.EdadU,
                EstadoU: user.EstadoU,
                IDPlanes: user.IDPlanes
            }
        })
    } catch (error) {
        console.error("Error en cambiarDatos:", error)
        res.status(500).json({ message: "Error al actualizar los datos del perfil", error: error.message })
    }
}

module.exports = {
    getUsers,
    getUserByID,
    createUser,
    register,
    putUser,
    bloquearUser,
    reactivarUser,
    cambiarDatos,
    deleteUser,
    login
}