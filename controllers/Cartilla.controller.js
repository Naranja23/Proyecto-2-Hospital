// CONTROLADOR DEL CU006: ACTUALIZAR LA CARTILLA DE UNA OBRA SOCIAL.
// Una cartilla es la lista de hospitales que atienden para una obra social.

const Cartilla = require('../models/Cartilla.Model');
const Hospital = require('../models/Hospital.Model');
const Prepaga = require('../models/Prepaga.Model');
const registrarBitacora = require('../helpers/registrarBitacora');

// PASO 1: devolver las obras sociales para llenar el selector del frontend.
const listarObrasSociales = async (req, res) => {
    try {
        // findAll devuelve todos los registros. Solo necesitamos id y nombre.
        const obrasSociales = await Prepaga.findAll({
            attributes: ['id', 'nombre'],
            order: [['nombre', 'ASC']] // ASC ordena alfabéticamente.
        });

        return res.status(200).json(obrasSociales);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'No se pudieron cargar las obras sociales.' });
    }
};

// PASO 2: mostrar todos los hospitales e indicar cuáles están en la cartilla.
const obtener = async (req, res) => {
    // El id de la obra social viene en la URL, por ejemplo /cartilla/3.
    const prepagaId = req.params.prepagaId;

    try {
        // findByPk busca un registro por su clave primaria (normalmente id).
        const obraSocial = await Prepaga.findByPk(prepagaId);

        if (!obraSocial) {
            return res.status(404).json({ mensaje: 'La obra social no existe.' });
        }

        // Buscamos todos los hospitales y los registros que ya forman la cartilla.
        const hospitales = await Hospital.findAll({ order: [['nombre', 'ASC']] });
        const hospitalesEnCartilla = await Cartilla.findAll({
            where: { prepagaId: prepagaId }
        });

        // Armamos una lista simple de los ID que ya están asociados.
        const idsEnCartilla = [];
        for (let i = 0; i < hospitalesEnCartilla.length; i++) {
            idsEnCartilla.push(hospitalesEnCartilla[i].hospitalId);
        }

        // A cada hospital le agregamos enCartilla: true o false.
        // Esto le permite al frontend mostrar la casilla marcada o desmarcada.
        const resultado = [];
        for (let i = 0; i < hospitales.length; i++) {
            const hospital = hospitales[i];
            const estaEnCartilla = idsEnCartilla.includes(hospital.id);

            resultado.push({
                id: hospital.id,
                nombre: hospital.nombre,
                ciudad: hospital.ciudad,
                enCartilla: estaEnCartilla
            });
        }

        return res.status(200).json({
            obraSocial: obraSocial,
            hospitales: resultado
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'No se pudo cargar la cartilla.' });
    }
};

// PASOS 3 A 6: guardar la lista final de hospitales seleccionados.
const actualizar = async (req, res) => {
    const prepagaId = req.params.prepagaId;
    // El frontend envía algo parecido a { hospitalIds: [1, 2, 5] }.
    const hospitalIds = req.body.hospitalIds;

    // Verificamos que hospitalIds sea una lista antes de recorrerla.
    if (!Array.isArray(hospitalIds)) {
        return res.status(400).json({ mensaje: 'Tenés que enviar una lista de hospitales.' });
    }

    try {
        const obraSocial = await Prepaga.findByPk(prepagaId);

        if (!obraSocial) {
            return res.status(404).json({ mensaje: 'La obra social no existe.' });
        }

        // Revisamos que cada hospital seleccionado exista realmente.
        // No conviene guardar una relación con un hospital que no existe.
        for (let i = 0; i < hospitalIds.length; i++) {
            const hospital = await Hospital.findByPk(hospitalIds[i]);
            if (!hospital) {
                return res.status(400).json({ mensaje: 'Uno de los hospitales seleccionados no existe.' });
            }
        }

        // Leemos la cartilla actual para saber qué hay que agregar o quitar.
        const cartillaActual = await Cartilla.findAll({
            where: { prepagaId: prepagaId }
        });

        const idsActuales = [];
        for (let i = 0; i < cartillaActual.length; i++) {
            idsActuales.push(cartillaActual[i].hospitalId);
        }

        // Creamos dos listas: hospitales nuevos y hospitales que se quitaron.
        const agregar = [];
        const quitar = [];

        for (let i = 0; i < hospitalIds.length; i++) {
            // includes() pregunta si un valor ya existe dentro de una lista.
            if (!idsActuales.includes(hospitalIds[i])) {
                agregar.push(hospitalIds[i]);
            }
        }

        for (let i = 0; i < idsActuales.length; i++) {
            if (!hospitalIds.includes(idsActuales[i])) {
                quitar.push(idsActuales[i]);
            }
        }

        // Si no hay nada para cambiar, respondemos sin hacer escrituras.
        if (agregar.length === 0 && quitar.length === 0) {
            return res.status(200).json({ mensaje: 'La cartilla no tenía cambios.' });
        }

        // Agregamos las relaciones nuevas, una por una.
        for (let i = 0; i < agregar.length; i++) {
            await Cartilla.create({
                prepagaId: prepagaId,
                hospitalId: agregar[i]
            });
        }

        // Quitamos de la cartilla los hospitales que se desmarcaron.
        for (let i = 0; i < quitar.length; i++) {
            await Cartilla.destroy({
                where: {
                    prepagaId: prepagaId,
                    hospitalId: quitar[i]
                }
            });
        }

        // Dejamos un registro de la actualización en la bitácora.
        await registrarBitacora(req, {
            modulo: 'Cartilla',
            accion: 'Actualización de cartilla',
            detalle: 'Se actualizó la cartilla de ' + obraSocial.nombre
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

// Exportamos las tres funciones para conectarlas con las rutas.
module.exports = {
    listarObrasSociales,
    obtener,
    actualizar
};
