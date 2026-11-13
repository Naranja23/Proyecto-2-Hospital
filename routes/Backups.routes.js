const express = require('express')
const controller = require('../controllers/Backups.controller.js')
const { auth, soloAdmin } = require('../middlewares/auth.middleware.js')

const router = express.Router()

router.use(auth, soloAdmin)

router.get('/', controller.obtener)
router.put('/', controller.guardar)
router.post('/ejecutar', controller.ejecutarAhora)

module.exports = router