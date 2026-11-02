import { useEffect, useState } from "react"
import axios from "axios"
import "../css/SacarTurno.css"

const API = "http://localhost:3000"
const conToken = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
})

// Sugerencias de respaldo para el campo especialidad (se reemplazan por las que carga el administrador)
const ESPECIALIDADES_RESPALDO = [
    "Cardiología", "Dermatología", "Gastroenterología", "Ginecología", "Neumonología",
    "Neurología", "Oftalmología", "Pediatría", "Traumatología"
]
// Mismos horarios que usa el backend para proponer alternativas (9 a 17 hs)
const HORAS = Array.from({ length: 9 }, (_, i) => `${String(i + 9).padStart(2, "0")}:00`)

const dosDigitos = (n) => String(n).padStart(2, "0")
const aFechaLocal = (d) => `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`
const aHoraLocal = (d) => `${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`
const legible = (fecha, hora) =>
    new Date(`${fecha}T${hora}:00`).toLocaleString("es-AR", { dateStyle: "full", timeStyle: "short" })

// CU014 - Sacar turno
function SacarTurno({ onSesionExpirada }) {
    const [especialidad, setEspecialidad] = useState("")
    const [fecha, setFecha] = useState("")
    const [hora, setHora] = useState("09:00")

    const [buscando, setBuscando] = useState(false)
    const [erroresForm, setErroresForm] = useState([])
    const [errorBusqueda, setErrorBusqueda] = useState("")
    const [consulta, setConsulta] = useState(null)   // lo que se buscó (para volver a buscar)
    const [resultado, setResultado] = useState(null) // respuesta de POST /turnos/buscar

    const [elegido, setElegido] = useState(null)     // turno que el usuario está por confirmar
    const [reservando, setReservando] = useState(false)
    const [errorReserva, setErrorReserva] = useState("")
    const [exito, setExito] = useState(null)

    const [hospitales, setHospitales] = useState({}) // IDHospital -> nombre (para las alternativas)
    const [especialidades, setEspecialidades] = useState(ESPECIALIDADES_RESPALDO)

    useEffect(() => {
        let activo = true
        axios.get(`${API}/valoraciones/hospitales`, conToken())
            .then((res) => {
                if (activo) setHospitales(Object.fromEntries(res.data.map((h) => [h.IDHospital, h.NombreH])))
            })
            .catch(() => {}) // si falla, se muestra "Hospital #id"

        // Especialidades cargadas en el sistema (GET /especialidades)
        axios.get(`${API}/especialidades`, conToken())
            .then((res) => {
                const nombres = res.data.map((e) => e.NombreEspecialidad)
                if (activo && nombres.length > 0) setEspecialidades(nombres)
            })
            .catch(() => {}) // si falla, quedan las sugerencias de respaldo
        return () => { activo = false }
    }, [])

    const nombreHospital = (id) => hospitales[id] || `Hospital #${id}`

    // 401 = token vencido o sesión ya cerrada: volvemos al login
    const sesionVencida = (error) => {
        if (error.response?.status === 401) {
            if (onSesionExpirada) onSesionExpirada()
            return true
        }
        return false
    }

    // Paso 1: POST /turnos/buscar
    const buscar = async (datos) => {
        setBuscando(true)
        setErroresForm([])
        setErrorBusqueda("")
        setResultado(null)
        setElegido(null)
        try {
            const res = await axios.post(`${API}/turnos/buscar`, datos, conToken())
            setConsulta(datos)
            setResultado(res.data)
        } catch (error) {
            if (sesionVencida(error)) return
            if (error.response?.status === 400) {
                setErroresForm(error.response.data.errores || ["Revisá los datos ingresados."])
            } else {
                setErrorBusqueda(error.response?.data?.message || "No se pudo buscar turnos. Probá de nuevo.")
            }
        } finally {
            setBuscando(false)
        }
    }

    const enviarBusqueda = (event) => {
        event.preventDefault()
        setExito(null)
        setErrorReserva("")
        buscar({ especialidad: especialidad.trim(), fecha, hora })
    }

    const elegir = (medico, hospitalNombre, fechaTurno, horaTurno) => {
        setErrorReserva("")
        setElegido({
            DNIMedico: medico.DNIMedico,
            IDHospital: medico.IDHospital,
            medico: medico.NomApeM,
            hospital: hospitalNombre,
            fecha: fechaTurno,
            hora: horaTurno
        })
    }

    // Paso 2: POST /turnos/reservar
    const confirmar = async () => {
        setReservando(true)
        setErrorReserva("")
        try {
            await axios.post(
                `${API}/turnos/reservar`,
                { DNIMedico: elegido.DNIMedico, IDHospital: elegido.IDHospital, fecha: elegido.fecha, hora: elegido.hora },
                conToken()
            )
            setExito(elegido)
            setResultado(null)
            setElegido(null)
        } catch (error) {
            if (sesionVencida(error)) return
            if (error.response?.status === 409) {
                // Otra persona lo tomó primero: se vuelve a buscar para mostrar lo que sigue libre
                await buscar(consulta)
                setErrorReserva("Ese turno ya fue tomado por otra persona. Estas son las opciones actualizadas.")
            } else {
                setErrorReserva(error.response?.data?.message || "No se pudo reservar el turno. Probá de nuevo.")
                setElegido(null)
            }
        } finally {
            setReservando(false)
        }
    }

    return (
        <div className="turno">
            <h1>Sacar turno</h1>
            <p className="turno-intro">Elegí la especialidad y el momento en que querés ser atendido.</p>

            {exito && (
                <div className="turno-exito" role="status">
                    <strong>¡Turno reservado!</strong>
                    <span>{exito.medico} · {exito.hospital}</span>
                    <span>{legible(exito.fecha, exito.hora)}</span>
                </div>
            )}

            <form className="turno-form" onSubmit={enviarBusqueda}>
                <label>Especialidad
                    <input
                        list="turno-especialidades"
                        required
                        placeholder="Ej.: Cardiología"
                        value={especialidad}
                        onChange={(e) => setEspecialidad(e.target.value)}
                    />
                    <datalist id="turno-especialidades">
                        {especialidades.map((e) => <option key={e} value={e} />)}
                    </datalist>
                </label>
                <label>Fecha
                    <input
                        type="date"
                        required
                        min={aFechaLocal(new Date())}
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                    />
                </label>
                <label>Hora
                    <select value={hora} onChange={(e) => setHora(e.target.value)}>
                        {HORAS.map((h) => <option key={h} value={h}>{h} hs</option>)}
                    </select>
                </label>
                <button type="submit" className="turno-boton" disabled={buscando}>
                    {buscando ? "Buscando..." : "Buscar turnos"}
                </button>
            </form>

            {erroresForm.length > 0 && (
                <ul className="turno-error" role="alert">
                    {erroresForm.map((e) => <li key={e}>{e}</li>)}
                </ul>
            )}

            {errorBusqueda && (
                <div className="turno-error" role="alert">
                    <span>{errorBusqueda}</span>
                    <button type="button" onClick={() => buscar({ especialidad: especialidad.trim(), fecha, hora })}>
                        Reintentar
                    </button>
                </div>
            )}

            {errorReserva && <p className="turno-error" role="alert">{errorReserva}</p>}

            {resultado?.disponible && (
                <section className="turno-resultados" aria-label="Sucursales disponibles">
                    <h2>Sucursales con turno el {legible(consulta.fecha, consulta.hora)}</h2>
                    <div className="turno-grilla">
                        {resultado.sucursales.map(({ hospital, medicos }) => (
                            <article key={hospital.IDHospital} className="turno-tarjeta">
                                <h3>{hospital.NombreH}</h3>
                                <p className="turno-direccion">{hospital.DireccionH}</p>
                                <ul>
                                    {medicos.map((m) => (
                                        <li key={m.DNIMedico}>
                                            <span>{m.NomApeM}</span>
                                            <button
                                                type="button"
                                                className="turno-boton"
                                                onClick={() => elegir(m, hospital.NombreH, consulta.fecha, consulta.hora)}
                                            >
                                                Elegir
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {resultado && !resultado.disponible && (
                <section className="turno-resultados" aria-label="Horarios alternativos">
                    <p className="turno-aviso">
                        No hay turnos disponibles de {consulta.especialidad} para ese horario.
                    </p>
                    {resultado.alternativas.length === 0 ? (
                        <p>Tampoco encontramos horarios libres en los próximos 7 días. Probá con otra especialidad.</p>
                    ) : (
                        <>
                            <h2>Horarios alternativos</h2>
                            <div className="turno-grilla">
                                {resultado.alternativas.map((alt) => {
                                    const d = new Date(alt.fecha)
                                    const fechaAlt = aFechaLocal(d)
                                    const horaAlt = aHoraLocal(d)
                                    return (
                                        <article key={alt.fecha} className="turno-tarjeta">
                                            <h3>{legible(fechaAlt, horaAlt)}</h3>
                                            <ul>
                                                {alt.medicos.map((m) => (
                                                    <li key={m.DNIMedico}>
                                                        <span>
                                                            {m.NomApeM}
                                                            <small>{nombreHospital(m.IDHospital)}</small>
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="turno-boton"
                                                            onClick={() => elegir(m, nombreHospital(m.IDHospital), fechaAlt, horaAlt)}
                                                        >
                                                            Elegir
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </article>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </section>
            )}

            {elegido && (
                <div className="turno-fondo" onClick={() => !reservando && setElegido(null)}>
                    <div className="turno-confirmar" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h2>Confirmar turno</h2>
                        <dl>
                            <div><dt>Médico</dt><dd>{elegido.medico}</dd></div>
                            <div><dt>Hospital</dt><dd>{elegido.hospital}</dd></div>
                            <div><dt>Fecha y hora</dt><dd>{legible(elegido.fecha, elegido.hora)}</dd></div>
                        </dl>
                        <div className="turno-acciones">
                            <button type="button" className="turno-cancelar" onClick={() => setElegido(null)} disabled={reservando}>
                                Cancelar
                            </button>
                            <button type="button" className="turno-boton" onClick={confirmar} disabled={reservando}>
                                {reservando ? "Reservando..." : "Confirmar turno"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SacarTurno