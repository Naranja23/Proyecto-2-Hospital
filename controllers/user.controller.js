const { Usuario, Plan, Rol, Prepaga } = require('../models/index.model.js')
const { Op } = require('sequelize')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { crearSesion } = require('./Sesion.controller.js')

// Obtener todos los usuarios (por defecto solo activos; ?incluirInactivos=true para todos)
const getUsers = async (req, res) => {
    try {
        const { incluirInactivos } = req.query
        const where = {}
        if (incluirInactivos !== 'true') {
            where.EstadoU = { [Op.ne]: 'Inactivo' }
        }

        const users = await Usuario.findAll({
            where,
            attributes: { exclude: ['Password'] },
            include: [
                { model: Plan, attributes: ['IDPlan', 'NombrePlan', 'TipoPlan'], required: false }
            ]
        })
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({ message: "Error al obtener usuarios", error: error.message })
    }
}

// Obtener usuario por ID (DNIUsuario)
const getUserByID = async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "Identificador de usuario no válido" })
        }

        const user = await Usuario.findByPk(id, {
            attributes: { exclude: ['Password'] },
            include: [
                { model: Plan, attributes: ['IDPlan', 'NombrePlan', 'TipoPlan'], required: false },
                { model: Rol, attributes: ['IDRol', 'DescripcionR'], through: { attributes: [] }, required: false }
            ]
        })
        if (!user) {
            return res.status(404).json({ message: `Usuario con el DNI/ID ${req.params.id} no encontrado` })
        }
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ message: "Error al obtener usuario", error: error.message })
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
    } catch (error) {
        res.status(500).json({ message: "Error al registrar usuario", error: error.message })
    }
}

// Modificar usuario
const putUser = async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "Identificador de usuario no válido" })
        }

        const user = await Usuario.findByPk(id)
        if (!user) {
            return res.status(404).json({ message: `El usuario con ID ${req.params.id} no fue encontrado` })
        }

        // Modificar solo los campos provistos, sin alterar los demás
        if (req.body.NomApeU !== undefined) {
            user.NomApeU = String(req.body.NomApeU).trim()
        } else if (req.body.nombre && req.body.apellido) {
            user.NomApeU = `${String(req.body.nombre).trim()} ${String(req.body.apellido).trim()}`
        }

        if (req.body.Email !== undefined || req.body.email !== undefined) {
            const emailLimpio = String(req.body.Email || req.body.email).trim()
            if (emailLimpio.toLowerCase() !== user.Email.toLowerCase()) {
                const yaExiste = await Usuario.findOne({ where: { Email: emailLimpio } })
                if (yaExiste && yaExiste.DNIUsuario !== id) {
                    return res.status(409).json({ message: "El correo electrónico ya está registrado por otro usuario" })
                }
            }
            user.Email = emailLimpio
        }

        if (req.body.EdadU !== undefined || req.body.edad !== undefined) {
            const e = req.body.EdadU !== undefined ? req.body.EdadU : req.body.edad
            user.EdadU = e !== null && e !== '' ? Number(e) : null
        }

        if (req.body.EstadoU !== undefined) {
            user.EstadoU = req.body.EstadoU
        }

        if (req.body.IDPlanes !== undefined || req.body.idPlan !== undefined) {
            user.IDPlanes = req.body.IDPlanes !== undefined ? req.body.IDPlanes : req.body.idPlan
        }

        await user.save()
        res.status(200).json({
            message: "Usuario actualizado",
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
        res.status(500).json({ message: "Error al actualizar usuario", error: error.message })
    }
}

// Eliminar usuario (Borrado lógico)
// Conserva todos los datos del usuario intactos y únicamente modifica su estado a 'Inactivo'
const deleteUser = async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "Identificador de usuario no válido" })
        }

        const user = await Usuario.findByPk(id)
        if (!user) {
            return res.status(404).json({ message: `El usuario con el ID ${req.params.id} no fue encontrado` })
        }

        if (user.EstadoU && user.EstadoU.toLowerCase() === 'inactivo') {
            return res.status(400).json({ message: "El usuario ya se encuentra inactivo" })
        }

        // Borrado lógico: no se tocan los datos (NomApeU, Email, Password, etc.)
        user.EstadoU = 'Inactivo'
        await user.save()

        res.status(200).json({
            message: "Usuario dado de baja exitosamente (borrado lógico)",
            usuario: {
                DNIUsuario: user.DNIUsuario,
                NomApeU: user.NomApeU,
                Email: user.Email,
                EdadU: user.EdadU,
                EstadoU: user.EstadoU
            }
        })
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar usuario", error: error.message })
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

        if (usuario.EstadoU && usuario.EstadoU.toLowerCase() === "inactivo") {
            return res.status(403).json({ message: "Tu cuenta está inactiva" })
        }

        const rolPrincipal = usuario.Rols?.[0]?.DescripcionR || 'Paciente'
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
    createUser: register,
    register,
    putUser,
    cambiarDatos,
    deleteUser,
    login
}