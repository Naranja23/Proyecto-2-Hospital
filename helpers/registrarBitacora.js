const { Bitacora } = require('../models/Bitacora.Model')

module.exports = async function registrarBitacora(req, data = {}, transaction) {
  let nombreUsuario = 'Anónimo';
  
  if (req && req.user) {
    if (typeof req.user.nombre === 'string') {
      nombreUsuario = req.user.nombre;
    } else if (typeof req.user.usuario === 'string') {
      nombreUsuario = req.user.usuario;
    } else if (req.user.NomApeU) {
      nombreUsuario = req.user.NomApeU;
    } else if (req.user.DNIUsuario) {
      nombreUsuario = String(req.user.DNIUsuario);
    } else if (req.user.id) {
      nombreUsuario = String(req.user.id);
    }
  } else if (req && req.usuario) {
    if (req.usuario.DNIUsuario) {
      nombreUsuario = String(req.usuario.DNIUsuario);
    } else if (req.usuario.NomApeU) {
      nombreUsuario = req.usuario.NomApeU;
    }
  }

  const proceso = data.proceso || data.accion || data.modulo || 'Operación';
  let explicacion = data.explicacion;
  if (!explicacion) {
    if (data.detalle) {
      explicacion = data.modulo ? `[${data.modulo}] ${data.detalle}` : data.detalle;
    } else if (data.accion) {
      explicacion = data.modulo ? `${data.modulo}: ${data.accion}` : data.accion;
    } else {
      explicacion = proceso;
    }
  }

  const now = new Date();
  await Bitacora.create(
    {
      Anio: now.getFullYear(),
      Dia: now.getDate(),
      Hora: now.getHours(),
      Min: now.getMinutes(),
      Seg: now.getSeconds(),
      Ms: now.getMilliseconds(),
      Proceso: String(proceso),
      Explicacion: String(explicacion || ''),
      Usuario: String(nombreUsuario),
      DVH: null
    },
    transaction ? { transaction } : undefined
  );
};
