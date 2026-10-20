import { useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import "../css/RegisterConPanel.css"
    
function RegisterConPanel({ onIrALogin }) {

    const [nombre, setNombre] = useState("")
    const [apellido, setApellido] = useState("")
    const [dni, setDni] = useState("")
    const [fechaNacimiento, setFechaNacimiento] = useState("")
    const [telefono, setTelefono] = useState("")
    const [obraSocial, setObraSocial] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [repetirPassword, setRepetirPassword] = useState("")
    const [mensaje, setMensaje] = useState("")

    const enviar = async (event) => {
        event.preventDefault()

        if (password !== repetirPassword) {
            setMensaje("Las contraseñas no coinciden.")
            return
        }

        try {
            await axios.post('http://localhost:3000/users/register', {
                nombre: nombre,
                apellido: apellido,
                dni: dni,
                fechaNacimiento: fechaNacimiento,
                telefono: telefono,
                obraSocial: obraSocial,
                email: email,
                password: password
            })
            setMensaje("Cuenta creada. Ya podés iniciar sesión.")
        } catch (error) {
            const errorMsg = error.response?.data?.message || "No se pudo crear la cuenta. Revisá tus datos."
            setMensaje(errorMsg)
        }
    }

    return (
        <div className="register">

            <div className="panel-lateral">
                <p className="marca">TurnoSalud</p>
                <h1>Tu salud, con turno confirmado.</h1>
                <p className="beneficio">Reservá turnos con médicos y especialidades sin llamar por teléfono.</p>
                <p className="beneficio">Recibí un recordatorio antes de cada consulta.</p>
                <p className="beneficio">Consultá tus turnos anteriores y próximos en un solo lugar.</p>
            </div>

            <div className="register-derecha">
                <form className="register-form" onSubmit={enviar}>
                    <h2>Creá tu cuenta</h2>
                    <p className="subtitulo">Completá tus datos para empezar a sacar turnos.</p>

                    <div className="campos">
                        <label>Nombre
                            <input type="text" required onChange={(e) => setNombre(e.target.value)} />
                        </label>

                        <label>Apellido
                            <input type="text" required onChange={(e) => setApellido(e.target.value)} />
                        </label>

                        <label>DNI
                            <input type="text" placeholder="Sin puntos" required onChange={(e) => setDni(e.target.value)} />
                        </label>

                        <label>Fecha de nacimiento
                            <input type="date" required onChange={(e) => setFechaNacimiento(e.target.value)} />
                        </label>

                        <label>Teléfono
                            <input type="tel" placeholder="Ej: 11 2345 6789" required onChange={(e) => setTelefono(e.target.value)} />
                        </label>

                        <label>Obra social (opcional)
                            <select onChange={(e) => setObraSocial(e.target.value)}>
                                <option value="">Elegí una opción</option>
                                <option value="OSDE">OSDE</option>
                                <option value="Swiss Medical">Swiss Medical</option>
                                <option value="Galeno">Galeno</option>
                                <option value="PAMI">PAMI</option>
                            </select>
                        </label>

                        <label className="completo">Email
                            <input type="email" required onChange={(e) => setEmail(e.target.value)} />
                        </label>

                        <label>Contraseña
                            <input type="password" placeholder="Mínimo 8 caracteres" minLength={8} required
                                onChange={(e) => setPassword(e.target.value)} />
                        </label>

                        <label>Repetir contraseña
                            <input type="password" required onChange={(e) => setRepetirPassword(e.target.value)} />
                        </label>
                    </div>

                    <label className="terminos">
                        <input type="checkbox" required />
                        Acepto los términos y condiciones
                    </label>

                    <button type="submit">Crear cuenta</button>

                    <p className="cambio-vista">
                        ¿Ya tenés una cuenta?{" "}
                        <Link to="/login" className="btn-link">
                            Iniciar sesión
                        </Link>
                    </p>

                    <p className="mensaje">{mensaje}</p>
                </form>
            </div>

        </div>
    )
}

export default RegisterConPanel
