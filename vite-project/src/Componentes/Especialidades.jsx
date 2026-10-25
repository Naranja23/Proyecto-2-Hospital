import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import '../css/Especialidades.css'

const API = 'http://localhost:3000'

function authConfig() {
  return {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  }
}

function mensajeError(error, fallback) {
  return error.response?.data?.message ||
    error.response?.data?.mensaje ||
    fallback
}

export default function Especialidades({ onSesionExpirada }) {
  const [especialidades, setEspecialidades] = useState([])
  const [medicos, setMedicos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [formulario, setFormulario] = useState(null)
  const [nombre, setNombre] = useState('')
  const [asignacion, setAsignacion] = useState(null)
  const [medicosSeleccionados, setMedicosSeleccionados] = useState([])
  const [busquedaMedico, setBusquedaMedico] = useState('')

  const sesionExpirada = useRef(onSesionExpirada)
  sesionExpirada.current = onSesionExpirada

  const cargar = useCallback(async () => {
    setCargando(true)
    setAviso(null)

    try {
      const config = authConfig()
      const [especialidadesResponse, medicosResponse] = await Promise.all([
        axios.get(`${API}/especialidades`, config),
        axios.get(`${API}/especialidades/medicos`, config)
      ])

      setEspecialidades(
        Array.isArray(especialidadesResponse.data)
          ? especialidadesResponse.data
          : []
      )
      setMedicos(
        Array.isArray(medicosResponse.data) ? medicosResponse.data : []
      )
    } catch (error) {
      if (error.response?.status === 401) {
        sesionExpirada.current?.()
        return
      }

      setAviso({
        tipo: 'error',
        texto: mensajeError(
          error,
          'No se pudo cargar el catálogo de especialidades.'
        )
      })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase('es')
    return especialidades.filter((item) =>
      item.NombreEspecialidad.toLocaleLowerCase('es').includes(texto)
    )
  }, [especialidades, busqueda])

  function abrirFormulario(item = null) {
    setFormulario(item || {})
    setNombre(item?.NombreEspecialidad || '')
  }

  async function guardarEspecialidad(event) {
    event.preventDefault()

    const valor = nombre.trim()
    if (!valor) {
      setAviso({ tipo: 'error', texto: 'Ingresá el nombre de la especialidad.' })
      return
    }

    setGuardando(true)
    setAviso(null)
    const editando = Boolean(formulario?.IDEspecialidad)

    try {
      if (editando) {
        await axios.put(
          `${API}/especialidades/${formulario.IDEspecialidad}`,
          { nombre: valor },
          authConfig()
        )
      } else {
        await axios.post(
          `${API}/especialidades`,
          { nombre: valor },
          authConfig()
        )
      }

      setFormulario(null)
      await cargar()
      setAviso({
        tipo: 'ok',
        texto: editando
          ? 'Especialidad actualizada correctamente.'
          : 'Especialidad creada correctamente.'
      })
    } catch (error) {
      setAviso({
        tipo: 'error',
        texto: mensajeError(error, 'No se pudo guardar la especialidad.')
      })
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(item) {
    const confirmar = window.confirm(
      `¿Eliminar la especialidad "${item.NombreEspecialidad}"?`
    )
    if (!confirmar) return

    setAviso(null)

    try {
      await axios.delete(
        `${API}/especialidades/${item.IDEspecialidad}`,
        authConfig()
      )
      await cargar()
      setAviso({ tipo: 'ok', texto: 'Especialidad eliminada correctamente.' })
    } catch (error) {
      setAviso({
        tipo: 'error',
        texto: mensajeError(error, 'No se pudo eliminar la especialidad.')
      })
    }
  }

  function abrirAsignacion(item) {
    setAsignacion(item)
    setBusquedaMedico('')
    setMedicosSeleccionados(
      (item.medicos || []).map((medico) => medico.IDMedico)
    )
  }

  async function guardarAsignacion(event) {
    event.preventDefault()
    setGuardando(true)
    setAviso(null)

    try {
      await axios.put(
        `${API}/especialidades/${asignacion.IDEspecialidad}/medicos`,
        { idsMedicos: medicosSeleccionados },
        authConfig()
      )

      setAsignacion(null)
      await cargar()
      setAviso({ tipo: 'ok', texto: 'Médicos asociados correctamente.' })
    } catch (error) {
      setAviso({
        tipo: 'error',
        texto: mensajeError(
          error,
          'No se pudieron actualizar los médicos asociados.'
        )
      })
    } finally {
      setGuardando(false)
    }
  }

  function toggleMedico(id) {
    setMedicosSeleccionados((actuales) =>
      actuales.includes(id)
        ? actuales.filter((actual) => actual !== id)
        : [...actuales, id]
    )
  }

  return (
    <section className="esp-page">
      <div className="esp-heading">
        <div>
          <span className="esp-eyebrow">ADMINISTRACIÓN MÉDICA</span>
          <h1>Especialidades</h1>
          <p>Organizá las áreas de atención y los profesionales asociados.</p>
        </div>

        <button
          className="esp-button esp-button--primary"
          type="button"
          onClick={() => abrirFormulario()}
        >
          ＋ Nueva especialidad
        </button>
      </div>

      <div className="esp-stats">
        <article>
          <span className="esp-stat-icon esp-stat-icon--violet">✳</span>
          <div>
            <small>Especialidades registradas</small>
            <strong>{especialidades.length}</strong>
          </div>
        </article>

        <article>
          <span className="esp-stat-icon esp-stat-icon--green">♧</span>
          <div>
            <small>Médicos en el sistema</small>
            <strong>{medicos.length}</strong>
          </div>
        </article>

        <article>
          <span className="esp-stat-icon esp-stat-icon--orange">↗</span>
          <div>
            <small>Con médicos asignados</small>
            <strong>
              {especialidades.filter((item) => item.medicos?.length).length}
            </strong>
          </div>
        </article>
      </div>

      <section className="esp-panel">
        <div className="esp-panel-heading">
          <div>
            <h2>Listado de especialidades</h2>
            <p>Administrá nombres y profesionales del sistema.</p>
          </div>

          <label className="esp-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar especialidad…"
            />
          </label>
        </div>

        {aviso && (
          <div
            className={`esp-alert esp-alert--${aviso.tipo}`}
            role={aviso.tipo === 'error' ? 'alert' : 'status'}
          >
            {aviso.texto}
          </div>
        )}

        <div className="esp-table-wrap">
          <table className="esp-table">
            <thead>
              <tr>
                <th>ESPECIALIDAD</th>
                <th>MÉDICOS ASOCIADOS</th>
                <th>PROFESIONALES</th>
                <th><span className="esp-sr-only">Acciones</span></th>
              </tr>
            </thead>

            <tbody>
              {!cargando && filtradas.map((item) => (
                <tr key={item.IDEspecialidad}>
                  <td>
                    <span className="esp-name">
                      <span className="esp-avatar">
                        {item.NombreEspecialidad.slice(0, 1).toLocaleUpperCase('es')}
                      </span>
                      {item.NombreEspecialidad}
                    </span>
                  </td>

                  <td>
                    <span className={`esp-count ${item.medicos?.length ? '' : 'esp-count--empty'}`}>
                      ♧ {item.medicos?.length || 0}{' '}
                      {(item.medicos?.length || 0) === 1 ? 'médico' : 'médicos'}
                    </span>
                  </td>

                  <td className="esp-doctor-names">
                    {item.medicos?.length
                      ? item.medicos.map((medico) => medico.NomApeM).join(', ')
                      : 'Sin profesionales asignados'}
                  </td>

                  <td>
                    <div className="esp-actions">
                      <button
                        type="button"
                        title="Asociar médicos"
                        aria-label={`Asociar médicos a ${item.NombreEspecialidad}`}
                        onClick={() => abrirAsignacion(item)}
                      >
                        ♧
                      </button>
                      <button
                        type="button"
                        title="Editar"
                        aria-label={`Editar ${item.NombreEspecialidad}`}
                        onClick={() => abrirFormulario(item)}
                      >
                        ✎
                      </button>
                      <button
                        className="esp-action--delete"
                        type="button"
                        title="Eliminar"
                        aria-label={`Eliminar ${item.NombreEspecialidad}`}
                        onClick={() => eliminar(item)}
                      >
                        ⌫
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {cargando && <div className="esp-empty">Cargando especialidades…</div>}

        {!cargando && filtradas.length === 0 && (
          <div className="esp-empty">
            <span>✳</span>
            <strong>
              {busqueda
                ? 'No encontramos coincidencias'
                : 'Todavía no hay especialidades'}
            </strong>
            <p>
              {busqueda
                ? 'Probá con otro nombre.'
                : 'Creá la primera para empezar a organizar el catálogo.'}
            </p>
          </div>
        )}

        <div className="esp-footer">
          <span>
            {filtradas.length}{' '}
            {filtradas.length === 1 ? 'resultado' : 'resultados'}
          </span>
          <button type="button" onClick={cargar}>↻ Actualizar</button>
        </div>
      </section>

      {formulario !== null && (
        <div
          className="esp-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFormulario(null)
          }}
        >
          <section
            className="esp-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="esp-form-title"
          >
            <button
              className="esp-close"
              type="button"
              onClick={() => setFormulario(null)}
              aria-label="Cerrar"
            >
              ×
            </button>

            <span className="esp-eyebrow">
              {formulario?.IDEspecialidad ? 'EDITAR REGISTRO' : 'NUEVO REGISTRO'}
            </span>
            <h2 id="esp-form-title">
              {formulario?.IDEspecialidad
                ? 'Editar especialidad'
                : 'Nueva especialidad'}
            </h2>
            <p>El nombre será visible en las búsquedas y en la información de los médicos.</p>

            <form onSubmit={guardarEspecialidad}>
              <label htmlFor="esp-nombre">Nombre de la especialidad</label>
              <input
                id="esp-nombre"
                autoFocus
                maxLength={100}
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ej.: Cardiología"
                required
              />

              <div className="esp-dialog-actions">
                <button
                  className="esp-button esp-button--quiet"
                  type="button"
                  onClick={() => setFormulario(null)}
                >
                  Cancelar
                </button>
                <button
                  className="esp-button esp-button--primary"
                  disabled={guardando}
                  type="submit"
                >
                  {guardando
                    ? 'Guardando…'
                    : formulario?.IDEspecialidad
                      ? 'Guardar cambios'
                      : 'Guardar especialidad'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {asignacion && (
        <div
          className="esp-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAsignacion(null)
          }}
        >
          <section
            className="esp-dialog esp-dialog--wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="esp-doctors-title"
          >
            <button
              className="esp-close"
              type="button"
              onClick={() => setAsignacion(null)}
              aria-label="Cerrar"
            >
              ×
            </button>

            <span className="esp-eyebrow">PROFESIONALES</span>
            <h2 id="esp-doctors-title">Médicos · {asignacion.NombreEspecialidad}</h2>
            <p>Seleccioná los médicos que pertenecen a esta especialidad. Guardar reemplaza la asociación actual.</p>

            <label className="esp-search esp-doctor-search">
              <span aria-hidden="true">⌕</span>
              <input
                value={busquedaMedico}
                onChange={(event) => setBusquedaMedico(event.target.value)}
                placeholder="Buscar por nombre o ID…"
              />
            </label>

            <div className="esp-doctor-list">
              {medicos
                .filter((medico) =>
                  `${medico.NomApeM} ${medico.IDMedico} ${medico.EspecialidadM || ''}`
                    .toLocaleLowerCase('es')
                    .includes(busquedaMedico.toLocaleLowerCase('es'))
                )
                .map((medico) => (
                  <label className="esp-doctor-option" key={medico.IDMedico}>
                    <input
                      type="checkbox"
                      checked={medicosSeleccionados.includes(medico.IDMedico)}
                      onChange={() => toggleMedico(medico.IDMedico)}
                    />
                    <span>
                      <strong>{medico.NomApeM}</strong>
                      <small>
                        ID {medico.IDMedico}
                        {medico.EspecialidadM ? ` · ${medico.EspecialidadM}` : ''}
                      </small>
                    </span>
                  </label>
                ))}

              {medicos.length === 0 && (
                <div className="esp-empty">No hay médicos disponibles.</div>
              )}
            </div>

            <form onSubmit={guardarAsignacion} className="esp-dialog-actions">
              <span className="esp-selected-count">
                {medicosSeleccionados.length} seleccionados
              </span>
              <button
                className="esp-button esp-button--quiet"
                type="button"
                onClick={() => setAsignacion(null)}
              >
                Cancelar
              </button>
              <button
                className="esp-button esp-button--primary"
                disabled={guardando}
                type="submit"
              >
                {guardando ? 'Guardando…' : 'Guardar médicos'}
              </button>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}