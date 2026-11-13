const { Router } = require("express")
const {
    getUsers,
    getUserByID,
    createUser,
    register,
    putUser,
    bloquearUser,
    reactivarUser,
    cambiarDatos,
    deleteUser,
    login
} = require('../controllers/user.controller.js')

const routes = Router()
const { auth, soloAdmin } = require('../middlewares/auth.middleware.js')
const { cerrarSesion } = require('../controllers/Sesion.controller.js')

// CU001 - Gestionar usuarios (Solo Administrador con sesión activa)
routes.get('/', auth, soloAdmin, getUsers)
routes.get('/:id', auth, getUserByID)
routes.post('/', auth, soloAdmin, createUser)
routes.put('/:id/bloquear', auth, soloAdmin, bloquearUser)
routes.patch('/:id/bloquear', auth, soloAdmin, bloquearUser)
routes.put('/:id/reactivar', auth, soloAdmin, reactivarUser)
routes.patch('/:id/reactivar', auth, soloAdmin, reactivarUser)
routes.put('/:id', auth, soloAdmin, putUser)
routes.delete('/:id', auth, soloAdmin, deleteUser)

// Endpoints públicos o de perfil propio
routes.post('/register', register)
routes.post('/login', login)
routes.put('/perfil', auth, cambiarDatos)
routes.put('/cambiar-datos', auth, cambiarDatos)
routes.post('/logout', auth, cerrarSesion)

module.exports = routes