const { Router } = require('express')
const { auth } = require('../controllers/Seguridad.controller.js')
const { sacarTurno, reservarTurno } = require('../controllers/Citas.controller.js')
<<<<<<< HEAD:routes/Cita.route.js
=======

>>>>>>> c611a53 (dependency and update application controllers and routes):routes/Cita.routes.js
const routes = Router()

routes.post('/buscar', auth, sacarTurno)
routes.post('/reservar', auth, reservarTurno)

module.exports = routes
