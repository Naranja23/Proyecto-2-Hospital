const jwt = require('jsonwebtoken');

const ROL_ADMIN = 'Administrador';

// 1. Verifica que el token JWT sea válido
function verificarSesion(req, res, next) {
  const cabecera = req.headers.authorization;
  
  if (!cabecera) {
    return res.status(401).json({ ok: false, mensaje: 'Tenés que iniciar sesión.' });
  }

  const token = cabecera.split(' ')[1]; 
// JavaScript busca el espacio y divide el texto en dos partes:
//[0] -> "Bearer"

//[1] -> "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (el token real)
  
  if (!token) {
    return res.status(401).json({ ok: false, mensaje: 'Token no encontrado.' });
  }

  try {
    const usuario = jwt.verify(token, 'CLAVE_SECRETA'); // Acá ponés tu clave secreta
    req.user = usuario;
    return next();
  } catch (error) {
    return res.status(401).json({ ok: false, mensaje: 'Sesión inválida o expirada.' });
  }
}

// 2. Comprueba que sea Administrador
function soloAdmin(req, res, next) {
  let rolUsuario = '';

  if (typeof req.user.rol === 'string') {
    rolUsuario = req.user.rol;
  } else {
    rolUsuario = req.user.rol.nombre;
  }

  if (rolUsuario !== ROL_ADMIN) {
    return res.status(403).json({ ok: false, mensaje: 'Acceso denegado.' });
  }

  return next();
}

module.exports = { verificarSesion, soloAdmin };