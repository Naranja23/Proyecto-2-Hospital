import { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/Hospitales.css';
import '../css/Cartilla.css';

const API = 'http://localhost:3000';

export default function Cartilla() {
    const [obrasSociales, setObrasSociales] = useState([]);
    const [obraId, setObraId] = useState('');
    const [hospitales, setHospitales] = useState([]);
    const [original, setOriginal] = useState([]);
    const [seleccion, setSeleccion] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [aviso, setAviso] = useState(null);

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: token ? `Bearer ${token}` : '' } };
    };

    useEffect(() => {
        axios.get(`${API}/cartilla/obras-sociales`, getHeaders())
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : (res.data.obrasSociales || []);
                setObrasSociales(data);
            })
            .catch(err => setAviso({
                tipo: 'error',
                texto: err.response?.data?.mensaje || 'Error al cargar las obras sociales.'
            }));
    }, []);

    const elegirObraSocial = async (id) => {
        setObraId(id);
        setAviso(null);
        setHospitales([]);
        setOriginal([]);
        setSeleccion([]);

        if (!id) return;

        setCargando(true);

        try {
            const res = await axios.get(`${API}/cartilla/${id}`, getHeaders());
            const hospitalesCartilla = res.data.hospitales || [];

            setHospitales(hospitalesCartilla);

            const ids = hospitalesCartilla
                .filter(h => h.enCartilla)
                .map(h => h.id || h.IDHospital);

            setOriginal(ids);
            setSeleccion(ids);

        } catch (err) {
            setAviso({
                tipo: 'error',
                texto: err.response?.data?.mensaje || 'Error al cargar los hospitales de la cartilla.'
            });
        } finally {
            setCargando(false);
        }
    };

    const alternar = (id) => {
        setSeleccion(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const cambios = hospitales.filter(h =>
        seleccion.includes(h.id || h.IDHospital) !== original.includes(h.id || h.IDHospital)
    ).length;

    const guardar = async () => {
        setGuardando(true);
        setAviso(null);

        try {
            const res = await axios.put(`${API}/cartilla/${obraId}`, {
                hospitalIds: seleccion
            }, getHeaders());

            setOriginal([...seleccion]);

            setAviso({
                tipo: 'ok',
                texto: res.data.mensaje
            });

        } catch (err) {
            setAviso({
                tipo: 'error',
                texto: err.response?.data?.mensaje || 'Error al guardar la cartilla.'
            });

        } finally {
            setGuardando(false);
        }
    };

    return (
        <section className="hosp-page">
            <header className="hosp-encabezado">
                <div>
                    <h1>Cartilla médica</h1>
                    <p className="hosp-subtitulo">
                        Elegí una obra social y marcá los hospitales que integran su cartilla.
                    </p>
                </div>
            </header>

            {aviso && (
                <div className={`hosp-aviso hosp-aviso--${aviso.tipo}`}>
                    <span>{aviso.texto}</span>
                    <button type="button" onClick={() => setAviso(null)}>
                        Cerrar
                    </button>
                </div>
            )}

            <div className="hosp-campo cart-selector">
                <label>Obra social</label>

                <select
                    value={obraId}
                    onChange={e => elegirObraSocial(e.target.value)}
                >
                    <option value="">Seleccioná una obra social</option>

                    {obrasSociales.map(o => (
                        <option key={o.id || o.IDPrepaga} value={o.id || o.IDPrepaga}>
                            {o.nombre || o.NombreComercial}
                        </option>
                    ))}
                </select>
            </div>

            {cargando && <p className="hosp-vacio">Cargando cartilla...</p>}

            {!cargando && obraId && hospitales.length === 0 && (
                <p className="hosp-vacio">
                    No hay hospitales registrados. Añadí el primero desde "Añadir hospital".
                </p>
            )}

            {!cargando && hospitales.length > 0 && (
                <>
                    <ul className="cart-lista">
                        {hospitales.map(h => {
                            const hid = h.id || h.IDHospital;
                            return (
                                <li key={hid}>
                                    <label className="cart-item">
                                        <input
                                            type="checkbox"
                                            checked={seleccion.includes(hid)}
                                            onChange={() => alternar(hid)}
                                        />

                                        <span className="cart-item__texto">
                                            <strong>{h.nombre || h.NombreH}</strong>
                                            <span className="cart-item__ciudad">{h.ciudad || h.direccion || h.DireccionH}</span>
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="cart-pie">
                        <p className="cart-pie__resumen">
                            {cambios === 0
                                ? 'Sin cambios pendientes.'
                                : `${cambios} cambio(s) sin guardar.`}
                        </p>

                        <button
                            type="button"
                            className="hosp-btn"
                            disabled={cambios === 0 || guardando}
                            onClick={() => setSeleccion([...original])}
                        >
                            Descartar cambios
                        </button>

                        <button
                            type="button"
                            className="hosp-btn hosp-btn--primario"
                            disabled={cambios === 0 || guardando}
                            onClick={guardar}
                        >
                            {guardando ? 'Guardando...' : 'Guardar cartilla'}
                        </button>
                    </div>
                </>
            )}
        </section>
    );
}
