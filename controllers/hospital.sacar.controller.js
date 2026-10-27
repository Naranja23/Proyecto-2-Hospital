// CONTROLADOR DEL CU007: SACAR UN HOSPITAL.
const { sequelize } = require('../config/db.js');
const { Hospital } = require('../models/Hospital.Model');
const { Medico } = require('../models/Medico.Model');
const { Turno } = require('../models/Turno.Model');
const registrarBitacora = require('../helpers/registrarBitacora');


// PASOS 1 a 3 DEL EP: busca el hospital y lo devuelve para pedir la confirmación.
const obtener = async (req, res) => {

    const { id } = req.params;

    try {

        // findByPk busca un registro por su clave primaria (IDHospital).
        const hospital = await Hospital.findByPk(id);

        // F1: el hospital no existe.
        if (!hospital) {
            return res.status(404).json({
                mensaje: 'El hospital seleccionado no existe.'
            });
        }

        return res.status(200).json({ hospital });

    } catch (error) {

        console.error(error);
        return res.status(500).json({
            mensaje: 'Ocurrió un error al buscar el hospital.'
        });

    }

};


// PASOS 4 a 8 DEL EP: el administrador confirmó, se valida y se elimina.
const eliminar = async (req, res) => {

    const { id } = req.params;

    // La transacción se abre recién cuando pasaron las validaciones.
    let t;

    try {

        const hospital = await Hospital.findByPk(id);

        // F1: el hospital ya no figura en los registros.
        if (!hospital) {
            return res.status(404).json({
                mensaje: 'El hospital seleccionado no existe.'
            });
        }

        // PASO 5 DEL EP: validar que no tenga dependencias.
        // count() devuelve la cantidad de registros que cumplen la condición.
        const cantidadMedicos = await Medico.count({ where: { IDHospital: id } });
        const cantidadTurnos = await Turno.count({ where: { IDHospital: id } });

        // F2: tiene médicos o turnos asociados, no se puede borrar.
        if (cantidadMedicos > 0 || cantidadTurnos > 0) {
            return res.status(409).json({
                mensaje: 'No se puede eliminar el hospital porque tiene médicos o turnos asociados.'
            });
        }

        // Guardamos el nombre antes de borrar, para usarlo en la bitácora.
        const nombreHospital = hospital.NombreH;

        // Transacción: el borrado y la bitácora se guardan juntos o no se guarda nada.
        t = await sequelize.transaction();

        // PASO 6 DEL EP: eliminación definitiva.
        await hospital.destroy({ transaction: t });

        // PASO 7 DEL EP: registrar en la bitácora (dentro de la misma transacción).
        await registrarBitacora(req, {
            modulo: 'Hospitales',
            accion: 'Baja de hospital',
            detalle: 'Se eliminó el hospital ' + nombreHospital
        }, t);

        // Si todo salió bien, se confirman los cambios.
        await t.commit();

        // PASO 8 DEL EP: mensaje de éxito.
        return res.status(200).json({
            mensaje: 'Hospital eliminado correctamente.'
        });

    } catch (error) {

        // F3: error técnico durante la eliminación. Se revierte todo.
        if (t) await t.rollback();

        console.error(error);
        return res.status(500).json({
            mensaje: 'Ocurrió un error al eliminar el hospital. No se pudo completar la operación.'
        });

    }

};


module.exports = { obtener, eliminar };
