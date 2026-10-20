const { Router } = require("express")
const {
    getUsers,
    getUserByID,
    createUser,
    register,
    putUser,
    cambiarDatos,
    deleteUser,
    login
} = require('../controllers/user.controller.js')

const routes = Router()
const { auth } = require('../middlewares/auth.middleware.js')
const { cerrarSesion } = require('../controllers/Sesion.controller.js')


routes.get('/', getUsers)
routes.get('/:id', getUserByID)
routes.post('/', createUser)
routes.post('/register', register)
routes.post('/login', login)
routes.put('/perfil', auth, cambiarDatos)
routes.put('/cambiar-datos', auth, cambiarDatos)
routes.put('/:id', cambiarDatos)
routes.delete('/:id', deleteUser)
routes.post('/logout', auth, cerrarSesion)

module.exports = routes