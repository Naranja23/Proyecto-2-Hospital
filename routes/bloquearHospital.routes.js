const express = require('express');
const router = express.Router();
const { auth, soloAdmin } = require('../middlewares/auth.middleware');
const { obtener, bloquear } = require('../controllers/bloquearHospital.controller');
const { Hospital } = require('../models/Hospital.Model');

// Listar hospitales para la vista de bloqueo
router.get('/', auth, async (req, res) => {
  try {
    const hospitales = await Hospital.findAll({ order: [['NombreH', 'ASC']] });
    return res.status(200).json({ ok: true, hospitales });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al listar hospitales' });
  }
});

router.get('/:id', auth, obtener);
router.put('/:id/bloquear', auth, soloAdmin, bloquear);
router.patch('/:id/bloquear', auth, soloAdmin, bloquear);

module.exports = router;
