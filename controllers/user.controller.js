const { User, Hobby } = require('../models/index.js')
const { Op } = require('sequelize')

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



module.exports = {
    getUsers,
    getUserByID,
    createUser,
    putUser,
    deleteUser
}