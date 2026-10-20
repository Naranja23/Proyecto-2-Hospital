const { Usuario } = require('../models/index.model.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const seguridad = require('./Seguridad.controller.js')
const { crearSesion } = require('./Sesion.controller.js')


const getUsers = async(req, res)=>{
    try {
        const users = await Usuario.findAll({
            attributes: { exclude: ['Password'] }
        })
        if (users.length === 0) {
            return res.status(404).json({ message: "Usuarios no encontrados" })
        }
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({ message: "Error al obtener usuarios", error: error.message })
    }
}

// Obtener usuario por ID (DNIUsuario)
const getUserByID = async (req, res) => {
    try {
        const id = Number(req.params.id)
        const user = await Usuario.findByPk(id, {
            attributes: { exclude: ['Password'] }
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
        const {
            nombre,
            apellido,
            dni,
            fechaNacimiento,
            email,
            password
        } = req.body

        if (!nombre?.trim() || !apellido?.trim()) {
            return res.status(400).json({ message: "El nombre y el apellido son obligatorios" })
        }

        const nomApe = `${nombre.trim()} ${apellido.trim()}`
        const dniFinal = Number(dni)
        const emailFinal = (email || '').trim().toLowerCase()

        if (!dniFinal || isNaN(dniFinal)) {
            return res.status(400).json({ message: "El DNI es obligatorio y debe ser numérico" })
        }
        if (!emailFinal) {
            return res.status(400).json({ message: "El correo electrónico es obligatorio" })
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: "La contraseña es obligatoria (mínimo 6 caracteres)" })
        }

        // Verificar si el email ya existe
        const userPorEmail = await Usuario.findOne({ where: { Email: emailFinal } })
        if (userPorEmail) {
            return res.status(400).json({ message: "El correo electrónico ya está registrado" })
        }

        // Verificar si el DNI ya existe
        const userPorDni = await Usuario.findByPk(dniFinal)
        if (userPorDni) {
            return res.status(400).json({ message: "El DNI ya está registrado" })
        }

        // Calcular edad desde fechaNacimiento
        let edadCalculada = null
        if (fechaNacimiento) {
            const fecha = new Date(fechaNacimiento)
            if (!isNaN(fecha.getTime())) {
                const dif = Date.now() - fecha.getTime()
                edadCalculada = Math.abs(new Date(dif).getUTCFullYear() - 1970)
            }
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10)

        const nuevoUsuario = await Usuario.create({
            DNIUsuario: dniFinal,
            NomApeU: nomApe,
            Email: emailFinal,
            Password: hashedPassword,
            EdadU: edadCalculada,
            EstadoU: 'Activo'
        })
        await seguridad.calcularDV('Usuario')

        res.status(201).json({
            message: "Cuenta creada con éxito",
            usuario: {
                DNIUsuario: nuevoUsuario.DNIUsuario,
                NomApeU: nuevoUsuario.NomApeU,
                Email: nuevoUsuario.Email,
                EstadoU: nuevoUsuario.EstadoU
            }
        })
    } catch (error) {
        res.status(500).json({ message: "Error al registrar usuario", error: error.message })
    }
}

// Modificar usuario
const putUser = async (req, res) => {
    try {
        const user = await Usuario.findByPk(Number(req.params.id))
        if (!user) {
            return res.status(404).json({ message: `El usuario con ID ${req.params.id} no fue encontrado` })
        }

        if (req.body.NomApeU || (req.body.nombre && req.body.apellido)) {
            user.NomApeU = req.body.NomApeU || `${req.body.nombre} ${req.body.apellido}`.trim()
        }
        if (req.body.Email || req.body.email) {
            user.Email = (req.body.Email || req.body.email).trim().toLowerCase()
        }
        if (req.body.EdadU !== undefined || req.body.edad !== undefined) {
            const e = req.body.EdadU !== undefined ? req.body.EdadU : req.body.edad
            user.EdadU = e ? Number(e) : null
        }
        if (req.body.EstadoU) {
            user.EstadoU = req.body.EstadoU
        }

        await user.save()
        await seguridad.calcularDV('Usuario')
        res.status(200).json({ message: "Usuario actualizado", user })
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar usuario", error: error.message })
    }
}

// Eliminar usuario
const deleteUser = async (req, res) => {
    try {
        const deletedUser = await Usuario.findByPk(Number(req.params.id))
        if (!deletedUser) {
            return res.status(404).json({ message: `El usuario con el ID ${req.params.id} no fue encontrado` })
        }
        await deletedUser.destroy()
        await seguridad.calcularDV('Usuario')
        res.status(200).json({ message: "Usuario eliminado con éxito" })
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar usuario", error: error.message })
    }
}

// Iniciar sesión
const login = async (req, res) => {
    try {
        const email = (req.body.Email || req.body.email || '').trim().toLowerCase()
        const password = req.body.Password || req.body.password

        if (!email || !password) {
            return res.status(400).json({ message: "Email y contraseña son obligatorios" })
        }

        const usuario = await Usuario.findOne({ where: { Email: email } })
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

        const sesion = await crearSesion(usuario.DNIUsuario)
        const token = jwt.sign(
            { DNIUsuario: usuario.DNIUsuario, Email: usuario.Email, sid: sesion.IDSesion },
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
                EstadoU: usuario.EstadoU
            }
        })
    } catch (error) {
        res.status(500).json({ message: "Error al iniciar sesión", error: error.message })
    }
}

// Controlador específico para Cambiar Datos del Perfil
// Permite editar datos personales generales y protege los datos críticos
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

        // DATOS CRÍTICOS PROTEGIDOS (NO PERMITIDOS PARA EDICIÓN DE PERFIL):
        // 1. DNIUsuario -> Clave primaria inmutable
        // 2. Password -> Solo se modifica en flujo dedicado de cambio de clave
        // 3. EstadoU -> Estado de la cuenta (solo administradores)
        // 4. IDPlanes -> Cobertura médica (se gestiona desde el módulo de Planes)
        // 5. DVH -> Dígito verificador del sistema de integridad

        // DATOS PERMITIDOS PARA EDITAR:
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
            const emailLimpio = String(Email).trim().toLowerCase()
            if (!emailLimpio) {
                return res.status(400).json({ message: "El correo electrónico es obligatorio" })
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
                return res.status(400).json({ message: "El formato del correo electrónico no es válido" })
            }

            // Comprobar que otro usuario no esté usando ya este email
            if (emailLimpio !== user.Email.toLowerCase()) {
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

        // Guardar cambios y actualizar integridad (DVH y DVV)
        await user.save()
        await seguridad.calcularDV('Usuario')

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