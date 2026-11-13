require('dotenv').config()
const express = require('express')
const cors = require('cors')
const server = express()
const integridad = require('./controllers/Integridad.controller.js')
const { DataTypes } = require('sequelize')
require('./models/index.model.js')
const { sequelize } = require('./config/db.js')
// Para el gestionar Medicas
const especialidades = require('./controllers/Especialidad.controller.js')
const panel = require('./controllers/panel.controller.js')

const { interceptorCasoDeUsoGlobal } = require('./controllers/Dvv y Dvh.js')
const { middlewareModoMonousuario } = require('./controllers/Respaldo.controller.js')

server.use(cors())
server.use(express.json())
server.use(middlewareModoMonousuario)
server.use(interceptorCasoDeUsoGlobal)

server.get('/', (req, res) => res.status(200).json({ message: 'El server está ON' }))
server.use('/users', require('./routes/user.routes.js'))
// ---- las líneas de cada CU van acá ----
server.use('/seguridad', require('./routes/Seguridad.routes.js'))
server.use('/turnos', require('./routes/Cita.routes.js'))
server.use('/planes', require('./routes/Plan.routes.js'))
server.use('/valoraciones', require('./routes/Valoracion.routes.js'))
server.use('/especialidades', require('./routes/Especialidad.routes.js'))
server.use('/buscador', require('./routes/Buscador.routes'))
server.use('/panel', require('./routes/panel.routes.js'))
server.use('/hospitales', require('./routes/Hospital.routes.js'))
server.use('/bloquear-hospital', require('./routes/bloquearHospital.routes.js'))
server.use('/sacar-hospital', require('./routes/sacarHospital.routes.js'))
server.use('/cartilla', require('./routes/Cartilla.routes.js'))
server.use('/respaldos', require('./routes/Respaldo.routes.js'))

const PORT = 3000
const iniciar = async () => {
  await sequelize.authenticate()
  await sequelize.sync({ alter: true })
  // sin force: no borra la base
  await especialidades.migrarEspecialidadesLegadas()
  // ---- CU013 agrega acá la verificación al arrancar ----
  const r = await integridad.verificar()
  console.log('Integridad BD:', r.ok ? 'OK' : r.errores)
  server.listen(PORT, () => console.log('El server está ON'))
}
if (require.main === module) iniciar()
module.exports = { server, iniciar }
