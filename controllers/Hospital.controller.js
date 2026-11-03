//CU005 AGREGAR HOSPITAL
const { Hospital } = require('../models/Hospital.Model');
const registrarBitacora = require('../helpers/registrarBitacora');

const crear = async (req, res) => {
    const { nombreH, direccionH, sitioWeb } = req.body;

    if (!nombreH || !nombreH.trim() || !direccionH || !direccionH.trim()) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Completá el nombre y la dirección del hospital.'
        });
    }

    try {
        const hospitalExistente = await Hospital.findOne({
            where: { NombreH: nombreH.trim() }
        });

        if (hospitalExistente) {
            return res.status(409).json({
                ok: false,
                mensaje: 'Ya existe un hospital con ese nombre.'
            });
        }

        const hospitalNuevo = await Hospital.create({
            NombreH: nombreH.trim(),
            DireccionH: direccionH.trim(),
            SitioWeb: sitioWeb ? sitioWeb.trim() : null,
            EstadoH: 'Activo'
        });

        await registrarBitacora(req, {
            proceso: 'Alta de hospital',
            explicacion: 'Se agregó el hospital ' + hospitalNuevo.NombreH
        });

        return res.status(201).json({
            ok: true,
            mensaje: 'Hospital agregado correctamente.',
            hospital: hospitalNuevo
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            ok: false,
            mensaje: 'Ocurrió un error al guardar el hospital.'
        });
    }
};

module.exports = { crear };