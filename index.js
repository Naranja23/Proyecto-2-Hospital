require('dotenv').config()
const express = require('express')
const server = express()



require('./models/index.model.js')
const { sequelize } = require('./config/db.js')

const userRoutes = require('./routes/user.routes.js')


const PORT = 3000

server.use(express.json())

server.get('/', (req, res)=>{
    res.status(200).json({
        message: "El server está ON"
    })
})

server.use('/users', userRoutes)


server.listen(PORT, async()=>{
    await sequelize.authenticate()
    await sequelize.sync({ force: true })
    console.log("El server está ON");
})