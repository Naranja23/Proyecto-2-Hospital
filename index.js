require('dotenv').config()
const express = require('express')
const server = express()

require('./models/index.model.js')
const { sequelize } = require('./config/db.js')

const userRoutes = require('./routes/user.routes.js')

const PORT = process.env.PORT || 3000

// Habilitar CORS para permitir peticiones desde el frontend de Vite
server.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
    if (req.method === "OPTIONS") return res.sendStatus(200)
    next()
})

server.use(express.json())

server.get('/', (req, res) => {
    res.status(200).json({
        message: "El server está ON"
    })
})

server.use('/users', userRoutes)

server.listen(PORT, async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync({ alter: true })
        console.log(`El server está ON en el puerto ${PORT}`)
    } catch (error) {
        console.error("Error al conectar con la base de datos:", error.message)
    }
})