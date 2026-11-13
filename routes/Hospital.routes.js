const router = require('express').Router();
const ctrl = require('../controllers/Hospital.controller');
const { obtener: obtenerSacar, eliminar: eliminarSacar } = require('../controllers/hospital.sacar.controller');
const { bloquear } = require('../controllers/bloquearHospital.controller');
const { desbloquearHospital } = require('../controllers/Seguridad.controller');
const { auth, soloAdmin } = require('../middlewares/auth.middleware');
const { Hospital } = require('../models/Hospital.Model');

// Listar todos los hospitales
router.get('/', async (req, res) => {
  try {
    const hospitales = await Hospital.findAll({ order: [['NombreH', 'ASC']] });
    return res.status(200).json({ ok: true, hospitales });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al listar hospitales' });
  }
});

// CU005 - Alta de hospital
router.post('/', auth, soloAdmin, ctrl.crear);

// Obtener hospital por ID
router.get('/:id', auth, obtenerSacar);

// CU007 - Sacar hospital
router.delete('/:id', auth, soloAdmin, eliminarSacar);

// CU008 - Bloquear hospital
router.put('/:id/bloquear', auth, soloAdmin, bloquear);
router.patch('/:id/bloquear', auth, soloAdmin, bloquear);

// CU023 - Desbloquear hospital
router.patch('/:id/desbloquear', auth, soloAdmin, desbloquearHospital);
router.put('/:id/desbloquear', auth, soloAdmin, desbloquearHospital);

module.exports = router;
