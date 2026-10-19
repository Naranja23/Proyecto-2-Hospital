const crypto = require('crypto')
const { DVH } = require('../models/DVH.Model.js')

/**
 * Función que agarra todos los registros y todos los campos de una tabla
 * y calcula el DVH (Dígito Verificador Horizontal) para cada fila,
 * guardándolo en la columna DVH de cada registro.
 * Además, actualiza la tabla de control general DVH.
 */
const calcularDVH = async (Modelo, nombreTabla) => {
    try {
        const registros = await Modelo.findAll()
        let acumuladoTotal = ''

        for (const fila of registros) {
            // Agarra todos los campos de la fila (excepto la propia columna DVH)
            const campos = Object.entries(fila.dataValues)
                .filter(([clave]) => clave !== 'DVH' && clave !== 'DVV')
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([clave, valor]) => `${clave}:${valor ?? ''}`)
                .join('|')

            const hashFila = crypto.createHash('sha256').update(campos).digest('hex')
            acumuladoTotal += hashFila

            // Si el modelo tiene la columna DVH y difiere, la actualizamos
            if (fila.DVH !== undefined && fila.DVH !== hashFila) {
                fila.DVH = hashFila
                await fila.save({ hooks: false })
            }
        }

        // Si la tabla general DVH existe, guardamos el estado acumulado
        const hashTotal = crypto.createHash('sha256').update(acumuladoTotal).digest('hex')
        try {
            await DVH.upsert({
                NombreTabla: nombreTabla,
                DVH: hashTotal,
                FechaActualizacion: new Date()
            })
        } catch (_) {}

        console.log(`[DVH Controller] DVH de tabla '${nombreTabla}' calculado con éxito`)
        return hashTotal
    } catch (error) {
        console.error(`[DVH Controller] Error al calcular DVH de la tabla '${nombreTabla}':`, error.message)
        throw error
    }
}

/**
 * Middleware para encadenar con next():
 * Una vez que termina un caso de uso (ej. crear, actualizar o eliminar),
 * sigue a este paso para recalcular el DVH automáticamente.
 */
const dvhMiddleware = (Modelo, nombreTabla) => {
    return async (req, res, next) => {
        try {
            await calcularDVH(Modelo, nombreTabla)
        } catch (error) {
            console.error(`Error en middleware DVH para ${nombreTabla}:`, error.message)
        }
        if (typeof next === 'function') {
            next()
        }
    }
}

module.exports = {
    calcularDVH,
    dvhMiddleware
}
