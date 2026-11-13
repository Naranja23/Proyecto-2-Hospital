const jwt = require('jsonwebtoken');

const ROL_ADMIN = 'Administrador';

// 1. Verifica que el token JWT sea válido
function auth(req, res, next) {
  const cabecera = req.headers.authorization;
  
  if (!cabecera) {
    return res.status(401).json({ ok: false, mensaje: 'Tenés que iniciar sesión.' });
  }

  let token = cabecera;
  if (cabecera.startsWith('Bearer ')) {
    token = cabecera.slice(7).trim();
  } else if (cabecera.includes(' ')) {
    token = cabecera.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ ok: false, mensaje: 'Token no encontrado.' });
  }

  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET || 'misecreto');
    req.user = usuario;
    req.usuario = usuario;
    return next();
  } catch (error) {
    return res.status(401).json({ ok: false, mensaje: 'Sesión inválida o expirada.' });
  }
}

// 2. Comprueba que sea Administrador
function soloAdmin(req, res, next) {
  let rolUsuario = '';

  if (req.user && req.user.rol) {
    if (typeof req.user.rol === 'string') {
      rolUsuario = req.user.rol;
    } else if (typeof req.user.rol.nombre === 'string') {
      rolUsuario = req.user.rol.nombre;
    }
  }

  if (rolUsuario !== ROL_ADMIN) {
    const tieneAdmin = Array.isArray(req.user?.roles) && req.user.roles.some((r) =>
      (typeof r === 'string' ? r : r?.DescripcionR) === ROL_ADMIN
    );
    if (!tieneAdmin) {
      return res.status(403).json({ ok: false, mensaje: 'Acceso denegado.' });
    }
  }

  return next();
}

module.exports = { auth, soloAdmin, verificarSesion: auth };
