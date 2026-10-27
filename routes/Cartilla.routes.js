// RUTAS CU006: conectan URLs HTTP con las funciones del controlador de cartilla.

const router = require('express').Router();
const ctrl = require('../controllers/Cartilla.controller');
const { auth, soloAdmin } = require('../middlewares/auth.middleware');

// Actor principal: Administrador con sesión iniciada
router.use(auth, soloAdmin);

router.get('/obras-sociales', ctrl.listarObrasSociales); // va antes de '/:prepagaId'
router.get('/:prepagaId', ctrl.obtener);                 // CU006
router.put('/:prepagaId', ctrl.actualizar);              // CU006

module.exports = router;
