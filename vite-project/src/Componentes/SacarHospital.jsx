// PANTALLA CU007: permite seleccionar un hospital y eliminarlo definitivamente.

import { useEffect, useState } from 'react';
import axios from "axios"
import '../css/Hospitales.css';
import '../css/SacarHospital.css';

export default function SacarHospital() {
  const [hospitales, setHospitales] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null); // hospital que se va a confirmar
  const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'error', texto }

  // Paso 1: el administrador accede al listado de hospitales
  const cargarHospitales = async () => {
    setCargando(true);
    try {
      const { data } = await axios.get('/hospitales');
      setHospitales(data.hospitales);
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHospitales();
  }, []);

  // Pasos 2 y 3: el administrador elige un hospital y el sistema muestra sus datos para confirmar
  const elegirHospital = async (id) => {
    setAviso(null);
    try {
      const { data } = await axios.get(`/hospitales/${id}`);
      setSeleccionado(data.hospital);
    } catch (e) {
      // F1: el hospital ya no existe, no se pide confirmación
      setAviso({ tipo: 'error', texto: e.message });
      if (e.status === 404) cargarHospitales();
    }
  };

  const cancelar = () => setSeleccionado(null);

  // Pasos 4 a 8: el administrador confirma y el sistema elimina
  const confirmarEliminacion = async () => {
    setEliminando(true);
    setAviso(null);
    try {
      const { data } = await axios.delete(`/hospitales/${seleccionado.IDHospital}`);
      setAviso({ tipo: 'ok', texto: data.mensaje });
    } catch (e) {
      // F2: tiene dependencias. F3: error del servidor. En ambos casos el hospital sigue existiendo
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setEliminando(false);
      setSeleccionado(null);
      cargarHospitales();
    }
  };

  return (
    <section className="hosp-page">
      <header className="hosp-encabezado">
        <div>
          <h1>Sacar hospital</h1>
          <p className="hosp-subtitulo">Elegí el hospital que querés eliminar del sistema. La baja es definitiva.</p>
        </div>
      </header>

      {aviso && (
        <div className={`hosp-aviso hosp-aviso--${aviso.tipo}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}>
          <span>{aviso.texto}</span>
          <span className="hosp-aviso__acciones">
            <button type="button" className="hosp-btn hosp-btn--link" onClick={() => setAviso(null)}>
              Cerrar
            </button>
          </span>
        </div>
      )}

      {cargando && <p className="hosp-vacio">Cargando hospitales…</p>}

      {!cargando && hospitales.length === 0 && (
        <p className="hosp-vacio">No hay hospitales registrados.</p>
      )}

      {!cargando && hospitales.length > 0 && (
        <ul className="sac-lista">
          {hospitales.map((h) => (
            <li key={h.IDHospital} className="sac-item">
              <span className="sac-item__texto">
                <strong>{h.NombreH}</strong>
                <span className="sac-item__direccion">{h.DireccionH}</span>
              </span>
              <button type="button" className="hosp-btn sac-btn--peligro" onClick={() => elegirHospital(h.IDHospital)}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Paso 3: ventana de confirmación de la baja */}
      {seleccionado && (
        <div className="sac-overlay">
          <div className="sac-modal" role="dialog" aria-modal="true" aria-labelledby="sac-titulo">
            <h2 id="sac-titulo">¿Eliminar este hospital?</h2>
            <p className="sac-modal__datos">
              <strong>{seleccionado.NombreH}</strong>
              <span>{seleccionado.DireccionH}</span>
            </p>
            <p>Se elimina definitivamente y no se puede deshacer.</p>
            <div className="sac-modal__acciones">
              <button type="button" className="hosp-btn" disabled={eliminando} onClick={cancelar}>
                Cancelar
              </button>
              <button type="button" className="hosp-btn sac-btn--peligro" disabled={eliminando} onClick={confirmarEliminacion}>
                {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
