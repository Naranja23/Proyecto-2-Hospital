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

const routes = Router()
const { auth } = require('../controllers/Seguridad.controller.js')
const { cerrarSesion } = require('../controllers/Sesion.controller.js')


routes.get('/', getUsers)
routes.get('/:id', getUserByID)
routes.post('/', createUser)
routes.post('/register', register)
routes.post('/login', login)
routes.put('/:id', putUser)
routes.delete('/:id', deleteUser)
routes.post('/logout', auth, cerrarSesion)

module.exports = routes