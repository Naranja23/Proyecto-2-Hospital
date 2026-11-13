// CU005 
import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../css/Hospitales.css';

const API = 'http://localhost:3000';

function AgregarHospital() {
    const [nombre, setNombre] = useState('');
    const [direccion, setDireccion] = useState('');
    const [ciudad, setCiudad] = useState('');
    const [telefono, setTelefono] = useState('');

    const [errores, setErrores] = useState({});
    const [mensaje, setMensaje] = useState('');
    const [tipoMensaje, setTipoMensaje] = useState('');
    const [extension, setExtension] = useState('');
    const [enviando, setEnviando] = useState(false);

    const enviar = async (e) => {
        e.preventDefault();

        setMensaje('');
        setErrores({});

        let nuevosErrores = {};

        if (nombre.trim().length < 3) {
            nuevosErrores.nombre = 'Ingresá el nombre del hospital (mínimo 3 caracteres).';
        }

        if (!direccion.trim()) {
            nuevosErrores.direccion = 'Ingresá la dirección.';
        }

        if (!ciudad.trim()) {
            nuevosErrores.ciudad = 'Ingresá la ciudad.';
        }

        if (telefono.trim() && !/^[0-9+()\-\\s]{6,20}$/.test(telefono.trim())) {
            nuevosErrores.telefono = 'El teléfono solo puede tener números, espacios, +, - y paréntesis.';
        }

        if (Object.keys(nuevosErrores).length > 0) {
            setErrores(nuevosErrores);
            setMensaje('Hay datos incorrectos o incompletos. Corregilos y volvé a intentar.');
            setTipoMensaje('error');
            return;
        }

        setEnviando(true);

        try {
            const token = localStorage.getItem('token');
            const direccionCompleta = ciudad.trim() ? `${direccion.trim()}, ${ciudad.trim()}` : direccion.trim();
            const res = await axios.post(`${API}/hospitales`, {
                nombreH: nombre.trim(),
                direccionH: direccionCompleta,
                nombre: nombre.trim(),
                direccion: direccionCompleta,
                ciudad: ciudad.trim(),
                sitioWeb: telefono.trim()
            }, {
                headers: { Authorization: token ? `Bearer ${token}` : '' }
            });

            setMensaje(res.data.mensaje);
            setTipoMensaje('ok');
            setExtension(res.data.extension || '');

            setNombre('');
            setDireccion('');
            setCiudad('');
            setTelefono('');
            setErrores({});

        } catch (error) {
            setMensaje(error.response?.data?.mensaje || 'Error al guardar el hospital.');
            setTipoMensaje('error');

            if (error.response?.data?.errores) {
                setErrores(error.response.data.errores);
            }

        } finally {
            setEnviando(false);
        }
    };

    return (
        <section className="hosp-page">
            <header className="hosp-encabezado">
                <div>
                    <h1>Añadir hospital</h1>
                    <p className="hosp-subtitulo">
                        El hospital se incorpora a la cartilla médica apenas se guarda.
                    </p>
                </div>
            </header>

            {mensaje && (
                <div className={`hosp-aviso hosp-aviso--${tipoMensaje}`} role="alert">
                    <span>{mensaje}</span>
                    {extension && (
                        <p className="hosp-aviso__extension">
                            {extension}
                            <Link to="/cartilla"> Ir a la cartilla</Link>
                        </p>
                    )}
                </div>
            )}

            <form className="hosp-formulario" onSubmit={enviar} noValidate>
                <div className="hosp-campo">
                    <label htmlFor="nombre">Nombre del hospital *</label>
                    <input
                        id="nombre"
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Hospital Italiano"
                    />
                    {errores.nombre && <p className="hosp-error">{errores.nombre}</p>}
                </div>

                <div className="hosp-campo">
                    <label htmlFor="direccion">Dirección *</label>
                    <input
                        id="direccion"
                        type="text"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        placeholder="Ej: Gascón 450"
                    />
                    {errores.direccion && <p className="hosp-error">{errores.direccion}</p>}
                </div>

                <div className="hosp-campo">
                    <label htmlFor="ciudad">Ciudad *</label>
                    <input
                        id="ciudad"
                        type="text"
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        placeholder="Ej: Almagro, CABA"
                    />
                    {errores.ciudad && <p className="hosp-error">{errores.ciudad}</p>}
                </div>

                <div className="hosp-campo">
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                        id="telefono"
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Ej: 011 4959-0200"
                    />
                    {errores.telefono && <p className="hosp-error">{errores.telefono}</p>}
                </div>

                <div className="hosp-acciones">
                    <button
                        type="submit"
                        className="hosp-btn hosp-btn--primario"
                        disabled={enviando}
                    >
                        {enviando ? 'Guardando...' : 'Guardar hospital'}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default AgregarHospital;
