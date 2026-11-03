//cu005 
import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../css/Hospitales.css';

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
            const res = await axios.post('/hospitales', {
                nombre,
                direccion,
                ciudad,
                telefono
            });

            setMensaje(res.data.mensaje);
            setTipoMensaje('ok');
            setExtension(res.data.extension);

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
            <h1>Añadir hospital</h1>
            <p className="hosp-subtitulo">
                El hospital se incorpora a la cartilla médica apenas se guarda.
            </p>

            {mensaje && (
                <div className={`hosp-aviso hosp-aviso--${tipoMensaje}`}>
                    <span>{mensaje}</span>

                    {tipoMensaje === 'ok' && extension === 'CU024' && (
                        <Link to="/admin/cartilla" className="hosp-btn hosp-btn--link">
                            Asignar a obras sociales
                        </Link>
                    )}

                    <button type="button" onClick={() => setMensaje('')}>
                        Cerrar
                    </button>
                </div>
            )}

            <form className="hosp-form" onSubmit={enviar} noValidate>

                <label>Nombre</label>
                <input
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                />
                {errores.nombre && <p>{errores.nombre}</p>}

                <label>Dirección</label>
                <input
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                />
                {errores.direccion && <p>{errores.direccion}</p>}

                <label>Ciudad</label>
                <input
                    value={ciudad}
                    onChange={e => setCiudad(e.target.value)}
                />
                {errores.ciudad && <p>{errores.ciudad}</p>}

                <label>Teléfono (opcional)</label>
                <input
                    type="tel"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                />
                {errores.telefono && <p>{errores.telefono}</p>}

                <div className="hosp-form__pie">
                    <button type="submit" disabled={enviando}>
                        {enviando ? 'Guardando...' : 'Guardar hospital'}
                    </button>
                </div>

            </form>
        </section>
    );
}

export default AgregarHospital;
