const { Router } = require("express")
const { getUsers, getUserByID, createUser, putUser, deleteUser } = require('../controllers/user.controller.js')

const routes = Router()

routes.get('/', getUsers)
routes.get('/:id', getUserByID)
routes.post('/', createUser)
routes.put('/:id', putUser)
routes.delete('/:id', deleteUser)

module.exports = routes