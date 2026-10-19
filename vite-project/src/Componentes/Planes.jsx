import { useEffect, useState } from "react"
import axios from "axios"
import "../css/Planes.css"

const API = "http://localhost:3000"
const conToken = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
})

// Campos que devuelve hoy el modelo Plan (para resaltar diferencias, CU015 F1-d)
const CAMPOS = [
    { clave: "TipoPlan", etiqueta: "Tipo" },
    { clave: "EstadoPlan", etiqueta: "Estado" },
    { clave: "IDPrepaga", etiqueta: "Prepaga" },
    { clave: "IDHospital", etiqueta: "Hospital" }
]

function Planes({ onSesionExpirada }) {
    const [pestania, setPestania] = useState("ver") // ver | administrar | cambiar
    const [planes, setPlanes] = useState([])
    const [planActual, setPlanActual] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [mensaje, setMensaje] = useState(null) // { tipo: "exito" | "error", texto }
    const [seleccionado, setSeleccionado] = useState(null)
    const [tarjeta, setTarjeta] = useState("")
    const [errores, setErrores] = useState([])
    const [pagando, setPagando] = useState(false)

    // 401 = token vencido o sesión ya cerrada: volvemos al login
    const manejarError = (error, textoPorDefecto) => {
        if (error.response?.status === 401) {
            if (onSesionExpirada) onSesionExpirada()
            return
        }
        setMensaje({ tipo: "error", texto: error.response?.data?.message || textoPorDefecto })
    }

    const cargarDatos = async () => {
        try {
            const resPlanes = await axios.get(`${API}/planes`, conToken())
            setPlanes(resPlanes.data)
        } catch (error) {
            manejarError(error, "No se pudieron obtener los planes")
        }
        try {
            const resActual = await axios.get(`${API}/planes/actual`, conToken())
            setPlanActual(resActual.data)
        } catch (error) {
            // 404 = no tiene plan activo: no es un error para la pantalla
            if (error.response?.status === 404) setPlanActual(null)
            else manejarError(error, "No se pudo obtener tu plan")
        }
        setCargando(false)
    }

    useEffect(() => {
        cargarDatos()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const irAPestania = (nombre) => {
        setMensaje(null)
        setErrores([])
        setPestania(nombre)
    }

    // CU015 F4: "Eliminar plan" -> el sistema avisa que no se puede y pide elegir uno nuevo
    const eliminarPlan = async () => {
        setMensaje(null)
        try {
            await axios.delete(`${API}/planes/actual`, conToken())
            await cargarDatos()
        } catch (error) {
            if (error.response?.status === 401) return manejarError(error)
            setPestania("cambiar")
            setMensaje({
                tipo: "error",
                texto: error.response?.data?.message || "No es posible quedarse sin un plan activo"
            })
        }
    }

    // CU015 F2: validación de datos antes de enviar
    const validar = () => {
        const lista = []
        if (!seleccionado) lista.push("Elegí el plan al que querés cambiarte.")
        const digitos = tarjeta.replace(/\s/g, "")
        if (!digitos) lista.push("Ingresá el número de tarjeta.")
        else if (!/^\d{13,19}$/.test(digitos)) lista.push("El número de tarjeta debe tener entre 13 y 19 dígitos.")
        return lista
    }

    const confirmarCambio = async (event) => {
        event.preventDefault()
        setMensaje(null)
        const lista = validar()
        setErrores(lista)
        if (lista.length > 0) return

        setPagando(true)
        try {
            await axios.put(
                `${API}/planes/actual`,
                { IDPlan: seleccionado, datosPago: { tarjeta: tarjeta.replace(/\s/g, "") } },
                conToken()
            )
            setSeleccionado(null)
            setTarjeta("")
            await cargarDatos()
            setPestania("administrar")
            setMensaje({ tipo: "exito", texto: "¡Plan actualizado correctamente!" })
        } catch (error) {
            // 402 pago rechazado, 409 ya tenés ese plan, 404 plan inexistente, 500 error
            manejarError(error, "No se pudo cambiar el plan")
        } finally {
            setPagando(false)
        }
    }

    const difiere = (plan, clave) => planActual && plan[clave] !== planActual[clave]
    const esActual = (plan) => planActual && plan.IDPlan === planActual.IDPlan

    if (cargando) return <div className="planes"><p className="planes-cargando">Cargando planes...</p></div>

    return (
        <div className="planes">
            <h1>Gestionar planes</h1>

            <div className="planes-tabs" role="tablist">
                <button type="button" className={pestania === "ver" ? "activo" : ""} onClick={() => irAPestania("ver")}>Ver planes</button>
                <button type="button" className={pestania === "administrar" ? "activo" : ""} onClick={() => irAPestania("administrar")}>Administrar plan</button>
                <button type="button" className={pestania === "cambiar" ? "activo" : ""} onClick={() => irAPestania("cambiar")}>Cambiar plan</button>
            </div>

            {mensaje && (
                <p className={`planes-mensaje ${mensaje.tipo === "exito" ? "exito" : "error"}`} role="alert">
                    {mensaje.texto}
                </p>
            )}

            {/* F1 - Ver planes */}
            {pestania === "ver" && (
                <div className="planes-grilla">
                    {planes.length === 0 && <p>No hay planes disponibles.</p>}
                    {planes.map((plan) => (
                        <article key={plan.IDPlan} className={`plan-card ${esActual(plan) ? "plan-actual" : ""}`}>
                            <h3>{plan.NombrePlan}</h3>
                            {esActual(plan) && <span className="plan-badge">Tu plan actual</span>}
                            <dl>
                                {CAMPOS.map(({ clave, etiqueta }) => (
                                    <div key={clave} className={difiere(plan, clave) ? "difiere" : ""}>
                                        <dt>{etiqueta}</dt>
                                        <dd>{plan[clave]}</dd>
                                    </div>
                                ))}
                            </dl>
                        </article>
                    ))}
                    {planActual && <p className="planes-ayuda">Lo resaltado es lo que cambia respecto de tu plan actual.</p>}
                </div>
            )}

            {/* F3 - Administrar plan */}
            {pestania === "administrar" && (
                <div className="plan-detalle">
                    {planActual ? (
                        <>
                            <article className="plan-card plan-actual">
                                <h3>{planActual.NombrePlan}</h3>
                                <span className="plan-badge">Plan activo</span>
                                <dl>
                                    {CAMPOS.map(({ clave, etiqueta }) => (
                                        <div key={clave}><dt>{etiqueta}</dt><dd>{planActual[clave]}</dd></div>
                                    ))}
                                </dl>
                            </article>
                            <div className="planes-acciones">
                                <button type="button" onClick={() => irAPestania("cambiar")}>Cambiar plan</button>
                                <button type="button" className="btn-peligro" onClick={eliminarPlan}>Eliminar plan</button>
                            </div>
                        </>
                    ) : (
                        <p>No tenés un plan activo. Elegí uno desde "Cambiar plan".</p>
                    )}
                </div>
            )}

            {/* Cambiar plan + pago (F4 d-k) */}
            {pestania === "cambiar" && (
                <form className="plan-form" onSubmit={confirmarCambio} noValidate>
                    <h2>Elegí tu nuevo plan</h2>
                    <div className="plan-opciones">
                        {planes.filter((p) => !esActual(p)).map((plan) => (
                            <label key={plan.IDPlan} className={`plan-opcion ${seleccionado === plan.IDPlan ? "elegida" : ""}`}>
                                <input
                                    type="radio"
                                    name="plan"
                                    checked={seleccionado === plan.IDPlan}
                                    onChange={() => setSeleccionado(plan.IDPlan)}
                                />
                                <span>
                                    <strong>{plan.NombrePlan}</strong>
                                    <small>{plan.TipoPlan} · {plan.EstadoPlan}</small>
                                </span>
                            </label>
                        ))}
                    </div>

                    <label className="plan-pago">Número de tarjeta
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="1234 5678 9012 3456"
                            value={tarjeta}
                            onChange={(e) => setTarjeta(e.target.value)}
                        />
                    </label>

                    {errores.length > 0 && (
                        <ul className="planes-errores">
                            {errores.map((e) => <li key={e}>{e}</li>)}
                        </ul>
                    )}

                    <button type="submit" disabled={pagando}>
                        {pagando ? "Procesando pago..." : "Confirmar y pagar"}
                    </button>
                </form>
            )}
        </div>
    )
}

export default Planes