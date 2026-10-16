require('dotenv').config()
const express = require('express')
const server = express()
const integridad = require('./controllers/Integridad.controller.js') 
require('./models/index.model.js')
const { sequelize } = require('./config/db.js')

server.use(express.json())
server.get('/', (req, res) => res.status(200).json({ message: 'El server está ON' }))
server.use('/users', require('./routes/user.routes.js'))
// ---- las líneas de cada CU van acá ----
server.use('/seguridad', require('./routes/Seguridad.routes.js'))
server.use('/turnos', require('./routes/Cita.routes.js'))
server.use('/planes', require('./routes/Plan.routes.js'))
const PORT = 3000
const iniciar = async () => {
  await sequelize.authenticate()
  await sequelize.sync()                       // sin force: no borra la base
  // ---- CU013 agrega acá la verificación al arrancar ----
    const r = await integridad.verificar()                               // en "CU013 agrega acá"
  console.log('Integridad BD:', r.ok ? 'OK' : r.errores)
  server.listen(PORT, () => console.log('El server está ON'))
}
if (require.main === module) iniciar()
module.exports = { server, iniciar }