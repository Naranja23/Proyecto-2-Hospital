import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import '../css/Backups.css'

const API = 'http://localhost:3000/backups'

const DIAS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
]

function config() {
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  }
}

export default function Backups({ onSesionExpirada }) {
  const [frecuencia, setFrecuencia] = useState('diaria')
  const [hora, setHora] = useState('02:00')
  const [destino, setDestino] = useState('')
  const [diaSemana, setDiaSemana] = useState('1')
  const [diaMes, setDiaMes] = useState('1')
  const [estado, setEstado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)

  const sesionExpirada = useRef(onSesionExpirada)
  sesionExpirada.current = onSesionExpirada

  useEffect(() => {
    axios
      .get(API, config())
      .then(({ data }) => {
        if (!data) return

        setFrecuencia(data.Frecuencia)
        setHora(data.Hora)
        setDestino(data.Destino)
        setDiaSemana(String(data.DiaSemana ?? 1))
        setDiaMes(String(data.DiaMes ?? 1))

        setEstado({
          tipo: 'info',
          texto:
            `Último resultado: ${data.UltimoResultado || 'Sin ejecuciones'}` +
            (data.UltimoMensaje ? ` · ${data.UltimoMensaje}` : '')
        })
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          sesionExpirada.current?.()
        } else {
          setEstado({
            tipo: 'error',
            texto:
              error.response?.data?.message ||
              'No se pudo cargar la programación.'
          })
        }
      })
      .finally(() => setCargando(false))
  }, [])

  async function guardar(event) {
    event.preventDefault()
    setOcupado(true)
    setEstado(null)

    try {
      const { data } = await axios.put(
        API,
        {
          frecuencia,
          hora,
          destino,
          diaSemana: Number(diaSemana),
          diaMes: Number(diaMes)
        },
        config()
      )

      setEstado({ tipo: 'ok', texto: data.message })
    } catch (error) {
      if (error.response?.status === 401) {
        sesionExpirada.current?.()
      }

      setEstado({
        tipo: 'error',
        texto:
          error.response?.data?.message ||
          'No se pudo guardar la programación.'
      })
    } finally {
      setOcupado(false)
    }
  }

  async function ejecutarAhora() {
    setOcupado(true)
    setEstado({ tipo: 'info', texto: 'Generando la copia de seguridad…' })

    try {
      const { data } = await axios.post(
        `${API}/ejecutar`,
        {},
        config()
      )

      setEstado({ tipo: 'ok', texto: data.mensaje })
    } catch (error) {
      if (error.response?.status === 401) {
        sesionExpirada.current?.()
      }

      setEstado({
        tipo: 'error',
        texto:
          error.response?.data?.mensaje ||
          error.response?.data?.message ||
          'No se pudo generar la copia.'
      })
    } finally {
      setOcupado(false)
    }
  }

  return (
    <section className="backup-page">
      <header className="backup-heading">
        <span className="backup-kicker">ADMINISTRACIÓN DEL SISTEMA</span>
        <h1>Copias de seguridad</h1>
        <p>
          Programá copias automáticas de la base de datos y elegí dónde
          guardarlas.
        </p>
      </header>

      <form className="backup-card" onSubmit={guardar}>
        <h2>Programar backup automático</h2>
        <p>
          El servidor creará una copia cada vez que llegue el horario indicado.
        </p>

        {cargando ? (
          <p>Cargando programación…</p>
        ) : (
          <>
            <div className="backup-fields">
              <label>
                Frecuencia
                <select
                  value={frecuencia}
                  onChange={(event) => setFrecuencia(event.target.value)}
                >
                  <option value="diaria">Diaria</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </label>

              {frecuencia === 'semanal' && (
                <label>
                  Día de la semana
                  <select
                    value={diaSemana}
                    onChange={(event) => setDiaSemana(event.target.value)}
                  >
                    {DIAS.map((dia, indice) => (
                      <option value={indice} key={dia}>
                        {dia}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {frecuencia === 'mensual' && (
                <label>
                  Día del mes
                  <select
                    value={diaMes}
                    onChange={(event) => setDiaMes(event.target.value)}
                  >
                    {Array.from({ length: 31 }, (_, indice) => (
                      <option value={indice + 1} key={indice + 1}>
                        {indice + 1}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Horario
                <input
                  type="time"
                  value={hora}
                  onChange={(event) => setHora(event.target.value)}
                  required
                />
              </label>

              <label className="backup-destination">
                Carpeta de destino en el servidor
                <input
                  value={destino}
                  onChange={(event) => setDestino(event.target.value)}
                  placeholder="Ej.: C:\Backups\Hospital"
                  required
                />
                <small>
                  La carpeta debe existir y el servidor debe tener permiso para
                  escribir en ella.
                </small>
                <small>
                  El servidor necesita tener instalado pg_dump para crear copias
                  PostgreSQL.
                </small>
              </label>
            </div>

            {estado && (
              <div
                className={`backup-alert backup-alert--${estado.tipo}`}
                role={estado.tipo === 'error' ? 'alert' : 'status'}
              >
                {estado.texto}
              </div>
            )}

            <div className="backup-actions">
              <button type="submit" disabled={ocupado}>
                {ocupado ? 'Procesando…' : 'Guardar programación'}
              </button>

              <button
                type="button"
                className="backup-secondary"
                onClick={ejecutarAhora}
                disabled={ocupado || !destino}
              >
                Generar copia ahora
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  )
}