const { Router } = require("express")
const {
    getUsers,
    getUserByID,
    createUser,
    register,
    putUser,
    deleteUser,
    login
} = require('../controllers/user.controller.js')
const { Usuario } = require('../models/index.model.js')
const { dvhMiddleware } = require('../controllers/dvh.controller.js')

const actualizarDVHUsuario = dvhMiddleware(Usuario, 'Usuario')

const routes = Router()

routes.get('/', getUsers)
routes.get('/:id', getUserByID)
routes.post('/', createUser, actualizarDVHUsuario)
routes.post('/register', register, actualizarDVHUsuario)
routes.post('/login', login)
routes.put('/:id', putUser, actualizarDVHUsuario)
routes.delete('/:id', deleteUser, actualizarDVHUsuario)

module.exports = routes