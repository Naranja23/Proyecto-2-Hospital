const jwt = require('jsonwebtoken')

/**
 * Middleware: valida la autenticación únicamente con el token JWT y su expiración
 */
async function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '')
    const p = jwt.verify(token, process.env.JWT_SECRET || 'secreto_hospital')
    req.usuario = p // { DNIUsuario, Email, sid }
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' })
  }
}

module.exports = { auth }
