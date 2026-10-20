//CU005 

const { sequelize } = require('../config/db.js');
const { Hospital } = require('../models/Hospital.Model'); // Importado como objeto según tu modelo
const registrarBitacora = require('../helpers/registrarBitacora');

const crear = async (req, res) => {
    // Recibimos los datos adaptados a los campos reales del formulario
    const { nombreH, direccionH, sitioWeb } = req.body;

    // Validamos que los datos obligatorios estén completos
    if (!nombreH || !nombreH.trim() || !direccionH || !direccionH.trim()) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Completá el nombre y la dirección del hospital.'
        });
    }

    // Abrimos una transacción para asegurar que el hospital y la bitácora se guarden juntos
    const t = await sequelize.transaction();

    try {
        // Buscamos si ya hay un hospital con ese nombre exacto
        const hospitalExistente = await Hospital.findOne({
            where: { NombreH: nombreH.trim() }
        }, { transaction: t });

        if (hospitalExistente) {
            await t.rollback();  
            return res.status(409).json({
                ok: false,
                mensaje: 'Ya existe un hospital con ese nombre.'
            });
        }

        // Creamos el hospital usando los nombres exactos de las columnas de tu modelo
        const hospitalNuevo = await Hospital.create({
            NombreH: nombreH.trim(),
            DireccionH: direccionH.trim(),
            SitioWeb: sitioWeb ? sitioWeb.trim() : null,
            EstadoH: 'Activo' // Valor por defecto que ya tenías definido en el modelo
        }, { transaction: t });

        // Registramos la acción en la bitácora usando la función auxiliar
        await registrarBitacora(req, {
            proceso: 'Alta de hospital',
            explicacion: 'Se agregó el hospital ' + hospitalNuevo.NombreH
        }, t);

        // Confirmamos los cambios si todo salió bien
        await t.commit();

        return res.status(201).json({
            ok: true,
            mensaje: 'Hospital agregado correctamente.',
            hospital: hospitalNuevo
        });

    } catch (error) {
        // Si algo falla, cancelamos todo para no dejar datos sueltos
        await t.rollback(); // el rollback borra todo lo q haya en ese momento de transacion
        console.error(error);
        return res.status(500).json({
            ok: false,
            mensaje: 'Ocurrió un error al guardar el hospital.'
        });
    }
};

module.exports = { crear };