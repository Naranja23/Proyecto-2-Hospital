const { Sesion } = require('../models/index.model.js')
const seguridad = require('./Seguridad.controller.js')
const bitacora = require('./Bitacora.controller.js')

// Lo llama el login: abre una sesión nueva
async function crearSesion(DNIUsuario) {
  const sesion = await Sesion.create({ DNIUsuario, Inicio: new Date() })
  await seguridad.calcularDV('Sesion')
  return sesion
}

// CU016 - Cerrar sesión
const cerrarSesion = async (req, res) => {
  try {
    const s = await Sesion.findByPk(req.usuario.sid)                   // finalizarSesion(idSesion)
    if (!s || s.Fin) throw new Error('Sesión inexistente o ya cerrada')
    await s.update({ Fin: new Date() })
    await seguridad.calcularDV('Sesion')
    await bitacora.registrar('Cierre de sesión', req.usuario.DNIUsuario)
    res.status(200).json({ message: 'Sesión cerrada' })                // el front redirige al login
  } catch (e) {
    await bitacora.registrar('Error al cerrar sesión', req.usuario.DNIUsuario)
    res.status(500).json({ message: 'No fue posible cerrar sesión' })  // la sesión sigue activa
  }
}

module.exports = { crearSesion, cerrarSesion }