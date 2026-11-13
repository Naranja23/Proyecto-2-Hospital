const router = require('express').Router();
const ctrl = require('../controllers/Cartilla.controller');
const { auth, soloAdmin } = require('../middlewares/auth.middleware');

// Listar obras sociales para selector
router.get('/obras-sociales', auth, ctrl.listarObrasSociales);

// CU006 - Obtener cartilla de una obra social
router.get('/:prepagaId', auth, ctrl.obtener);

// CU006 - Actualizar cartilla de una obra social
router.put('/:prepagaId', auth, soloAdmin, ctrl.actualizar);

module.exports = router;
