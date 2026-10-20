import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import '../css/Valoraciones.css'

const API = 'http://localhost:3000'
const conToken = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

function fechaLegible(fecha) {
    return new Date(fecha).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

function Valoraciones({ onSesionExpirada }) {
    const [pestania, setPestania] = useState('buscar')
    const [hospitales, setHospitales] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [hospitalSeleccionado, setHospitalSeleccionado] = useState(null)
    const [promedio, setPromedio] = useState(null)
    const [misValoraciones, setMisValoraciones] = useState([])
    const [edicion, setEdicion] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [cargandoPromedio, setCargandoPromedio] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [mensaje, setMensaje] = useState(null)

    const manejarError = (error, porDefecto) => {
        if (error.response?.status === 401) {
            onSesionExpirada?.()
            return
        }

        setMensaje({
            tipo: 'error',
            texto: error.response?.data?.message || porDefecto
        })
    }

    const cargarDatos = async () => {
        setCargando(true)

        try {
            const [resHospitales, resValoraciones] = await Promise.all([
                axios.get(`${API}/valoraciones/hospitales`, conToken()),
                axios.get(`${API}/valoraciones/mis`, conToken())
            ])

            setHospitales(resHospitales.data)
            setMisValoraciones(resValoraciones.data)
        } catch (error) {
            manejarError(error, 'No se pudieron cargar las valoraciones')
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        cargarDatos()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const hospitalesFiltrados = useMemo(() => {
        const consulta = busqueda.trim().toLocaleLowerCase('es-AR')

        if (!consulta) return hospitales

        return hospitales.filter(hospital =>
            `${hospital.NombreH} ${hospital.DireccionH || ''} ${hospital.IDHospital}`
                .toLocaleLowerCase('es-AR')
                .includes(consulta)
        )
    }, [busqueda, hospitales])

    const consultarPromedio = async (hospital) => {
        setHospitalSeleccionado(hospital)
        setPromedio(null)
        setMensaje(null)
        setCargandoPromedio(true)

        try {
            const respuesta = await axios.get(
                `${API}/valoraciones/hospital/${hospital.IDHospital}/promedio`,
                conToken()
            )
            setPromedio(respuesta.data)
        } catch (error) {
            manejarError(error, 'No se pudo cargar el promedio. Podés reintentar.')
        } finally {
            setCargandoPromedio(false)
        }
    }

    const comenzarEdicion = (valoracion) => {
        setEdicion({
            IDValoracion: valoracion.IDValoracion,
            Calificacion: String(valoracion.Calificacion),
            Comentario: valoracion.Comentario || ''
        })
        setMensaje(null)
    }

    const guardarEdicion = async (event) => {
        event.preventDefault()
        setGuardando(true)
        setMensaje(null)

        try {
            const cambios = {
                Calificacion: Number(edicion.Calificacion),
                Comentario: edicion.Comentario.trim() || null
            }

            const respuesta = await axios.put(
                `${API}/valoraciones/${edicion.IDValoracion}`,
                cambios,
                conToken()
            )

            setMisValoraciones(actuales =>
                actuales.map(valoracion =>
                    valoracion.IDValoracion === edicion.IDValoracion
                        ? { ...valoracion, ...respuesta.data.valoracion }
                        : valoracion
                )
            )

            setEdicion(null)
            setMensaje({ tipo: 'exito', texto: respuesta.data.message })

            if (hospitalSeleccionado?.IDHospital === respuesta.data.valoracion.IDHospital) {
                await consultarPromedio(hospitalSeleccionado)
            }
        } catch (error) {
            manejarError(error, 'No se pudo actualizar la valoración. Podés reintentar.')
        } finally {
            setGuardando(false)
        }
    }

    const cambiarPestania = (nombre) => {
        setPestania(nombre)
        setMensaje(null)
        setEdicion(null)
    }

    return (
        <section className="valoraciones">
            <div className="valoraciones-encabezado">
                <span className="valoraciones-eyebrow">TU SALUD, TU OPINIÓN</span>
                <h1>Valoraciones</h1>
                <p>Consultá la experiencia de otros pacientes o actualizá tu opinión.</p>
            </div>

            <div
                className="valoraciones-tabs"
                role="tablist"
                aria-label="Secciones de valoraciones"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={pestania === 'buscar'}
                    className={pestania === 'buscar' ? 'activo' : ''}
                    onClick={() => cambiarPestania('buscar')}
                >
                    Buscar hospital
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={pestania === 'mias'}
                    className={pestania === 'mias' ? 'activo' : ''}
                    onClick={() => cambiarPestania('mias')}
                >
                    Mis valoraciones <span>{misValoraciones.length}</span>
                </button>
            </div>

            {mensaje && (
                <div className={`valoraciones-mensaje ${mensaje.tipo}`} role="alert">
                    {mensaje.texto}
                </div>
            )}

            {pestania === 'buscar' && (
                <div className="valoraciones-busqueda">
                    <label className="valoraciones-label" htmlFor="buscar-hospital">
                        Encontrá un hospital
                    </label>

                    <input
                        id="buscar-hospital"
                        className="valoraciones-input"
                        type="search"
                        placeholder="Buscar por nombre, dirección o ID"
                        value={busqueda}
                        onChange={event => setBusqueda(event.target.value)}
                    />

                    <div className="valoraciones-layout">
                        <div className="hospitales-lista" aria-label="Hospitales activos">
                            {cargando ? (
                                <p className="valoraciones-vacio">Cargando hospitales...</p>
                            ) : hospitalesFiltrados.length === 0 ? (
                                <p className="valoraciones-vacio">
                                    No encontramos hospitales con esa búsqueda.
                                </p>
                            ) : (
                                hospitalesFiltrados.map(hospital => (
                                    <button
                                        key={hospital.IDHospital}
                                        type="button"
                                        className={`hospital-opcion ${
                                            hospitalSeleccionado?.IDHospital === hospital.IDHospital
                                                ? 'seleccionado'
                                                : ''
                                        }`}
                                        onClick={() => consultarPromedio(hospital)}
                                    >
                                        <span className="hospital-icono" aria-hidden="true">✚</span>

                                        <span className="hospital-datos">
                                            <strong>{hospital.NombreH}</strong>
                                            <small>
                                                {hospital.DireccionH || `Hospital #${hospital.IDHospital}`}
                                            </small>
                                        </span>

                                        <span className="hospital-flecha" aria-hidden="true">›</span>
                                    </button>
                                ))
                            )}
                        </div>

                        <article className="promedio-panel" aria-live="polite">
                            {!hospitalSeleccionado ? (
                                <div className="promedio-placeholder">
                                    <span aria-hidden="true">☆</span>
                                    <h2>Elegí un hospital</h2>
                                    <p>
                                        Vas a ver su promedio y la cantidad de pacientes que lo calificaron.
                                    </p>
                                </div>
                            ) : cargandoPromedio ? (
                                <div className="promedio-placeholder">
                                    <span className="promedio-spinner" />
                                    <p>Consultando valoraciones...</p>
                                </div>
                            ) : promedio ? (
                                <>
                                    <span className="promedio-etiqueta">
                                        PROMEDIO DE VALORACIONES
                                    </span>

                                    <h2>{promedio.hospital.NombreH}</h2>

                                    <div className="promedio-numero">
                                        {promedio.promedio === null
                                            ? '—'
                                            : promedio.promedio.toFixed(2)}
                                        <span>/ 5</span>
                                    </div>

                                    <div className="promedio-estrellas">
                                        {'★'.repeat(Math.round(promedio.promedio || 0))}
                                        {'☆'.repeat(5 - Math.round(promedio.promedio || 0))}
                                    </div>

                                    <p className="promedio-cantidad">
                                        {promedio.cantidad}{' '}
                                        {promedio.cantidad === 1 ? 'calificación' : 'calificaciones'}
                                    </p>

                                    {promedio.message && (
                                        <p className="promedio-sin-datos">{promedio.message}</p>
                                    )}
                                </>
                            ) : (
                                <div className="promedio-placeholder">
                                    <span aria-hidden="true">☆</span>
                                    <h2>Sin resultados todavía</h2>
                                    <p>Podés volver a seleccionar el hospital para reintentar.</p>
                                </div>
                            )}
                        </article>
                    </div>
                </div>
            )}

            {pestania === 'mias' && (
                <div className="mis-valoraciones">
                    {cargando ? (
                        <p className="valoraciones-vacio">Cargando tus valoraciones...</p>
                    ) : misValoraciones.length === 0 ? (
                        <div className="valoraciones-vacio-card">
                            <span aria-hidden="true">✎</span>
                            <h2>Todavía no tenés valoraciones</h2>
                            <p>
                                Cuando hayas dejado una opinión sobre un hospital, vas a poder verla
                                y editarla desde acá.
                            </p>
                        </div>
                    ) : (
                        misValoraciones.map(valoracion => (
                            <article className="valoracion-card" key={valoracion.IDValoracion}>
                                <div className="valoracion-card-cabecera">
                                    <div>
                                        <span className="valoracion-hospital-label">HOSPITAL</span>
                                        <h2>
                                            {valoracion.Hospital?.NombreH ||
                                                `Hospital #${valoracion.IDHospital}`}
                                        </h2>
                                    </div>

                                    <span
                                        className={`valoracion-estado ${
                                            valoracion.editable ? 'editable' : ''
                                        }`}
                                    >
                                        {valoracion.editable ? 'Editable' : 'Plazo vencido'}
                                    </span>
                                </div>

                                <div className="valoracion-estrellas">
                                    {'★'.repeat(valoracion.Calificacion)}
                                    {'☆'.repeat(5 - valoracion.Calificacion)}
                                </div>

                                <p className="valoracion-comentario">
                                    {valoracion.Comentario || 'Sin comentario.'}
                                </p>

                                <p className="valoracion-fecha">
                                    Publicada el {fechaLegible(valoracion.FechaValoracion)}
                                    {valoracion.editable && (
                                        <> · Podés editarla hasta el {fechaLegible(valoracion.fechaLimiteEdicion)}</>
                                    )}
                                </p>

                                {edicion?.IDValoracion === valoracion.IDValoracion ? (
                                    <form className="valoracion-form" onSubmit={guardarEdicion}>
                                        <label>
                                            Calificación
                                            <select
                                                value={edicion.Calificacion}
                                                onChange={event =>
                                                    setEdicion({
                                                        ...edicion,
                                                        Calificacion: event.target.value
                                                    })
                                                }
                                            >
                                                {[5, 4, 3, 2, 1].map(numero => (
                                                    <option key={numero} value={numero}>
                                                        {numero} {numero === 1 ? 'estrella' : 'estrellas'}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label>
                                            Comentario
                                            <textarea
                                                rows="3"
                                                maxLength="2000"
                                                placeholder="Contanos tu experiencia"
                                                value={edicion.Comentario}
                                                onChange={event =>
                                                    setEdicion({
                                                        ...edicion,
                                                        Comentario: event.target.value
                                                    })
                                                }
                                            />
                                        </label>

                                        <div className="valoracion-form-acciones">
                                            <button
                                                type="button"
                                                className="btn-secundario"
                                                onClick={() => setEdicion(null)}
                                                disabled={guardando}
                                            >
                                                Cancelar
                                            </button>

                                            <button
                                                type="submit"
                                                className="btn-principal"
                                                disabled={guardando}
                                            >
                                                {guardando ? 'Guardando...' : 'Guardar cambios'}
                                            </button>
                                        </div>
                                    </form>
                                ) : valoracion.editable ? (
                                    <button
                                        type="button"
                                        className="valoracion-editar"
                                        onClick={() => comenzarEdicion(valoracion)}
                                    >
                                        Editar valoración <span aria-hidden="true">→</span>
                                    </button>
                                ) : (
                                    <p className="valoracion-solo-lectura">
                                        Esta valoración está disponible en modo de solo lectura.
                                    </p>
                                )}
                            </article>
                        ))
                    )}
                </div>
            )}
        </section>
    )
}

export default Valoraciones