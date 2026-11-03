
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './BloquearHospital.css';

function BloquearHospital() {
    const { id } = useParams();
    const headers = { Authorization: localStorage.getItem('token') };

    const [hospital, setHospital] = useState(null);
    const [motivo, setMotivo] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
    const [bloqueado, setBloqueado] = useState(false);

    useEffect(() => {
        axios.get(`http://localhost:3000/bloquear-hospital/${id}`, { headers })
            .then(res => setHospital(res.data.hospital))
            .catch(err => setError(err.response?.data?.mensaje || 'Error al cargar el hospital.'));
    }, [id]);

    const confirmar = async () => {
        setError('');

        try {
            const res = await axios.put(
                `http://localhost:3000/bloquear-hospital/${id}/bloquear`,
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

            {error && <p className="bloquear-error">{error}</p>}
            {mensaje && <p className="bloquear-exito">{mensaje}</p>}

            {hospital && (
                <div className="bloquear-datos">
                    <p><b>Nombre:</b> {hospital.NombreH}</p>
                    <p><b>Dirección:</b> {hospital.DireccionH}</p>
                    <p><b>Estado:</b> {bloqueado ? 'Bloqueado' : hospital.EstadoH}</p>
                </div>
            )}

            {hospital && !bloqueado && !pidiendoMotivo && (
                <button onClick={() => setPidiendoMotivo(true)}>
                    Bloquear
                </button>
            )}

            {pidiendoMotivo && (
                <div className="bloquear-motivo">
                    <textarea
                        placeholder="Ingrese el motivo del bloqueo"
                        value={motivo}
                        onChange={e => setMotivo(e.target.value)}
                    />

                    <button onClick={confirmar}>Confirmar</button>
                    <button onClick={() => setPidiendoMotivo(false)}>Cancelar</button>
                </div>
            )}

            {bloqueado && (
                <Link to={`/desbloquear-hospital/${id}`}>
                    Gestionar desbloqueo
                </Link>
            )}
        </div>
    );
}

export default BloquearHospital;
