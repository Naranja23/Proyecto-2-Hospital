const { Usuario } = require('./User.Model.js')
const { Medico } = require('./Medico.Model.js')
const { Cita } = require('./Cita.Model.js')
const { Hospital } = require('./Hospital.Model.js')
const { Permisos } = require('./Permisos.Model.js')
const { Rol } = require('./Rol.Model.js')
const { Plan } = require('./Plan.Model.js')
const { Prepaga } = require('./Prepaga.Model.js')

Medico.belongsToMany(Rol, { through: 'MedicoRol', foreignKey: 'IDMedico', otherKey: 'IDRol' })
Rol.belongsToMany(Medico, { through: 'MedicoRol', foreignKey: 'IDRol', otherKey: 'IDMedico' })

Usuario.belongsToMany(Rol, { through: 'UsuarioRol', foreignKey: 'DNIUsuario', otherKey: 'IDRol' })
Rol.belongsToMany(Usuario, { through: 'UsuarioRol', foreignKey: 'IDRol', otherKey: 'DNIUsuario' })

Rol.belongsToMany(Permisos, { through: 'RolPermisos', foreignKey: 'IDRol', otherKey: 'IDPermisos' })
Permisos.belongsToMany(Rol, { through: 'RolPermisos', foreignKey: 'IDPermisos', otherKey: 'IDRol' })

Usuario.belongsTo(Plan, { foreignKey: 'IDPlanes' })
Usuario.belongsTo(Cita, { foreignKey: 'IDConsulta' })

Cita.belongsTo(Hospital, { foreignKey: 'IDHospital' })
Cita.belongsTo(Usuario, { foreignKey: 'DNIUsuario' })
Cita.belongsTo(Medico, { foreignKey: 'IDMedico' })

Medico.belongsTo(Hospital, { foreignKey: 'IDHospital' })

Plan.belongsTo(Prepaga, { foreignKey: 'IDPrepaga' })
Plan.belongsTo(Hospital, { foreignKey: 'IDHospital' })

Prepaga.belongsTo(Hospital, { foreignKey: 'IDHospital' })

Hospital.hasMany(Plan, { foreignKey: 'IDHospital' })
Hospital.hasMany(Prepaga, { foreignKey: 'IDHospital' })
Hospital.hasMany(Medico, { foreignKey: 'IDHospital' })
Hospital.hasMany(Cita, { foreignKey: 'IDHospital' })

module.exports = {
    Usuario,
    Medico,
    Cita,
    Hospital,
    Permisos,
    Plan,
    Prepaga,
    Rol
}