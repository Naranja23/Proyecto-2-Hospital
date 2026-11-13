// CONTROLADOR DEL CU006: ACTUALIZAR LA CARTILLA DE UNA OBRA SOCIAL.
// Una cartilla es la lista de hospitales que atienden para una obra social.

const Cartilla = require('../models/Cartilla.Model');
const { Hospital } = require('../models/Hospital.Model');
const { Prepaga } = require('../models/Prepaga.Model');
const registrarBitacora = require('../helpers/registrarBitacora');

// PASO 1: devolver las obras sociales para llenar el selector del frontend.
const listarObrasSociales = async (req, res) => {
    try {
        const prepagas = await Prepaga.findAll({
            attributes: ['IDPrepaga', 'NombreComercial'],
            order: [['NombreComercial', 'ASC']]
        });

        // Devolvemos con aliases compatibles tanto con id/nombre como con IDPrepaga/NombreComercial
        const resultado = prepagas.map((p) => ({
            id: p.IDPrepaga,
            IDPrepaga: p.IDPrepaga,
            nombre: p.NombreComercial,
            NombreComercial: p.NombreComercial
        }));

        return res.status(200).json(resultado);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'No se pudieron cargar las obras sociales.' });
    }
};

// PASO 2: mostrar todos los hospitales e indicar cuáles están en la cartilla.
const obtener = async (req, res) => {
    const prepagaId = Number(req.params.prepagaId);

    try {
        const obraSocial = await Prepaga.findByPk(prepagaId);

        if (!obraSocial) {
            return res.status(404).json({ mensaje: 'La obra social no existe.' });
        }

        const hospitales = await Hospital.findAll({ order: [['NombreH', 'ASC']] });
        const hospitalesEnCartilla = await Cartilla.findAll({
            where: { prepagaId: prepagaId }
        });

        const idsEnCartilla = hospitalesEnCartilla.map((c) => Number(c.hospitalId));

        const resultado = hospitales.map((hospital) => {
            const estaEnCartilla = idsEnCartilla.includes(hospital.IDHospital);

            return {
                id: hospital.IDHospital,
                IDHospital: hospital.IDHospital,
                nombre: hospital.NombreH,
                NombreH: hospital.NombreH,
                ciudad: hospital.DireccionH,
                direccion: hospital.DireccionH,
                DireccionH: hospital.DireccionH,
                enCartilla: estaEnCartilla
            };
        });

        return res.status(200).json({
            obraSocial: {
                id: obraSocial.IDPrepaga,
                IDPrepaga: obraSocial.IDPrepaga,
                nombre: obraSocial.NombreComercial,
                NombreComercial: obraSocial.NombreComercial
            },
            hospitales: resultado
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'No se pudo cargar la cartilla.' });
    }
};

// PASOS 3 A 6: guardar la lista final de hospitales seleccionados.
const actualizar = async (req, res) => {
    const prepagaId = Number(req.params.prepagaId);
    const hospitalIds = req.body.hospitalIds;

    if (!Array.isArray(hospitalIds)) {
        return res.status(400).json({ mensaje: 'Tenés que enviar una lista de hospitales.' });
    }

    try {
        const obraSocial = await Prepaga.findByPk(prepagaId);

        if (!obraSocial) {
            return res.status(404).json({ mensaje: 'La obra social no existe.' });
        }

        const idsNumericos = hospitalIds.map((id) => Number(id));

        // Revisamos que cada hospital seleccionado exista realmente
        for (const hid of idsNumericos) {
            const hospital = await Hospital.findByPk(hid);
            if (!hospital) {
                return res.status(400).json({ mensaje: 'Uno de los hospitales seleccionados no existe.' });
            }
        }

        // Leemos la cartilla actual
        const cartillaActual = await Cartilla.findAll({
            where: { prepagaId: prepagaId }
        });

        const idsActuales = cartillaActual.map((c) => Number(c.hospitalId));

        const agregar = idsNumericos.filter((id) => !idsActuales.includes(id));
        const quitar = idsActuales.filter((id) => !idsNumericos.includes(id));

        if (agregar.length === 0 && quitar.length === 0) {
            return res.status(200).json({ mensaje: 'La cartilla no tenía cambios.' });
        }

        for (const hid of agregar) {
            await Cartilla.create({
                prepagaId: prepagaId,
                hospitalId: hid
            });
        }

        for (const hid of quitar) {
            await Cartilla.destroy({
                where: {
                    prepagaId: prepagaId,
                    hospitalId: hid
                }
            });
        }

        await registrarBitacora(req, {
            modulo: 'Cartilla',
            accion: 'Actualización de cartilla',
            proceso: 'Actualización de cartilla',
            detalle: 'Se actualizó la cartilla de ' + obraSocial.NombreComercial,
            explicacion: 'Se actualizó la cartilla de ' + obraSocial.NombreComercial
        });

        return res.status(200).json({
            mensaje: 'La cartilla se actualizó correctamente.',
            hospitalesAgregados: agregar.length,
            hospitalesQuitados: quitar.length
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'No se pudo actualizar la cartilla.' });
    }
};

module.exports = { listarObrasSociales, obtener, actualizar };
