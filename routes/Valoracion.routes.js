const { Router } = require('express')
const { auth } = require('../middlewares/auth.middleware.js')
const { verPromedioHospital, verMisValoraciones, editarValoracion } = require('../controllers/Valoraciones.controller.js')

const routes = Router()
routes.get('/hospital/:idHospital/promedio', auth, verPromedioHospital)
routes.get('/mis', auth, verMisValoraciones)
routes.put('/:idValoracion', auth, editarValoracion)

module.exports = routes