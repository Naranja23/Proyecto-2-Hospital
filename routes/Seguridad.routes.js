const { Router } = require('express')
const { auth, soloAdmin } = require('../middlewares/auth.middleware.js')
const { verificarIntegridad, rectificarIntegridad } = require('../controllers/Integridad.controller.js')
const { desbloquearHospital } = require('../controllers/Seguridad.controller.js')

const routes = Router()

routes.get('/integridad', auth, verificarIntegridad)
routes.post('/integridad/rectificar', auth, rectificarIntegridad)
routes.patch('/hospitales/:id/desbloquear', auth, soloAdmin, desbloquearHospital)

module.exports = routes