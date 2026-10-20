const { Router } = require('express')
const { auth } = require('../middlewares/auth.middleware.js')
const { verPlanes, administrarPlan, cambiarPlan, eliminarPlan } = require('../controllers/Plan.controller.js')
const routes = Router()
routes.get('/',auth,verPlanes)
routes.get('/actual', auth, administrarPlan)
routes.put('/actual', auth, cambiarPlan)
routes.delete('/actual', auth, eliminarPlan)
module.exports = routes