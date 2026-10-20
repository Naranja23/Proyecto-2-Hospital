// RUTA CU005: conecta POST /api/hospitales con el controlador de alta.

const router = require('express').Router();
const ctrl = require('../controllers/Hospital.controller');
const { auth, soloAdmin } = require('../middlewares/auth.middleware');

// Actor principal: Administrador con sesión iniciada
router.use(auth, soloAdmin);

router.post('/', ctrl.crear); // CU005

module.exports = router;
