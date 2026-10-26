const { Router } = require('express')
<<<<<<< HEAD
const { auth, soloAdmin } = require('../middlewares/auth.middleware.js')
const { verificarIntegridad, rectificarIntegridad } = require('../controllers/Integridad.controller.js')
=======
const { auth } = require('../middlewares/auth.middleware.js')
const { verificarIntegridad, rectificarIntegridad ,} = require('../controllers/Integridad.controller.js')
const { desbloquearHospital ,} = require('../controllers/Seguridad.controller.js')

>>>>>>> 9cc7c8c (eso)
const routes = Router()








routes.patch('/hospitales/:id/desbloquear', auth, desbloquearHospital)
routes.get('/integridad', auth, verificarIntegridad)
routes.post('/integridad/rectificar', auth, rectificarIntegridad)
routes.patch('/hospitales/:id/desbloquear', soloAdmin, desbloquearHospital)
module.exports = routes