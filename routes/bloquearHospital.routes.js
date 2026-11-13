const express = require('express');
const router = express.Router();
const { auth, soloAdmin } = require('../middlewares/auth.middleware');
const { obtener, bloquear } = require('../controllers/bloquearHospital.controller');

router.get('/:id', auth, obtener);
router.put('/:id/bloquear', auth, soloAdmin, bloquear);
router.patch('/:id/bloquear', auth, soloAdmin, bloquear);

module.exports = router;
