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
const { auth, soloAdmin } = require('../middlewares/auth.middleware.js')
const { cerrarSesion } = require('../controllers/Sesion.controller.js')


routes.get('/', auth, getUsers)
routes.get('/:id', auth, getUserByID)
routes.post('/', auth, soloAdmin, createUser)   // solo admin crea usuarios
routes.post('/register', register)              // registro público sin auth
routes.post('/login', login)
routes.put('/perfil', auth, cambiarDatos)       // el propio usuario edita su perfil
routes.put('/cambiar-datos', auth, cambiarDatos)
routes.put('/:id', auth, soloAdmin, putUser)    // solo admin modifica otros usuarios
routes.delete('/:id', auth, soloAdmin, deleteUser) // solo admin bloquea usuarios
routes.post('/logout', auth, cerrarSesion)

module.exports = routes