import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../css/Home.css'

const API = 'http://localhost:3000'

function Home({ usuario }) {
  const navigate = useNavigate()
  const [hospitales, setHospitales] = useState([])
  const [hospitalSeleccionado, setHospitalSeleccionado] = useState(null)
  const [cargandoHosp, setCargandoHosp] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    axios.get(`${API}/valoraciones/hospitales`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const datos = Array.isArray(res.data) ? res.data : []
        setHospitales(datos)
        if (datos.length > 0) {
          setHospitalSeleccionado(datos[0])
        }
      })
      .catch((err) => {
        console.error('Error al cargar hospitales:', err)
        setHospitales([])
      })
      .finally(() => {
        setCargandoHosp(false)
      })
  }, [])

  // Ubicación para el mapa usando directamente la dirección del hospital (Google Maps)
  const direccionHospital = hospitalSeleccionado
    ? `${hospitalSeleccionado.NombreH}, ${hospitalSeleccionado.DireccionH}`
    : 'Hospitales Buenos Aires Argentina'
  const query = encodeURIComponent(direccionHospital)
  const mapUrl = `https://maps.google.com/maps?q=${query}&output=embed`

  return (
    <div className="home-wrapper">
      {/* Hero Bienvenida */}
      <section className="home-hero">
        <div className="hero-content">
          <span className="hero-badge"> Portal de Salud</span>
          <h1 className="home-title">
            ¡Hola{usuario?.NomApeU ? `, ${usuario.NomApeU}` : ''}!
          </h1>
          <p className="home-subtitle">
            Bienvenido a <strong>TurnoSalud</strong>. Gestioná tus consultas médicas, conocé tu cobertura y encontrá la mejor atención en nuestra red de hospitales.
          </p>
        </div>
      </section>

      {/* Tarjetas de Acceso Rápido */}
      <section className="home-grid">
        <div className="home-card card-turnos" onClick={() => navigate('/turnos')}>
          <div className="card-icon"></div>
          <h3>Mis Turnos</h3>
          <p>Consultá tus citas médicas programadas y reservá nuevos turnos disponibles.</p>
          <span className="card-btn">Gestionar turnos &rarr;</span>
        </div>

        <div className="home-card card-planes" onClick={() => navigate('/planes')}>
          <div className="card-icon"></div>
          <h3>Planes de Salud</h3>
          <p>Administrá tu cobertura actual, compará prepagas y cambiá de plan fácilmente.</p>
          <span className="card-btn">Ver planes &rarr;</span>
        </div>

        <div className="home-card card-valoraciones" onClick={() => navigate('/valoraciones')}>
          <div className="card-icon"></div>
          <h3>Valoraciones</h3>
          <p>Consultá calificaciones de hospitales y compartí tu experiencia de atención.</p>
          <span className="card-btn">Ver opiniones &rarr;</span>
        </div>
      </section>

      {/* Sección Mapa de Hospitales */}
      <section className="home-mapa-seccion">
        <div className="mapa-header">
          <div className="mapa-titulos">
            <span className="seccion-tag"> Red Hospitalaria</span>
            <h2>Ubicación de Hospitales</h2>
            <p>Conocé nuestros centros de salud. Podés seleccionar cada hospital para centrarlo en el mapa.</p>
          </div>
          <div className="mapa-badge-info">
            {hospitales.length} centros disponibles
          </div>
        </div>

        <div className="mapa-contenedor-principal">
          {/* Vista previa del Mapa */}
          <div className="mapa-frame-card">
            <iframe
              title="Mapa de Hospitales"
              className="mapa-iframe"
              src={mapUrl}
              loading="lazy"
            />
            {hospitalSeleccionado && (
              <div className="mapa-pin-info">
                <strong> {hospitalSeleccionado.NombreH}</strong>
                <span>{hospitalSeleccionado.DireccionH}</span>
              </div>
            )}
          </div>

          {/* Lista de Hospitales */}
          <div className="hospitales-sidebar">
            <h4 className="sidebar-titulo">Centros Médicos Asociados</h4>
            <div className="hospitales-lista">
              {cargandoHosp ? (
                <p className="cargando-texto">Cargando centros médicos...</p>
              ) : hospitales.length === 0 ? (
                <p className="cargando-texto">No hay hospitales registrados en la base de datos.</p>
              ) : (
                hospitales.map((hosp) => {
                  const esActivo = hospitalSeleccionado?.IDHospital === hosp.IDHospital
                  return (
                    <div
                      key={hosp.IDHospital}
                      className={`hospital-item ${esActivo ? 'seleccionado' : ''}`}
                      onClick={() => setHospitalSeleccionado(hosp)}
                    >
                      <div className="hospital-item-header">
                        <span className="hospital-nombre">{hosp.NombreH}</span>
                        <span className="badge-estado">{hosp.EstadoH || 'Activo'}</span>
                      </div>
                      <p className="hospital-direccion"> {hosp.DireccionH || 'Sin dirección informada'}</p>
                      {hosp.SitioWeb && (
                        <a
                          href={hosp.SitioWeb}
                          target="_blank"
                          rel="noreferrer"
                          className="hospital-web"
                          onClick={(e) => e.stopPropagation()}
                        >
                           Visitar sitio web
                        </a>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
