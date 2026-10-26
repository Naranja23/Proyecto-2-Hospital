const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { sequelize } = require('../config/db.js')
const { DVV } = require('../models/index.model.js')

const hash = (txt) => crypto.createHash('sha256').update(txt).digest('hex')

// DVH: hash de todos los campos de la fila, menos el propio DVH
function calcularDVH(fila) {
  const { DVH, ...datos } = fila
  const texto = Object.keys(datos).sort().map(k => `${k}=${JSON.stringify(datos[k])}`).join('|')
  return hash(texto)
}

// DVV: hash de los DVH de toda la tabla (suma total de todos los DVH)
const calcularDVV = (dvhs) => hash(dvhs.join(''))

// Trae todas las filas de una tabla ordenadas por clave primaria(lo usa par acalculos)
function leerTabla(tabla) {
  const M = sequelize.models[tabla]
  return M.findAll({ order: [[M.primaryKeyAttribute, 'ASC']] })
}

// Recalcula DVH de cada fila y el DVV de la tabla (se llama después de escribir en la BD)
async function calcularDV(tabla) {
  const filas = await leerTabla(tabla)
  const dvhs = []
  for (const f of filas) {
    const dvh = calcularDVH(f.get({ plain: true }))
    if (f.DVH !== dvh) await f.update({ DVH: dvh })
    dvhs.push(dvh)
  }
  const totalDVV = calcularDVV(dvhs)
  if (DVV) {
    const existente = await DVV.findOne({ where: { Tabla: tabla } })
    if (existente) {
      await existente.update({ CalculoDVV: totalDVV, FechaActualizacion: new Date() })
    } else {
      await DVV.create({ Tabla: tabla, CalculoDVV: totalDVV, FechaActualizacion: new Date() })
    }
  }
}

const desbloquearHospital = async (req, res) => {
    try {
        const { id } = req.params;
        const hospital = await Hospital.findByPk(id);

        if (!hospital) {
            return res.status(404).json({ error: "El hospital seleccionado no existe o fue eliminado." });
        }

        if (hospital.estado === 'habilitado') {
            return res.status(400).json({ mensaje: "No es necesario realizar el desbloqueo. El hospital ya se encuentra habilitado." });
        }

        await hospital.update({ estado: 'habilitado' });
        await calcularDV('hospitales'); 

        return res.status(200).json({ mensaje: "El hospital fue habilitado correctamente." });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "La operación no pudo completarse. Ocurrió un error al intentar modificar el estado del hospital." });
    }
};
module.exports = { calcularDVH, calcularDVV, leerTabla, calcularDV, auth, soloAdmin, desbloquearHospital }