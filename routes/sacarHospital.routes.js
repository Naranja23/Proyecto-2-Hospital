const express = require('express');
const router = express.Router();
const { auth, soloAdmin } = require('../middlewares/auth.middleware');
const { obtener, eliminar } = require('../controllers/hospital.sacar.controller');

router.get('/:id', auth, obtener);
router.delete('/:id', auth, soloAdmin, eliminar);

module.exports = router;
