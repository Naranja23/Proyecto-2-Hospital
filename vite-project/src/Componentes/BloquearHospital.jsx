import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../css/BloquearHospital.css';

const API = 'http://localhost:3000';

function BloquearHospital() {
    const { id } = useParams();
    const token = localStorage.getItem('token');
    const headers = { Authorization: token ? `Bearer ${token}` : '' };

    const [hospital, setHospital] = useState(null);
    const [motivo, setMotivo] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
    const [bloqueado, setBloqueado] = useState(false);

    useEffect(() => {
        axios.get(`${API}/bloquear-hospital/${id}`, { headers })
            .then(res => setHospital(res.data.hospital))
            .catch(err => setError(err.response?.data?.mensaje || 'Error al cargar el hospital.'));
    }, [id]);

    const confirmar = async () => {
        setError('');

        try {
            const res = await axios.put(
                `${API}/bloquear-hospital/${id}/bloquear`,
                { motivo },
                { headers }
            );

            setMensaje(res.data.mensaje);
            setBloqueado(true);
            setPidiendoMotivo(false);

        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al bloquear el hospital.');
        }
    };

    return (
        <div className="bloquear-contenedor">
            <h2>Bloquear hospital</h2>

            {error && <p className="error">{error}</p>}
            {mensaje && <p className="exito">{mensaje}</p>}

            {hospital && (
                <div className="datos-hospital">
                    <p><b>Nombre:</b> {hospital.NombreH}</p>
                    <p><b>Dirección:</b> {hospital.DireccionH}</p>
                    <p><b>Estado:</b> {bloqueado ? 'Bloqueado' : hospital.EstadoH}</p>
                </div>
            )}

            {hospital && !bloqueado && !pidiendoMotivo && (
                <button
                    className="btn-bloquear"
                    onClick={() => setPidiendoMotivo(true)}
                >
                    Bloquear este hospital
                </button>
            )}

            {pidiendoMotivo && (
                <div className="motivo-bloqueo">
                    <label>Motivo del bloqueo:</label>
                    <textarea
                        value={motivo}
                        onChange={e => setMotivo(e.target.value)}
                        placeholder="Explicá por qué se bloquea el hospital..."
                    />
                    <button className="btn-confirmar" onClick={confirmar}>
                        Confirmar bloqueo
                    </button>
                </div>
            )}

            {bloqueado && (
                <Link to={`/desbloquear-hospital/${id}`}>
                    ¿Querés desbloquearlo?
                </Link>
            )}
        </div>
    );
}

export default BloquearHospital;
