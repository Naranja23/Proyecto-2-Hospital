const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { obtener, bloquear } = require('../controllers/bloquearHospital.controller');

router.get('/:id', auth, obtener);
router.put('/:id/bloquear', auth, bloquear);

module.exports = router;
