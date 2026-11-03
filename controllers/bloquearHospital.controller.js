// CONTROLADOR DEL CU008: BLOQUEAR HOSPITAL.
const { Hospital } = require('../models/Hospital.Model');
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

        if (hospital.EstadoH === 'Bloqueado') {
            return res.status(409).json({
                mensaje: 'El hospital ya se encuentra bloqueado.'
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


const bloquear = async (req, res) => {

    const { id } = req.params;
    const { motivo } = req.body;

    try {

        if (!motivo || !motivo.trim()) {
            return res.status(400).json({
                mensaje: 'Debe ingresar el motivo del bloqueo.'
            });
        }

        const hospital = await Hospital.findByPk(id);

        if (!hospital) {
            return res.status(404).json({
                mensaje: 'El hospital seleccionado no existe.'
            });
        }

        if (hospital.EstadoH === 'Bloqueado') {
            return res.status(409).json({
                mensaje: 'El hospital ya se encuentra bloqueado.'
            });
        }

        hospital.EstadoH = 'Bloqueado';
        hospital.MotivoBloqueo = motivo.trim();
        await hospital.save();

        await registrarBitacora(req, {
            modulo: 'Hospitales',
            accion: 'Bloqueo de hospital',
            detalle: 'Se bloqueó el hospital ' + hospital.NombreH + '. Motivo: ' + motivo.trim()
        });

        return res.status(200).json({
            mensaje: 'Hospital bloqueado correctamente.'
        });

    } catch (error) {

        console.error(error);
        return res.status(500).json({
            mensaje: 'Ocurrió un error al bloquear el hospital. El estado no pudo ser modificado.'
        });

    }

};


module.exports = { obtener, bloquear };
