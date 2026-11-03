import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'
import '../css/Panel.css'

const SIN_INFO = 'Sin información disponible'

function Tarjeta({ icono, color, titulo, valor, detalle }) {
  const sinInfo = valor === null || valor === undefined
  return (
    <article className="pan-card">
      <span className={`pan-icon pan-icon--${color}`} aria-hidden="true">{icono}</span>
      <div>
        <small>{titulo}</small>
        {sinInfo
          ? <p className="pan-sin-info">{SIN_INFO}</p>
          : <strong>{valor}</strong>}
        {detalle && !sinInfo && <span className="pan-detalle">{detalle}</span>}
      </div>
    </article>
  )
}

export default function Panel({ onSesionExpirada }) {
  const [panel, setPanel] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const sesionExpirada = useRef(onSesionExpirada)
  sesionExpirada.current = onSesionExpirada

  // Abrir el panel y "Actualizar panel" son la misma consulta
  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const { data } = await api.get('/panel')
      setPanel(data)
    } catch (e) {
      if (e.response?.status === 401) {
        sesionExpirada.current?.()
        return
      }
      setPanel(null) // F3: no se muestran datos parciales
      setError({
        denegado: e.response?.status === 403,
        texto: e.response?.data?.message ||
          'No se puede completar la operación en este momento. Intentá de nuevo más tarde.'
      })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const hora = panel?.actualizado
    ? new Date(panel.actualizado).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <section className="pan-page">
      <div className="pan-heading">
        <div>
          <span className="pan-eyebrow">ADMINISTRACIÓN</span>
          <h1>Panel administrativo</h1>
          <p>Información general y estadísticas de uso del sistema.</p>
        </div>

        <button
          className="pan-button"
          type="button"
          onClick={cargar}
          disabled={cargando}
        >
          {cargando ? 'Actualizando…' : '↻ Actualizar panel'}
        </button>
      </div>

      {error && (
        <div className="pan-alert" role="alert">
          <span>{error.texto}</span>
          {!error.denegado && (
            <button type="button" onClick={cargar} disabled={cargando}>Reintentar</button>
          )}
        </div>
      )}

      {!error && cargando && !panel && <div className="pan-empty">Cargando panel…</div>}

      {panel && (
        <>
          <h2 className="pan-section">Usuarios</h2>
          <div className="pan-grid">
            <Tarjeta icono="●" color="green" titulo="Usuarios activos" valor={panel.usuarios?.activos} />
            <Tarjeta icono="⊘" color="orange" titulo="Usuarios bloqueados" valor={panel.usuarios?.bloqueados} />
            <Tarjeta icono="◷" color="violet" titulo="Turnos del día" valor={panel.turnosHoy} />
          </div>

          <h2 className="pan-section">Hospitales</h2>
          <div className="pan-grid">
            <Tarjeta icono="✚" color="green" titulo="Hospitales activos" valor={panel.hospitales?.activos} />
            <Tarjeta icono="⊘" color="orange" titulo="Hospitales bloqueados" valor={panel.hospitales?.bloqueados} />
            <Tarjeta
              icono="★"
              color="violet"
              titulo="Promedio de valoraciones"
              valor={panel.valoraciones?.promedio}
              detalle={`${panel.valoraciones?.cantidad || 0} valoraciones`}
            />
          </div>

          {hora && <p className="pan-actualizado">Actualizado a las {hora}</p>}
        </>
      )}
    </section>
  )
}