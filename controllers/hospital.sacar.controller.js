// CONTROLADOR DEL CU007: SACAR UN HOSPITAL.
const { Hospital } = require('../models/Hospital.Model');
const { Medico } = require('../models/Medico.Model');
const { Turno } = require('../models/Turno.Model');
const registrarBitacora = require('../helpers/registrarBitacora');



const obtener = async (req, res) => {

    const { id } = req.params;

    try {

        const hospital = await Hospital.findByPk(id);

        
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


const eliminar = async (req, res) => {

    const { id } = req.params;

    try {

        const hospital = await Hospital.findByPk(id);

        if (!hospital) {
            return res.status(404).json({
                mensaje: 'El hospital seleccionado no existe.'
            });
        }

        const cantidadMedicos = await Medico.count({ where: { IDHospital: id } });
        const cantidadTurnos = await Turno.count({ where: { IDHospital: id } });

        if (cantidadMedicos > 0 || cantidadTurnos > 0) {
            return res.status(409).json({
                mensaje: 'No se puede eliminar el hospital porque tiene médicos o turnos asociados.'
            });
        }

        const nombreHospital = hospital.NombreH;

        await hospital.destroy();

        await registrarBitacora(req, {
            modulo: 'Hospitales',
            accion: 'Baja de hospital',
            detalle: 'Se eliminó el hospital ' + nombreHospital
        });


        return res.status(200).json({
            mensaje: 'Hospital eliminado correctamente.'
        });

    } catch (error) {

        console.error(error);
        return res.status(500).json({
            mensaje: 'Ocurrió un error al eliminar el hospital. No se pudo completar la operación.'
        });

    }

};


module.exports = { obtener, eliminar };
