// CONTROLADOR DEL CU008: BLOQUEAR HOSPITAL.
const { Hospital } = require('../models/Hospital.Model');
const registrarBitacora = require('../helpers/registrarBitacora');


// PASOS 1 a 3 DEL EP: busca el hospital y lo devuelve para mostrar sus datos.
const obtener = async (req, res) => {

    const { id } = req.params;

    try {

        const hospital = await Hospital.findByPk(id);

        if (!hospital) {
            return res.status(404).json({
                mensaje: 'El hospital seleccionado no existe.'
            });
        }

        // F1: el hospital ya se encuentra bloqueado.
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


// PASOS 4 a 10 DEL EP: el administrador ingresó el motivo y confirmó.
const bloquear = async (req, res) => {

    const { id } = req.params;
    const { motivo } = req.body;

    try {

        if (!motivo || !motivo.trim()) {
            return res.status(400).json({
                mensaje: 'Debe ingresar el motivo del bloqueo.'
            });
        }

        // PASO 7 DEL EP: validar las condiciones.
        const hospital = await Hospital.findByPk(id);

        // F2: el hospital ya no existe.
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

        // PASO 7 DEL EP: actualizar el estado y guardar el motivo.
        hospital.EstadoH = 'Bloqueado';
        hospital.MotivoBloqueo = motivo.trim();
        await hospital.save();

        // PASO 8 DEL EP: registrar en la bitácora.
        await registrarBitacora(req, {
            modulo: 'Hospitales',
            accion: 'Bloqueo de hospital',
            detalle: 'Se bloqueó el hospital ' + hospital.NombreH + '. Motivo: ' + motivo.trim()
        });

        // PASO 10 DEL EP: mensaje de éxito.
        return res.status(200).json({
            mensaje: 'Hospital bloqueado correctamente.'
        });

    } catch (error) {

        // F3: error al actualizar el estado.
        console.error(error);
        return res.status(500).json({
            mensaje: 'Ocurrió un error al bloquear el hospital. El estado no pudo ser modificado.'
        });

    }

};


module.exports = { obtener, bloquear };
