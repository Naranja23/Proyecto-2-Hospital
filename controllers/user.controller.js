const { Usuario } = require('../models/index.model.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
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
            password,
            NomApeU,
            DNIUsuario,
            Email,
            Password,
            EdadU
        } = req.body

        const nomApe = (NomApeU || `${nombre || ''} ${apellido || ''}`).trim()
        const dniFinal = Number(DNIUsuario || dni)
        const emailFinal = (Email || email || '').trim().toLowerCase()
        const passwordFinal = Password || password

        if (!dniFinal || isNaN(dniFinal)) {
            return res.status(400).json({ message: "El DNI es obligatorio y debe ser numérico" })
        }
        if (!nomApe) {
            return res.status(400).json({ message: "El nombre y apellido son obligatorios" })
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
            return res.status(400).json({ message: "El correo electrónico ya está registrado" })
        }

        // Verificar si el DNI ya existe
        const userPorDni = await Usuario.findByPk(dniFinal)
        if (userPorDni) {
            return res.status(400).json({ message: "El DNI ya está registrado" })
        }

        // Calcular edad si se pasó fechaNacimiento
        let edadCalculada = EdadU || null
        if (!edadCalculada && fechaNacimiento) {
            const fecha = new Date(fechaNacimiento)
            if (!isNaN(fecha.getTime())) {
                const dif = Date.now() - fecha.getTime()
                edadCalculada = Math.abs(new Date(dif).getUTCFullYear() - 1970)
            }
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(passwordFinal, 10)

        const nuevoUsuario = await Usuario.create({
            DNIUsuario: dniFinal,
            NomApeU: nomApe,
            Email: emailFinal,
            Password: hashedPassword,
            EdadU: edadCalculada,
            EstadoU: 'Activo'
        })

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
        if (req.body.EdadU || req.body.edad) {
            user.EdadU = Number(req.body.EdadU || req.body.edad)
        }
        if (req.body.EstadoU) {
            user.EstadoU = req.body.EstadoU
        }

        await user.save()
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

module.exports = {
    getUsers,
    getUserByID,
    createUser: register,
    register,
    putUser,
    deleteUser,
    login
}