const { Plan, Usuario } = require('../models/index.model.js')
const seguridad = require('./Seguridad.controller.js')
const bitacora = require('./Bitacora.controller.js')

// CU015 - Gestionar planes
// Todo el CU vive dentro de este objeto: las funciones de apoyo van arriba y los endpoints abajo.
const PlanController = {

  // ---------- Funciones de apoyo ----------

  // Simula el "Sistema de pago" externo: rechaza si falta la tarjeta o si termina en 0
  async procesarPago(datosPago) {
    const tarjeta = String(datosPago?.tarjeta ?? '')
    return { aprobado: tarjeta.length > 0 && !tarjeta.endsWith('0') }
  },

  async obtenerPlanActual(dni) {
    const usuario = await Usuario.findByPk(dni, { include: [Plan] })
    return usuario?.Plan ?? null
  },

  // ---------- Endpoints ----------

  // GET /planes -> planes disponibles
  async verPlanes(req, res) {
    try {
      res.status(200).json(await Plan.findAll())
    } catch {
      res.status(500).json({ message: 'No se pudieron obtener los planes' })
    }
  },

  // GET /planes/actual -> plan actual del usuario logueado
  async administrarPlan(req, res) {
    try {
      const plan = await PlanController.obtenerPlanActual(req.usuario.DNIUsuario)
      if (!plan) return res.status(404).json({ message: 'No tenés un plan activo' })
      res.status(200).json(plan)
    } catch {
      res.status(500).json({ message: 'No se pudo obtener tu plan' })
    }
  },

  // PUT /planes/actual -> cambiar de plan (body: { IDPlan, datosPago })
  async cambiarPlan(req, res) {
    const dni = req.usuario.DNIUsuario
    const { IDPlan, datosPago } = req.body
    if (!IDPlan) return res.status(400).json({ message: 'Falta elegir el plan' })

    try {
      const nuevo = await Plan.findByPk(Number(IDPlan))
      if (!nuevo) return res.status(404).json({ message: 'El plan elegido no existe' })

      const actual = await PlanController.obtenerPlanActual(dni)
      if (actual && actual.IDPlan === nuevo.IDPlan) return res.status(409).json({ message: 'Ya tenés ese plan' })

      const pago = await PlanController.procesarPago(datosPago)
      if (!pago.aprobado) {
        await bitacora.registrar(`Pago rechazado para plan ${nuevo.IDPlan}`, dni)
        return res.status(402).json({ message: 'Pago rechazado' })
      }

      // Al cambiar la FK, el plan anterior deja de estar activo
      await Usuario.update({ IDPlanes: nuevo.IDPlan }, { where: { DNIUsuario: dni } })
      await seguridad.calcularDV('Usuario')
      await bitacora.registrar(`Plan cambiado a ${nuevo.IDPlan}`, dni)
      res.status(200).json({ message: 'Plan actualizado' })
    } catch (e) {
      await bitacora.registrar(`Error al cambiar plan: ${e.message}`, dni)
      res.status(500).json({ message: 'No se pudo cambiar el plan' })
    }
  },

  // DELETE /planes/actual -> F4 del CU: nadie puede quedarse sin plan activo
  eliminarPlan(req, res) {
    res.status(409).json({ message: 'No es posible quedarse sin un plan activo: elegí un plan nuevo' })
  }
}

// Mismos nombres que ya usa Plan.routes.js: no hay que tocar ningún otro archivo
module.exports = {
  verPlanes: PlanController.verPlanes,
  administrarPlan: PlanController.administrarPlan,
  cambiarPlan: PlanController.cambiarPlan,
  eliminarPlan: PlanController.eliminarPlan
}