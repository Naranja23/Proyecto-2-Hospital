const { Router } = require("express")
const { getHobbies, getHobbyByID, createHobby, putHobby, deleteHobby,aplicarDescuento } = require('../controllers/hobby.controller.js')

const routes = Router()

routes.get('/', getHobbies)
routes.get('/:id', getHobbyByID)
routes.post('/', createHobby)
routes.put('/:id', putHobby)
routes.delete('/:id', deleteHobby)

routes.put("/AplicarDesc/:id", aplicarDescuento)

routes.put("/capacidadUsuario/:userId/:hobbyId", capacidad)
module.exports = routes