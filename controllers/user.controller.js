const { Usuario } = require('../models/index.model.js') 
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')



const getUsers = async(req, res)=>{
    try {
        const users = await User.findAll()
        if (users.length === 0){
            return res.status(404).json("Usuarios no encontrados")
        }
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json(error)
    }
}

const getUserByID = async(req, res)=>{
    try {
        const user = await User.findByPk(Number(req.params.id))
        if(!user){
            return res.status(404).json({ message: `Usuario con el ID ${req.params.id} no encontrado`})
        }
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json(error)
    }
}

const createUser = async(req, res)=>{
    try {
        const newUser = await User.create({ firstname: req.body.firstname, lastname: req.body.lastname, dni: req.body.dni })
        res.status(201).json(newUser)
    } catch (error) {
        res.status(500).json(error)
    }
}

const putUser = async(req, res)=>{
    try {
        const user = await User.findByPk(Number(req.params.id))
        if (!user){
            return res.status(404).json(`El usuario con el ID ${req.params.id} no fue encontrado`)
        }
        user.firstname = req.body.firstname
        user.lastname = req.body.lastname
        user.dni = req.body.dni

        await user.save()
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json(error)
    }
}

const deleteUser = async(req, res)=>{
    try {
        const deletedUser = await User.findByPk(Number(req.params.id))
        if (!deletedUser){
            return res.status(404).json(`El usuario con el ID ${req.params.id} no fue encontrado`)
        }
        await deletedUser.destroy()

        res.status(200).json({ message: "Usuario eliminado con éxito "})
    } catch (error) {
        res.status(500).json(error)
    }
}

const login = async (req, res) => {
    try {
        const { Email, Password } = req.body

        if (!Email || !Password) {
            return res.status(400).json({ message: "Email y contraseña son obligatorios" })
        }

        const usuario = await Usuario.findOne({ where: { Email } })
        if (!usuario) {
            
            return res.status(401).json({ message: "Credenciales inválidas" })
        }

        const match = await bcrypt.compare(Password, usuario.Password)
        if (!match) {
            return res.status(401).json({ message: "Credenciales inválidas" })
        }

        if (usuario.EstadoU && usuario.EstadoU.toLowerCase() === "inactivo") {
            return res.status(403).json({ message: "Tu cuenta está inactiva" })
        }

        const token = jwt.sign(
            { DNIUsuario: usuario.DNIUsuario, Email: usuario.Email },
            process.env.JWT_SECRET || "secreto_hospital",
            { expiresIn: "1h" }
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
    createUser,
    putUser,
    deleteUser,
    login
}