const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { obtener, eliminar } = require('../controllers/sacarHospital.controller');

router.get('/:id', auth, obtener);
router.delete('/:id', auth, eliminar);

module.exports = router;
