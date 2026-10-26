import { useEffect, useState } from "react"
import axios from "axios"
import "../css/Integridad.css"

const API = "http://localhost:3000"
const conToken = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
})

const MENSAJE_ERROR = "No fue posible completar la verificación."

// Pide la verificación al backend y devuelve siempre un objeto simple (nunca lanza error):
//   { tipo: "ok" | "inconsistente", datos }  -> 200 / 409 (el backend informa los errores)
//   { tipo: "sesion" }                       -> 401, la sesión ya no sirve
//   { tipo: "error", mensaje }               -> 500 u otro fallo
async function pedirVerificacion() {
    try {
        const res = await axios.get(`${API}/seguridad/integridad`, conToken())
        return { tipo: "ok", datos: res.data }
    } catch (error) {
        const status = error.response?.status
        if (status === 409) return { tipo: "inconsistente", datos: error.response.data }
        if (status === 401) return { tipo: "sesion" }
        return { tipo: "error", mensaje: error.response?.data?.message || MENSAJE_ERROR }
    }
}

// CU013 - Verificar integridad de la base de datos
function Integridad({ onSesionExpirada }) {
    const [verificando, setVerificando] = useState(true)
    const [resultado, setResultado] = useState(null)   // { ok, errores }
    const [error, setError] = useState("")
    const [confirmando, setConfirmando] = useState(false)
    const [rectificando, setRectificando] = useState(false)
    const [aviso, setAviso] = useState("")

    const aplicar = (r) => {
        if (r.tipo === "sesion") {
            if (onSesionExpirada) onSesionExpirada()
            return
        }
        if (r.tipo === "error") {
            setResultado(null)
            setError(r.mensaje)
        } else {
            setResultado(r.datos)
            setError("")
        }
        setVerificando(false)
    }

    // Verificación automática al abrir la pantalla
    useEffect(() => {
        let activo = true
        pedirVerificacion().then((r) => { if (activo) aplicar(r) })
        return () => { activo = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const verificarDeNuevo = async () => {
        setVerificando(true)
        setAviso("")
        setConfirmando(false)
        aplicar(await pedirVerificacion())
    }

    // Extensión del CU: Rectificar integridad (recalcula los dígitos verificadores)
    const rectificar = async () => {
        setRectificando(true)
        setError("")
        try {
            const res = await axios.post(`${API}/seguridad/integridad/rectificar`, {}, conToken())
            setResultado(res.data)
            setAviso(res.data.ok ? "Se rectificó la integridad: los dígitos verificadores fueron recalculados." : "")
            setConfirmando(false)
        } catch (e) {
            if (e.response?.status === 401) {
                if (onSesionExpirada) onSesionExpirada()
                return
            }
            setError(e.response?.data?.message || "No fue posible rectificar la integridad.")
        } finally {
            setRectificando(false)
        }
    }

    return (
        <div className="integridad">
            <h1>Integridad de la base de datos</h1>
            <p className="integridad-intro">
                Se recalculan los dígitos verificadores de cada registro (DVH) y de cada tabla (DVV)
                y se comparan con los guardados. Si no coinciden, alguien modificó los datos fuera del sistema.
            </p>

            <button type="button" className="integridad-boton" onClick={verificarDeNuevo} disabled={verificando || rectificando}>
                {verificando ? "Verificando..." : "Verificar ahora"}
            </button>

            {aviso && <p className="integridad-exito" role="status">{aviso}</p>}

            {error && (
                <div className="integridad-error" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={verificarDeNuevo} disabled={verificando}>Reintentar</button>
                </div>
            )}

            {verificando && !resultado && <p className="integridad-estado">Verificando la base de datos...</p>}

            {resultado?.ok && (
                <div className="integridad-ok" role="status">
                    <strong>La base de datos está íntegra.</strong>
                    <span>Todos los dígitos verificadores coinciden.</span>
                </div>
            )}

            {resultado && !resultado.ok && (
                <section className="integridad-fallas" aria-label="Inconsistencias detectadas">
                    <div className="integridad-alerta" role="alert">
                        <strong>Se detectaron {resultado.errores.length} inconsistencia(s).</strong>
                        <span>Los datos de estas tablas no coinciden con sus dígitos verificadores.</span>
                    </div>

                    <table className="integridad-tabla">
                        <thead>
                            <tr><th>Tabla</th><th>Qué falló</th><th>Registro</th></tr>
                        </thead>
                        <tbody>
                            {resultado.errores.map((e, i) => (
                                <tr key={`${e.tabla}-${e.tipo}-${e.fila ?? "t"}-${i}`}>
                                    <td>{e.tabla}</td>
                                    <td>{e.tipo === "DVH" ? "Registro alterado (DVH)" : "Tabla alterada (DVV)"}</td>
                                    <td>{e.tipo === "DVH" ? `Fila ${e.fila}` : "Toda la tabla"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {!confirmando ? (
                        <button type="button" className="integridad-rectificar" onClick={() => setConfirmando(true)} disabled={rectificando}>
                            Rectificar integridad
                        </button>
                    ) : (
                        <div className="integridad-confirmar" role="alertdialog">
                            <p>
                                <strong>Atención:</strong> rectificar toma los datos actuales como correctos y recalcula
                                los dígitos verificadores. Si los datos fueron manipulados, esa manipulación queda
                                aceptada. Lo ideal es restaurar un backup.
                            </p>
                            <div className="integridad-acciones">
                                <button type="button" className="integridad-cancelar" onClick={() => setConfirmando(false)} disabled={rectificando}>
                                    Cancelar
                                </button>
                                <button type="button" className="integridad-rectificar" onClick={rectificar} disabled={rectificando}>
                                    {rectificando ? "Rectificando..." : "Sí, rectificar"}
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}

export default Integridad