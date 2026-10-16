const { Router } = require("express")
const { getUsers, getUserByID, createUser, putUser, deleteUser, login } = require('../controllers/user.controller.js')

const routes = Router()
const { auth } = require('../controllers/Seguridad.controller.js')
const { cerrarSesion } = require('../controllers/Sesion.controller.js')


routes.get('/', getUsers)
routes.get('/:id', getUserByID)
routes.post('/', createUser)
routes.put('/:id', putUser)
routes.delete('/:id', deleteUser)
routes.post('/login', login)
routes.post('/logout', auth, cerrarSesion)

module.exports = routes