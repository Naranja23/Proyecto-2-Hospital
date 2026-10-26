const express = require('express')
const controller = require('../controllers/Especialidad.controller.js')
const { auth, soloAdmin } = require('../middlewares/auth.middleware.js')

const router = express.Router()

router.get('/', auth, controller.listar)
router.get('/medicos', auth, soloAdmin, controller.listarMedicos)
router.post('/', auth, soloAdmin, controller.crear)
router.put('/:id/medicos', auth, soloAdmin, controller.asignarMedicos)
router.put('/:id', auth, soloAdmin, controller.actualizar)
router.delete('/:id', auth, soloAdmin, controller.eliminar)

module.exports = router