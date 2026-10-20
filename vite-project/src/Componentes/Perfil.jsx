import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/Perfil.css'

const API = 'http://localhost:3000'

function Perfil({ usuario, onUsuarioActualizado, onSesionExpirada }) {
  const [nombre, setNombre] = useState(usuario?.NomApeU || '')
  const [email, setEmail] = useState(usuario?.Email || '')
  const [edad, setEdad] = useState(usuario?.EdadU || '')
  const [dni] = useState(usuario?.DNIUsuario || '')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null) // { tipo: 'exito' | 'error', texto }

  useEffect(() => {
    // Cargar datos frescos del usuario desde el servidor si tenemos DNI
    if (usuario?.DNIUsuario) {
      axios.get(`${API}/users/${usuario.DNIUsuario}`)
        .then(res => {
          if (res.data) {
            setNombre(res.data.NomApeU || '')
            setEmail(res.data.Email || '')
            setEdad(res.data.EdadU || '')
          }
        })
        .catch(() => {
          // Si falla, se conservan los datos de la sesión local
        })
    }
  }, [usuario])

  const manejarGuardar = async (e) => {
    e.preventDefault()
    setMensaje(null)

    if (!nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre y apellido no pueden estar vacíos.' })
      return
    }

    if (!email.trim()) {
      setMensaje({ tipo: 'error', texto: 'El correo electrónico es obligatorio.' })
      return
    }

    setGuardando(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.put(
        `${API}/users/perfil`,
        {
          NomApeU: nombre.trim(),
          Email: email.trim(),
          EdadU: edad ? Number(edad) : null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      const usuarioActualizado = res.data?.usuario || {
        ...usuario,
        NomApeU: nombre.trim(),
        Email: email.trim(),
        EdadU: edad ? Number(edad) : null
      }

      // Actualizar localStorage y el estado del usuario en App
      localStorage.setItem('usuario', JSON.stringify(usuarioActualizado))
      if (onUsuarioActualizado) {
        onUsuarioActualizado(usuarioActualizado)
      }

      setMensaje({ tipo: 'exito', texto: res.data?.message || '¡Datos actualizados con éxito!' })
    } catch (error) {
      if (error.response?.status === 401 && onSesionExpirada) {
        onSesionExpirada()
        return
      }
      setMensaje({
        tipo: 'error',
        texto: error.response?.data?.message || 'No se pudieron actualizar los datos. Probá de nuevo.'
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="perfil-container">
      <div className="perfil-card">
        <div className="perfil-header">
          <div className="perfil-avatar">
            👤
          </div>
          <div className="perfil-titulos">
            <h1>Mi Perfil</h1>
            <p>Gestioná y actualizá tu información personal</p>
          </div>
        </div>

        {mensaje && (
          <div className={`perfil-alerta perfil-alerta-${mensaje.tipo}`} role="alert">
            {mensaje.tipo === 'exito' ? '✅' : '⚠️'} {mensaje.texto}
          </div>
        )}

        <form onSubmit={manejarGuardar} className="perfil-form">
          <div className="perfil-grupo">
            <label htmlFor="dni">DNI / Documento</label>
            <input
              id="dni"
              type="text"
              value={dni}
              disabled
              className="perfil-input-disabled"
              title="El DNI no puede ser modificado"
            />
            <span className="perfil-ayuda">Identificador único del sistema (no editable)</span>
          </div>

          <div className="perfil-grupo">
            <label htmlFor="nombre">Nombre y Apellido</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Gonzalo Martínez"
              required
            />
          </div>

          <div className="perfil-grupo">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="perfil-grupo">
            <label htmlFor="edad">Edad</label>
            <input
              id="edad"
              type="number"
              min="1"
              max="125"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              placeholder="Ej: 28"
            />
          </div>

          <div className="perfil-acciones">
            <button
              type="submit"
              className="btn-guardar"
              disabled={guardando}
            >
              {guardando ? 'Guardando cambios...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Perfil
