const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const { Hospital, Usuario } = require('../models/index.model.js')

// CU023 - Desbloquear hospital (el caso de uso NO sabe de DVH ni DVV)
const desbloquearHospital = async (req, res) => {
  try {
    const { id } = req.params
    const hospital = await Hospital.findByPk(id)

    // Flujo Alternativo F2: Hospital Inexistente
    if (!hospital) {
      return res.status(404).json({ error: 'El hospital seleccionado no existe o fue eliminado.' })
    }

    // Flujo Alternativo F1: Hospital ya habilitado
    if (hospital.EstadoH === 'Activo' || hospital.EstadoH === 'habilitado') {
      return res.status(400).json({ mensaje: 'No es necesario realizar el desbloqueo. El hospital ya se encuentra habilitado.' })
    }

    await hospital.update({ EstadoH: 'Activo' })

    return res.status(200).json({ mensaje: 'El hospital fue habilitado correctamente.' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'La operación no pudo completarse. Ocurrió un error al intentar modificar el estado del hospital.' })
  }
}

// CU022 - Recuperar Contraseña
const recuperarPassword = async (req, res) => {
  try {
    const { email } = req.body

    // 1. Buscamos al usuario en la base de datos por su Email
    const usuario = await Usuario.findOne({ where: { Email: email } })

    if (!usuario) {
      return res.status(404).json({ error: 'No encontramos ninguna cuenta asociada a ese correo.' })
    }

    // 2. Generamos un token seguro que expira en 15 minutos
    const token = jwt.sign(
      { id: usuario.DNIUsuario },
      process.env.JWT_SECRET || 'secreto_hospital',
      { expiresIn: '15m' }
    )

    // 3. Configuramos el transporte de nodemailer con Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    // 4. Armamos el diseño del correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: usuario.Email,
      subject: 'Recuperación de Contraseña - Sistema Hospitalario',
      html: `
        <h3>Hola, ${usuario.NomApeU}</h3>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Copiá y pegá este código en la aplicación para crear una nueva (es válido por 15 minutos):</p>
        <div style="padding: 10px; background-color: #f3f3f3; border-radius: 5px; font-weight: bold; margin: 10px 0;">
          ${token}
        </div>
        <p>Si no fuiste vos quien pidió esto, podés ignorar este correo de forma segura.</p>
      `
    }

    // 5. Enviamos el correo
    await transporter.sendMail(mailOptions)

    return res.status(200).json({ mensaje: 'Te enviamos un correo con las instrucciones para recuperar tu contraseña.' })
  } catch (error) {
    console.error('Error al enviar correo:', error)
    return res.status(500).json({ error: 'Ocurrió un error en el servidor al intentar enviar el correo.' })
  }
}

module.exports = {
  desbloquearHospital,
  recuperarPassword
}
