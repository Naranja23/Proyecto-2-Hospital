const { Router } = require('express')
const { auth } = require('../middlewares/auth.middleware.js')
const { obtenerPanel } = require('../controllers/panel.controller.js')

const routes = Router()

// Sin soloAdmin a propósito: el permiso se verifica en el controller para poder registrar F1 en la bitácora
routes.get('/', auth, obtenerPanel)

module.exports = routes