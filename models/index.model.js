const { Usuario } = require('./Usuario.model.js')
const { Prepaga } = require('./Prepaga.model.js')
const { Medico } = require('./Medico.model.js')
const { Consulta } = require('./Consulta.model.js')
const { Hospital } = require('./Hospital.model.js')
const { Permisos } = require('./Permisos.model.js')
const { Rol } = require('./Rol.model.js')
const { Plan } = require('./Plan.model.js')


Medico.belongsToMany(Rol, { through: 'MedicoRol', foreignKey: 'DNIMedico', otherKey: 'IDRol' })
Rol.belongsToMany(Medico, { through: 'MedicoRol', foreignKey: 'IDRol', otherKey: 'DNIMedico' })

Usuario.belongsToMany(Rol, { through: 'UsuarioRol', foreignKey: 'IDUsuario', otherKey: 'IDRol' })
Rol.belongsToMany(Usuario, { through: 'UsuarioRol', foreignKey: 'IDRol', otherKey: 'IDUsuario' })

Rol.belongsToMany(Permisos, { through: 'RolPermisos', foreignKey: 'IDRol', otherKey: 'IDPermisos' })
Permisos.belongsToMany(Rol, { through: 'RolPermisos', foreignKey: 'IDPermisos', otherKey: 'IDRol' })


Usuario.belongsTo(Plan, { foreignKey: 'IDPlanes' })
Usuario.belongsTo(Consulta, { foreignKey: 'IDConsulta' })

Consulta.belongsTo(Hospital, { foreignKey: 'IDHospital' })
Consulta.belongsTo(Usuario, { foreignKey: 'DNIUsuario' })
Consulta.belongsTo(Medico, { foreignKey: 'DNIMedico' })

Medico.belongsTo(Hospital, { foreignKey: 'IDHospital' })
Medico.belongsTo(Consulta, { foreignKey: 'IDConsulta' })

Plan.belongsTo(Prepaga, { foreignKey: 'IDPrepaga' })
Plan.belongsTo(Hospital, { foreignKey: 'IDHospital' })
Usuario.hasMany(Plan, { foreignKey: 'IDPlanes' }) 

Prepaga.belongsTo(Hospital, { foreignKey: 'IDHospital' })
Prepaga.belongsTo(Plan, { foreignKey: 'IDPlanes' })

Hospital.belongsTo(Plan, { foreignKey: 'IDPlanes' })
Hospital.belongsTo(Medico, { foreignKey: 'DNIMedico' })
Hospital.belongsTo(Prepaga, { foreignKey: 'IDPrepaga' })
Hospital.belongsTo(Consulta, { foreignKey: 'IDConsultas' })

module.exports = {
    Usuario,
    Medico,
    Consulta,
    Hospital,
    Permisos,
    Plan,
    Prepaga,
    Rol
}