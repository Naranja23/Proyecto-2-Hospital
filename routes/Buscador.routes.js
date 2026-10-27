const express = require('express')
const router = express.Router()
const { auth } = require('../middlewares/auth.middleware')
const { opciones, buscar } = require('../controllers/Buscador.controller')

router.get('/opciones', auth, opciones)
router.get('/buscar', auth, buscar)

module.exports = router