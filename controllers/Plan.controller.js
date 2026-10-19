const { Plan, Usuario } = require('../models/index.model.js')
const seguridad = require('./Seguridad.controller.js')
const bitacora = require('./Bitacora.controller.js')

// Simula el "Sistema de pago" externo: rechaza si falta la tarjeta o si termina en 0
async function procesarPago(datosPago) {
  const tarjeta = String(datosPago?.tarjeta ?? '')
  return { aprobado: tarjeta.length > 0 && !tarjeta.endsWith('0') }
}

const obtenerPlanActual = async (dni) => (await Usuario.findByPk(dni, { include: [Plan] }))?.Plan ?? null

// CU015 - ver los planes disponibles
const verPlanes = async (req, res) => {
  try { res.status(200).json(await Plan.findAll()) }
  catch { res.status(500).json({ message: 'No se pudieron obtener los planes' }) }
}

// CU015 - ver mi plan actual
const administrarPlan = async (req, res) => {
  try {
    const plan = await obtenerPlanActual(req.usuario.DNIUsuario)
    if (!plan) return res.status(404).json({ message: 'No tenés un plan activo' })
    res.status(200).json(plan)
  } catch { res.status(500).json({ message: 'No se pudo obtener tu plan' }) }
}

// CU015 - cambiar de plan
const cambiarPlan = async (req, res) => {
  const dni = req.usuario.DNIUsuario
  const { IDPlan, datosPago } = req.body
  if (!IDPlan) return res.status(400).json({ message: 'Falta elegir el plan' })
  try {
    const nuevo = await Plan.findByPk(Number(IDPlan))
    if (!nuevo) return res.status(404).json({ message: 'El plan elegido no existe' })
    const actual = await obtenerPlanActual(dni)
    if (actual && actual.IDPlan === nuevo.IDPlan) return res.status(409).json({ message: 'Ya tenés ese plan' })

    const pago = await procesarPago(datosPago)                       // procesarPago(datosPago)
    if (!pago.aprobado) {
      await bitacora.registrar(`Pago rechazado para plan ${nuevo.IDPlan}`, dni)
      return res.status(402).json({ message: 'Pago rechazado' })
    }
    // activarPlan(): al cambiar la FK, el plan anterior deja de estar activo
    await Usuario.update({ IDPlanes: nuevo.IDPlan }, { where: { DNIUsuario: dni } })
    await seguridad.calcularDV('Usuario')                            // calcularDVH() + calcularDVV()
    await bitacora.registrar(`Plan cambiado a ${nuevo.IDPlan}`, dni)
    res.status(200).json({ message: 'Plan actualizado' })
  } catch (e) {
    await bitacora.registrar(`Error al cambiar plan: ${e.message}`, dni)
    res.status(500).json({ message: 'No se pudo cambiar el plan' })
  }
}

// CU015 - F4: no se puede quedar sin plan activo
const eliminarPlan = (req, res) =>
  res.status(409).json({ message: 'No es posible quedarse sin un plan activo: elegí un plan nuevo' })

module.exports = { verPlanes, administrarPlan, cambiarPlan, eliminarPlan }