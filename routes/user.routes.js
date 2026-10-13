const { Router } = require("express")
const { getUsers, getUserByID, createUser, putUser, deleteUser, login } = require('../controllers/user.controller.js')

const routes = Router()

routes.get('/', getUsers)
routes.get('/:id', getUserByID)
routes.post('/', createUser)
routes.put('/:id', putUser)
routes.delete('/:id', deleteUser)
routes.post('/login', login)


module.exports = routes