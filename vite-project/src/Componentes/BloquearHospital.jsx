import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/Hospitales.css';
import '../css/BloquearHospital.css';

const API = 'http://localhost:3000';

function BloquearHospital() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = { Authorization: token ? `Bearer ${token}` : '' };

  // Modo lista (cuando no se pasa id en la URL) o modo detalle (cuando sí se pasa id)
  const [hospitales, setHospitales] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(false);

  // Hospital seleccionado para bloqueo o visualización
  const [hospital, setHospital] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
  const [bloqueando, setBloqueando] = useState(false);
  const [desbloqueando, setDesbloqueando] = useState(false);

  // Cargar lista completa de hospitales cuando no hay ID específico
  const cargarHospitales = useCallback(async () => {
    setCargandoLista(true);
    setError('');
    try {
      const res = await axios.get(`${API}/hospitales`, { headers });
      const lista = Array.isArray(res.data) ? res.data : (res.data.hospitales || []);
      setHospitales(lista);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message || 'Error al cargar los hospitales.');
    } finally {
      setCargandoLista(false);
    }
  }, [token]);

  // Si hay ID en la URL, cargar ese hospital individual
  useEffect(() => {
    if (id) {
      setError('');
      setMensaje('');
      axios.get(`${API}/hospitales/${id}`, { headers })
        .then(res => {
          setHospital(res.data.hospital || res.data);
        })
        .catch(err => {
          setError(err.response?.data?.mensaje || 'Error al cargar el hospital seleccionado.');
        });
    } else {
      cargarHospitales();
    }
  }, [id, cargarHospitales]);

  // Seleccionar un hospital desde la lista para bloquearlo
  const seleccionarParaBloquear = (h) => {
    setHospital(h);
    setMotivo('');
    setError('');
    setMensaje('');
    setPidiendoMotivo(true);
  };

  const cancelarBloqueo = () => {
    setPidiendoMotivo(false);
    setMotivo('');
    if (!id) setHospital(null);
  };

  // Confirmar el bloqueo (CU008)
  const confirmarBloqueo = async () => {
    if (!motivo || !motivo.trim()) {
      setError('Debe ingresar el motivo del bloqueo.');
      return;
    }

    const hospId = id || hospital?.IDHospital;
    if (!hospId) return;

    setError('');
    setBloqueando(true);

    try {
      const res = await axios.put(
        `${API}/hospitales/${hospId}/bloquear`,
        { motivo: motivo.trim() },
        { headers }
      );

      setMensaje(res.data?.mensaje || 'Hospital bloqueado correctamente.');
      setPidiendoMotivo(false);
      setMotivo('');

      // Actualizar estado local
      if (hospital) {
        setHospital({ ...hospital, EstadoH: 'Bloqueado', MotivoBloqueo: motivo.trim() });
      }
      if (!id) {
        cargarHospitales();
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al bloquear el hospital.');
    } finally {
      setBloqueando(false);
    }
  };

  // Desbloquear hospital (CU023)
  const confirmarDesbloqueo = async (hospId) => {
    const targetId = hospId || id || hospital?.IDHospital;
    if (!targetId) return;

    setError('');
    setDesbloqueando(true);

    try {
      const res = await axios.put(
        `${API}/hospitales/${targetId}/desbloquear`,
        {},
        { headers }
      );

      setMensaje(res.data?.mensaje || 'Hospital habilitado correctamente.');

      if (hospital && (id || hospital.IDHospital === targetId)) {
        setHospital({ ...hospital, EstadoH: 'Activo' });
      }
      if (!id) {
        cargarHospitales();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.mensaje || 'Error al desbloquear el hospital.');
    } finally {
      setDesbloqueando(false);
    }
  };

  return (
    <section className="hosp-page">
      <header className="hosp-encabezado">
        <div>
          <h1>Bloquear hospital</h1>
          <p className="hosp-subtitulo">
            Restringe temporalmente el acceso y la asignación de turnos para el hospital seleccionado.
          </p>
        </div>
      </header>

      {/* Alertas */}
      {error && (
        <div className="hosp-aviso hosp-aviso--error" role="alert">
          <span>{error}</span>
          <button type="button" className="hosp-btn hosp-btn--link" onClick={() => setError('')}>
            Cerrar
          </button>
        </div>
      )}

      {mensaje && (
        <div className="hosp-aviso hosp-aviso--ok" role="status">
          <span>{mensaje}</span>
          <button type="button" className="hosp-btn hosp-btn--link" onClick={() => setMensaje('')}>
            Cerrar
          </button>
        </div>
      )}

      {/* CASO 1: Si se pasó un ID en la URL, vista detallada del hospital */}
      {id && hospital && (
        <div className="bloquear-contenedor">
          <div className="datos-hospital">
            <p><strong>Nombre:</strong> {hospital.NombreH}</p>
            <p><strong>Dirección:</strong> {hospital.DireccionH || '—'}</p>
            <p>
              <strong>Estado actual:</strong>{' '}
              <span className={`badge-hosp-estado badge-${(hospital.EstadoH || 'Activo').toLowerCase()}`}>
                {hospital.EstadoH || 'Activo'}
              </span>
            </p>
            {hospital.MotivoBloqueo && (
              <p><strong>Motivo de bloqueo:</strong> {hospital.MotivoBloqueo}</p>
            )}
          </div>

          {hospital.EstadoH !== 'Bloqueado' && !pidiendoMotivo && (
            <button
              type="button"
              className="hosp-btn blq-btn--alerta"
              onClick={() => setPidiendoMotivo(true)}
            >
              Bloquear este hospital
            </button>
          )}

          {hospital.EstadoH === 'Bloqueado' && (
            <div className="bloquear-opciones-desbloqueo">
              <p>Este hospital se encuentra bloqueado.</p>
              <button
                type="button"
                className="hosp-btn blq-btn--habilitar"
                onClick={() => confirmarDesbloqueo(hospital.IDHospital)}
                disabled={desbloqueando}
              >
                {desbloqueando ? 'Desbloqueando...' : 'Desbloquear hospital'}
              </button>
            </div>
          )}

          {pidiendoMotivo && (
            <div className="motivo-bloqueo">
              <label htmlFor="motivo-input"><strong>Motivo del bloqueo (obligatorio):</strong></label>
              <textarea
                id="motivo-input"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Explicá detalladamente por qué se bloquea el hospital..."
                rows={4}
              />
              <div className="bloquear-acciones">
                <button
                  type="button"
                  className="hosp-btn"
                  onClick={cancelarBloqueo}
                  disabled={bloqueando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="hosp-btn blq-btn--alerta"
                  onClick={confirmarBloqueo}
                  disabled={bloqueando}
                >
                  {bloqueando ? 'Bloqueando...' : 'Confirmar bloqueo'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CASO 2: Sin ID en la URL -> Mostrar listado de todos los hospitales para gestionar su bloqueo */}
      {!id && (
        <>
          {cargandoLista && <p className="hosp-vacio">Cargando hospitales...</p>}

          {!cargandoLista && hospitales.length === 0 && (
            <p className="hosp-vacio">No hay hospitales registrados en el sistema.</p>
          )}

          {!cargandoLista && hospitales.length > 0 && (
            <ul className="sac-lista">
              {hospitales.map((h) => {
                const esBloqueado = h.EstadoH === 'Bloqueado';
                return (
                  <li key={h.IDHospital} className={`sac-item ${esBloqueado ? 'blq-item--bloqueado' : ''}`}>
                    <span className="sac-item__texto">
                      <strong>{h.NombreH}</strong>
                      <span className="sac-item__direccion">{h.DireccionH || 'Sin dirección registrada'}</span>
                      <span className="blq-item__estado">
                        Estado:{' '}
                        <span className={`badge-hosp-estado badge-${(h.EstadoH || 'Activo').toLowerCase()}`}>
                          {h.EstadoH || 'Activo'}
                        </span>
                      </span>
                    </span>

                    <div className="blq-item__acciones">
                      {!esBloqueado ? (
                        <button
                          type="button"
                          className="hosp-btn blq-btn--alerta"
                          onClick={() => seleccionarParaBloquear(h)}
                        >
                          Bloquear
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="hosp-btn blq-btn--habilitar"
                          onClick={() => confirmarDesbloqueo(h.IDHospital)}
                          disabled={desbloqueando}
                        >
                          Desbloquear
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Modal / Diálogo para ingresar motivo al bloquear un hospital de la lista */}
          {pidiendoMotivo && hospital && (
            <div className="sac-overlay" role="dialog" aria-modal="true">
              <div className="sac-modal">
                <h2>Bloquear {hospital.NombreH}</h2>
                <p className="sac-modal__datos">
                  <span>Dirección: {hospital.DireccionH || '—'}</span>
                </p>
                <div className="motivo-bloqueo">
                  <label htmlFor="motivo-modal"><strong>Motivo del bloqueo (obligatorio):</strong></label>
                  <textarea
                    id="motivo-modal"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Explicá detalladamente por qué se bloquea el hospital..."
                    rows={4}
                    autoFocus
                  />
                  <div className="sac-modal__acciones">
                    <button
                      type="button"
                      className="hosp-btn"
                      onClick={cancelarBloqueo}
                      disabled={bloqueando}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="hosp-btn blq-btn--alerta"
                      onClick={confirmarBloqueo}
                      disabled={bloqueando}
                    >
                      {bloqueando ? 'Bloqueando...' : 'Confirmar bloqueo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default BloquearHospital;
