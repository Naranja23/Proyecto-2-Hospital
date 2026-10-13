import { useState } from "react"
import axios from "axios"
import "../css/Login.css"

function Login({ onIrARegister, onLoginExitoso }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [mensaje, setMensaje] = useState("")
    const [cargando, setCargando] = useState(false)

    const enviar = async (event) => {
        event.preventDefault()
        setMensaje("")
        setCargando(true)

        try {
            const respuesta = await axios.post("http://localhost:3000/users/login", {
                email: email,
                password: password
            })

            const { token, usuario } = respuesta.data
            if (token) {
                localStorage.setItem("token", token)
                localStorage.setItem("usuario", JSON.stringify(usuario))
            }

            setMensaje(`¡Bienvenido/a, ${usuario?.NomApeU || "Usuario"}!`)
            if (onLoginExitoso) {
                onLoginExitoso(usuario)
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Error al iniciar sesión. Verificá tus credenciales."
            setMensaje(errorMsg)
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="login">
            <div className="login-panel-lateral">
                <p className="marca">TurnoSalud</p>
                <h1>Bienvenido de nuevo</h1>
                <p className="beneficio">Accedé a tu portal de salud para gestionar tus turnos de forma rápida y segura.</p>
                <p className="beneficio">Historial de consultas y recetas en un solo lugar.</p>
                <p className="beneficio">Atención personalizada y recordatorios directos.</p>
            </div>

            <div className="login-derecha">
                <form className="login-form" onSubmit={enviar}>
                    <h2>Iniciar sesión</h2>
                    <p className="subtitulo">Ingresá tus credenciales para acceder a tu cuenta.</p>

                    <div className="campos-login">
                        <label>Email
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </label>

                        <label>Contraseña
                            <input
                                type="password"
                                placeholder="Tu contraseña"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </label>
                    </div>

                    <button type="submit" disabled={cargando}>
                        {cargando ? "Iniciando..." : "Ingresar"}
                    </button>

                    {onIrARegister && (
                        <p className="cambio-vista">
                            ¿No tenés una cuenta?{" "}
                            <button type="button" className="btn-link" onClick={onIrARegister}>
                                Crear cuenta
                            </button>
                        </p>
                    )}

                    <p className={`mensaje ${mensaje.includes("Bienvenido") ? "mensaje-exito" : "mensaje-error"}`}>
                        {mensaje}
                    </p>
                </form>
            </div>
        </div>
    )
}

export default Login
