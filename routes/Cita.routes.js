const { Router } = require('express')
const { auth } = require('../middlewares/auth.middleware.js')
const { sacarTurno, reservarTurno, verHistorial, calificarTurno   } = require('../controllers/Citas.controller.js')
const routes = Router()

routes.post('/buscar', auth, sacarTurno)
routes.post('/reservar', auth, reservarTurno)
routes.get('/historial', auth, verHistorial)
routes.put('/calificar', auth, calificarTurno)
module.exports = routes
