import { useEffect, useState } from "react"
import axios from "axios"
import "../css/Historial.css"

const API = "http://localhost:3000"
const conToken = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
})

const estrellas = (n) => "★".repeat(n) + "☆".repeat(5 - n)

function Historial({ onSesionExpirada }) {
    const [historial, setHistorial] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState("")
    const [exito, setExito] = useState("")

    const [calificando, setCalificando] = useState(null) // la cita elegida
    const [puntaje, setPuntaje] = useState(0)
    const [hover, setHover] = useState(0)
    const [comentario, setComentario] = useState("")
    const [errorForm, setErrorForm] = useState("")
    const [enviando, setEnviando] = useState(false)

    const cargar = async () => {
        setCargando(true)
        setError("")
        try {
            const res = await axios.get(`${API}/turnos/historial`, conToken())
            setHistorial(res.data.historial)
        } catch (e) {
            if (e.response?.status === 401) {
                if (onSesionExpirada) onSesionExpirada()
                return
            }
            setError(e.response?.data?.message || "No se puede completar la operación en este momento.")
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        cargar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const abrir = (cita) => {
        setCalificando(cita)
        setPuntaje(0)
        setHover(0)
        setComentario("")
        setErrorForm("")
        setExito("")
    }

    const cerrar = () => setCalificando(null)

    const enviar = async (event) => {
        event.preventDefault()
        if (puntaje === 0) {
            setErrorForm("Elegí una calificación de 1 a 5 estrellas.")
            return
        }
        setEnviando(true)
        setErrorForm("")
        try {
            const res = await axios.put(
                `${API}/turnos/calificar`,
                { IDCita: calificando.IDCita, calificacion: puntaje, comentario },
                conToken()
            )
            cerrar()
            setExito(res.data.message)
            await cargar()
        } catch (e) {
            if (e.response?.status === 401) {
                if (onSesionExpirada) onSesionExpirada()
                return
            }
            setErrorForm(
                e.response?.data?.errores?.join(" ") ||
                e.response?.data?.message ||
                "No se pudo enviar la calificación."
            )
        } finally {
            setEnviando(false)
        }
    }

    if (cargando) return <div className="historial"><p>Cargando turnos...</p></div>

    return (
        <div className="historial">
            <h1>Mis turnos</h1>

            {exito && <p className="historial-exito" role="status">{exito}</p>}

            {error && (
                <div className="historial-error" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={cargar}>Reintentar</button>
                </div>
            )}

            {!error && historial.length === 0 && <p>No tenés consultas registradas</p>}

            {!error && historial.length > 0 && (
                <table className="historial-tabla">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Médico</th>
                            <th>Hospital</th>
                            <th>Estado</th>
                            <th>Calificada</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historial.map((c) => (
                            <tr key={c.IDCita}>
                                <td>{new Date(c.FechaVisita).toLocaleString("es-AR")}</td>
                                <td>{c.Medico}</td>
                                <td>{c.Hospital}</td>
                                <td>{c.Estado}</td>
                                <td>
                                    {c.Calificada ? (
                                        <span className="estrellas-fijas" title={c.Comentario || ""}>
                                            {estrellas(c.Calificacion || 0)}
                                        </span>
                                    ) : c.Estado === "Finalizada" ? (
                                        <button type="button" className="btn-calificar" onClick={() => abrir(c)}>
                                            Calificar
                                        </button>
                                    ) : (
                                        "No"
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {calificando && (
                <div className="calificar-fondo" onClick={cerrar}>
                    <form className="calificar-form" onClick={(e) => e.stopPropagation()} onSubmit={enviar}>
                        <h2>Calificar atención</h2>
                        <p className="calificar-detalle">
                            {calificando.Medico} · {calificando.Hospital}
                        </p>

                        <div className="estrellas" onMouseLeave={() => setHover(0)}>
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    className={n <= (hover || puntaje) ? "estrella llena" : "estrella"}
                                    onMouseEnter={() => setHover(n)}
                                    onClick={() => setPuntaje(n)}
                                    aria-label={`${n} estrellas`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <label className="calificar-comentario">Comentario (opcional)
                            <textarea
                                maxLength={255}
                                rows={3}
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                            />
                        </label>

                        {errorForm && <p className="calificar-error" role="alert">{errorForm}</p>}

                        <div className="calificar-acciones">
                            <button type="button" className="btn-cancelar" onClick={cerrar}>Cancelar</button>
                            <button type="submit" disabled={enviando}>
                                {enviando ? "Enviando..." : "Enviar calificación"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}

export default Historial