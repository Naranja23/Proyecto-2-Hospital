const { User } = require('./user.model.js')
const { Prepaga } = require('./Prepaga.model.js')
const { Medico } = require('./ Medico.Model.js')
const { citas } = require('./Citas.Model.js')
const { Hospital } = require('./Hospital.Model.js')
const { Permisos } = require('./Permisos.Model.js')
const { Plan } = require('./plan.Model.js')

User.belongsToMany(Hobby, { through: "userHobbies" })
Hobby.belongsToMany(User, { through: "userHobbies" })

module.exports = {
    User,
    Medico,
    citas,
    Hospital,
    Permisos,
    Plan,
    Prepaga
}