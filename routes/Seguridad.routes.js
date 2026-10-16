const { Router } = require('express')
const { auth } = require('../controllers/Seguridad.controller.js')
const { verificarIntegridad, rectificarIntegridad } = require('../controllers/Integridad.controller.js')
const routes = Router()
routes.get('/integridad', auth, verificarIntegridad)
routes.post('/integridad/rectificar', auth, rectificarIntegridad)
module.exports = routes