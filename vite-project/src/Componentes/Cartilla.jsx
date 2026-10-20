// PANTALLA CU006: permite seleccionar una obra social y marcar sus hospitales.

import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import '../css/Hospitales.css';
import '../css/Cartilla.css';

export default function Cartilla() {
  const [obrasSociales, setObrasSociales] = useState([]);
  const [obraId, setObraId] = useState('');
  const [hospitales, setHospitales] = useState([]);
  const [original, setOriginal] = useState(new Set());
  const [seleccion, setSeleccion] = useState(new Set());
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'error', texto }

  const cargarObrasSociales = async () => {
    try {
      const { data } = await api.get('/cartilla/obras-sociales');
      setObrasSociales(data.obrasSociales);
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    }
  };

  useEffect(() => {
    cargarObrasSociales();
  }, []);

  // Pasos 1 y 2: el administrador elige una obra social y el sistema muestra su cartilla
  const elegirObraSocial = async (id) => {
    setObraId(id);
    setAviso(null);
    setHospitales([]);
    if (!id) return;

    setCargando(true);
    try {
      const { data } = await api.get(`/cartilla/${id}`);
      const enCartilla = new Set(data.hospitales.filter((h) => h.enCartilla).map((h) => h.id));
      setHospitales(data.hospitales);
      setOriginal(enCartilla);
      setSeleccion(new Set(enCartilla));
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
      if (e.status === 404) {
        // F1: la obra social ya no existe
        setObraId('');
        cargarObrasSociales();
      }
    } finally {
      setCargando(false);
    }
  };

  const alternar = (id) =>
    setSeleccion((previa) => {
      const nueva = new Set(previa);
      if (nueva.has(id)) nueva.delete(id);
      else nueva.add(id);
      return nueva;
    });

  const cambios = useMemo(
    () => hospitales.filter((h) => original.has(h.id) !== seleccion.has(h.id)).length,
    [hospitales, original, seleccion]
  );

  // Pasos 3 a 8: agregar o quitar hospitales y guardar
  const guardar = async () => {
    setGuardando(true);
    setAviso(null);
    try {
      const { data } = await api.put(`/cartilla/${obraId}`, { hospitalIds: [...seleccion] });
      setOriginal(new Set(seleccion));
      setAviso({ tipo: 'ok', texto: data.mensaje });
    } catch (e) {
      // F2: error al guardar; la cartilla del servidor quedó como estaba
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="hosp-page">
      <header className="hosp-encabezado">
        <div>
          <h1>Cartilla médica</h1>
          <p className="hosp-subtitulo">Elegí una obra social y marcá los hospitales que integran su cartilla.</p>
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

      <div className="hosp-campo cart-selector">
        <label htmlFor="cart-obra">Obra social</label>
        <select id="cart-obra" value={obraId} onChange={(e) => elegirObraSocial(e.target.value)}>
          <option value="">Seleccioná una obra social</option>
          {obrasSociales.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre}
            </option>
          ))}
        </select>
      </div>

      {cargando && <p className="hosp-vacio">Cargando cartilla…</p>}

      {!cargando && obraId && hospitales.length === 0 && (
        <p className="hosp-vacio">No hay hospitales registrados. Añadí el primero desde “Añadir hospital”.</p>
      )}

      {!cargando && hospitales.length > 0 && (
        <>
          <ul className="cart-lista">
            {hospitales.map((h) => (
              <li key={h.id}>
                <label className="cart-item">
                  <input type="checkbox" checked={seleccion.has(h.id)} onChange={() => alternar(h.id)} />
                  <span className="cart-item__texto">
                    <strong>{h.nombre}</strong>
                    <span className="cart-item__ciudad">{h.ciudad}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <div className="cart-pie">
            <p className="cart-pie__resumen" aria-live="polite">
              {cambios === 0 ? 'Sin cambios pendientes.' : `${cambios} ${cambios === 1 ? 'cambio sin guardar' : 'cambios sin guardar'}.`}
            </p>
            <button type="button" className="hosp-btn" disabled={cambios === 0 || guardando} onClick={() => setSeleccion(new Set(original))}>
              Descartar cambios
            </button>
            <button type="button" className="hosp-btn hosp-btn--primario" disabled={cambios === 0 || guardando} onClick={guardar}>
              {guardando ? 'Guardando…' : 'Guardar cartilla'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
