import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/Buscador.css'

const API = 'http://localhost:3000'

const FILTROS_VACIOS = { nombre: '', especialidad: '', prepaga: '', plan: '' }

function Buscador({ onSesionExpirada }) {
  const [opciones, setOpciones] = useState({ especialidades: [], prepagas: [], planes: [] })
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const [resultados, setResultados] = useState([])
  const [seleccionado, setSeleccionado] = useState(null)

  // Carga las opciones de los desplegables
  useEffect(() => {
    const token = localStorage.getItem('token')
    axios.get(`${API}/buscador/opciones`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setOpciones(res.data))
      .catch(err => {
        if (err.response?.status === 401) onSesionExpirada?.()
        console.error('Error al cargar opciones:', err)
      })
  }, [])

  // Busca cada vez que cambia un filtro
  useEffect(() => {
    const token = localStorage.getItem('token')
    axios.get(`${API}/buscador/buscar`, {
      headers: { Authorization: `Bearer ${token}` },
      params: filtros
    })
      .then(res => {
        const datos = Array.isArray(res.data) ? res.data : []
        setResultados(datos)
        setSeleccionado(datos[0] || null)
      })
      .catch(err => {
        if (err.response?.status === 401) onSesionExpirada?.()
        console.error('Error al buscar:', err)
        setResultados([])
        setSeleccionado(null)
      })
  }, [filtros])

  const cambiar = e => setFiltros({ ...filtros, [e.target.name]: e.target.value })

  // Al cambiar de prepaga se borra el plan elegido
  const cambiarPrepaga = e => setFiltros({ ...filtros, prepaga: e.target.value, plan: '' })

  // Planes de la prepaga elegida (o todos), sin repetir
  const planesVisibles = [...new Set(
    opciones.planes
      .filter(p => !filtros.prepaga || p.prepaga === filtros.prepaga)
      .map(p => p.nombre)
  )]

  const mapUrl = seleccionado
    ? `https://maps.google.com/maps?q=${encodeURIComponent(`${seleccionado.NombreH}, ${seleccionado.DireccionH}`)}&output=embed`
    : null

  return (
    <div className="buscador-wrapper">
      <div className="buscador-header">
        <h2>Buscar hospital</h2>
        <p>Filtrá por nombre, especialidad, prepaga o plan. Podés combinar todos los filtros.</p>
      </div>

      <div className="buscador-filtros">
        <div className="buscador-campo">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            placeholder="Ej: Italiano"
            value={filtros.nombre}
            onChange={cambiar}
          />
        </div>

        <div className="buscador-campo">
          <label htmlFor="especialidad">Especialidad</label>
          <select id="especialidad" name="especialidad" value={filtros.especialidad} onChange={cambiar}>
            <option value="">Todas las especialidades</option>
            {opciones.especialidades.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div className="buscador-campo">
          <label htmlFor="prepaga">Prepaga</label>
          <select id="prepaga" name="prepaga" value={filtros.prepaga} onChange={cambiarPrepaga}>
            <option value="">Todas las prepagas</option>
            {opciones.prepagas.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="buscador-campo">
          <label htmlFor="plan">Plan</label>
          <select id="plan" name="plan" value={filtros.plan} onChange={cambiar}>
            <option value="">Todos los planes</option>
            {planesVisibles.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <button type="button" className="buscador-limpiar" onClick={() => setFiltros(FILTROS_VACIOS)}>
          Limpiar filtros
        </button>
      </div>

      <span className="buscador-contador">
        {resultados.length} hospital(es) encontrado(s)
      </span>

      <div className="buscador-contenido">
        {/* Lista de resultados */}
        <div className="buscador-lista">
          {resultados.length === 0 ? (
            <div className="buscador-vacio">
              No se encontraron hospitales con esos filtros.
            </div>
          ) : (
            resultados.map(h => (
              <div
                key={h.IDHospital}
                className={`buscador-item ${seleccionado?.IDHospital === h.IDHospital ? 'seleccionado' : ''}`}
                onClick={() => setSeleccionado(h)}
              >
                <h4 className="buscador-item-nombre">{h.NombreH}</h4>
                <p className="buscador-item-direccion">{h.DireccionH}</p>
                {h.SitioWeb && (
                  <a
                    className="buscador-item-web"
                    href={h.SitioWeb}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                  >
                    Visitar sitio web
                  </a>
                )}
              </div>
            ))
          )}
        </div>

        {/* Mapa */}
        <div className="buscador-mapa-card">
          {mapUrl ? (
            <>
              <iframe title="Mapa" className="buscador-mapa" src={mapUrl} loading="lazy" />
              <div className="buscador-mapa-info">
                <strong>{seleccionado.NombreH}</strong>
                <span>{seleccionado.DireccionH}</span>
              </div>
            </>
          ) : (
            <div className="buscador-mapa-vacio">
              Elegí un hospital de la lista para verlo en el mapa.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Buscador