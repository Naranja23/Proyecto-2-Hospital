const { Router } = require('express')
const { auth } = require('../controllers/Seguridad.controller.js')
const { sacarTurno, reservarTurno } = require('../controllers/Citas.controler.js')
const routes = Router()
routes.post('/buscar', auth, sacarTurno)
routes.post('/reservar', auth, reservarTurno)
module.exports = routes