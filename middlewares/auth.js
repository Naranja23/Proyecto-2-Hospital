const authMiddleware = require('./auth.middleware.js')

module.exports = authMiddleware.auth
module.exports.auth = authMiddleware.auth
module.exports.soloAdmin = authMiddleware.soloAdmin
module.exports.verificarSesion = authMiddleware.verificarSesion

