const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/Respaldo.controller.js');
const { auth, soloAdmin } = require('../middlewares/auth.middleware.js');

// Actor Principal: Administrador de Base de Datos (DBA) / Administrador con sesión activa
router.use(auth, soloAdmin);

// Paso 4 / Flujo F4: Verificar espacio y permisos en la ubicación
router.get('/espacio', ctrl.verificarEspacioYPermisos);

// Estado de modo monousuario
router.get('/estado', (req, res) => {
  return res.status(200).json({ ok: true, ...ctrl.getEstadoMonousuario() });
});

// Paso 1 a 10: Ejecutar el caso de uso CU004 - Hacer respaldo
router.post('/', ctrl.hacerRespaldo);
router.post('/generar', ctrl.hacerRespaldo);

// Listar historial de respaldos disponibles
router.get('/', ctrl.listarRespaldos);

// Descargar archivo de respaldo
router.get('/descargar/:nombre', ctrl.descargarRespaldo);

// Eliminar copia de seguridad
router.delete('/:nombre', ctrl.eliminarRespaldo);

module.exports = router;

