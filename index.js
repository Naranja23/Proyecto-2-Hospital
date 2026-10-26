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

server.use(cors())
server.use(express.json())
server.get('/', (req, res) => res.status(200).json({ message: 'El server está ON' }))
server.use('/users', require('./routes/user.routes.js'))
// ---- las líneas de cada CU van acá ----
server.use('/seguridad', require('./routes/Seguridad.routes.js'))
server.use('/turnos', require('./routes/Cita.routes.js'))
server.use('/planes', require('./routes/Plan.routes.js'))
server.use('/valoraciones', require('./routes/Valoracion.routes.js'))
server.use('/especialidades', require('./routes/Especialidad.routes.js'))

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