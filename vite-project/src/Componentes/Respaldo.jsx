import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../css/Respaldo.css';

const API = 'http://localhost:3000';
const conToken = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export default function Respaldo({ onSesionExpirada }) {
  // Opciones de configuración del respaldo (CU004 - Paso 3)
  const [tipo, setTipo] = useState('completo'); // completo | datos | estructura
  const [destino, setDestino] = useState('./backups');
  const [particiones, setParticiones] = useState(1);
  const [comentario, setComentario] = useState('');

  // Estados de proceso
  const [verificandoEspacio, setVerificandoEspacio] = useState(false);
  const [infoEspacio, setInfoEspacio] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [pasoActual, setPasoActual] = useState(0);

  // Mensajes de retroalimentación
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  // Historial de respaldos
  const [respaldos, setRespaldos] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [modoMonousuario, setModoMonousuario] = useState(false);

  // Cargar historial de respaldos existentes
  const cargarHistorial = useCallback(async () => {
    setCargandoHistorial(true);
    try {
      const res = await axios.get(`${API}/respaldos?destino=${encodeURIComponent(destino)}`, conToken());
      setRespaldos(res.data.respaldos || []);
      setModoMonousuario(Boolean(res.data.modoMonousuario?.activo));
    } catch (err) {
      if (err.response?.status === 401 && onSesionExpirada) {
        onSesionExpirada();
      }
    } finally {
      setCargandoHistorial(false);
    }
  }, [destino, onSesionExpirada]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  // Paso 4: Verificar espacio y permisos
  const comprobarEspacioYPermisos = async () => {
    setVerificandoEspacio(true);
    setMensajeError('');
    try {
      const res = await axios.get(
        `${API}/respaldos/espacio?destino=${encodeURIComponent(destino)}`,
        conToken()
      );
      setInfoEspacio(res.data);
    } catch (err) {
      setInfoEspacio(null);
      const msg = err.response?.data?.mensaje || err.response?.data?.error || 'No se pudo verificar el almacenamiento.';
      setMensajeError(`Flujo Alternativo F4: ${msg}`);
    } finally {
      setVerificandoEspacio(false);
    }
  };

  // Ejecución de CU004 - Hacer respaldo
  const ejecutarRespaldo = async (e) => {
    e.preventDefault();
    setGenerando(true);
    setMensajeExito('');
    setMensajeError('');
    setPasoActual(1);

    try {
      // Simular progreso de los pasos del CU
      setPasoActual(2); // Paso 4: Verificando espacio y permisos
      await new Promise(r => setTimeout(r, 400));

      setPasoActual(3); // Paso 5: La base de datos se vuelve monousuario
      setModoMonousuario(true);
      await new Promise(r => setTimeout(r, 400));

      setPasoActual(4); // Paso 6: Generación de la copia de seguridad
      const res = await axios.post(
        `${API}/respaldos`,
        {
          tipo,
          destino,
          particiones: Number(particiones),
          comentario: comentario.trim() || undefined
        },
        conToken()
      );

      setPasoActual(5); // Paso 9: La base de datos vuelve a multiusuario
      setModoMonousuario(false);
      await new Promise(r => setTimeout(r, 300));

      setPasoActual(6); // Paso 10: Auditoría en bitácora completa
      setMensajeExito(res.data?.mensaje || 'Copia de seguridad realizada con éxito.');
      cargarHistorial();
    } catch (err) {
      setModoMonousuario(false);
      if (err.response?.status === 401 && onSesionExpirada) {
        onSesionExpirada();
        return;
      }
      const data = err.response?.data;
      const errorMsg = data?.mensaje || data?.error || 'Ocurrió una falla durante la generación del respaldo.';
      setMensajeError(`Error en el proceso de respaldo: ${errorMsg}`);
    } finally {
      setGenerando(false);
      setPasoActual(0);
    }
  };

  // Descargar archivo de respaldo
  const descargarArchivo = async (nombreArchivo) => {
    try {
      const res = await axios.get(
        `${API}/respaldos/descargar/${encodeURIComponent(nombreArchivo)}?destino=${encodeURIComponent(destino)}`,
        {
          ...conToken(),
          responseType: 'blob'
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombreArchivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('No se pudo descargar el archivo de respaldo: ' + (err.message || ''));
    }
  };

  // Eliminar respaldo
  const eliminarArchivo = async (nombreArchivo) => {
    if (!window.confirm(`¿Está seguro de eliminar el respaldo "${nombreArchivo}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await axios.delete(
        `${API}/respaldos/${encodeURIComponent(nombreArchivo)}?destino=${encodeURIComponent(destino)}`,
        conToken()
      );
      setMensajeExito(`Respaldo "${nombreArchivo}" eliminado correctamente.`);
      cargarHistorial();
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.mensaje || err.message));
    }
  };

  return (
    <div className="resp-page">
      {/* Cabecera */}
      <div className="resp-heading">
        <div>
          <span className="resp-eyebrow">ADMINISTRACIÓN & SEGURIDAD (DBA)</span>
          <h1>Copias de Seguridad (CU004)</h1>
          <p>Generación y resguardo de respaldos de la base de datos ante posibles fallos o pérdidas de datos.</p>
        </div>

        <div>
          {modoMonousuario ? (
            <span className="resp-badge-mono" title="La base de datos restringe accesos externos mientras se realiza el respaldo">
              MODO MONOUSUARIO ACTIVO
            </span>
          ) : (
            <span className="resp-badge-multi" title="La base de datos se encuentra operativa para todos los usuarios">
              MODO MULTIUSUARIO ACTIVO
            </span>
          )}
        </div>
      </div>

      {/* Alertas */}
      {mensajeExito && (
        <div className="resp-alerta exito" role="status">
          <span>{mensajeExito}</span>
          <button type="button" className="resp-btn-secondary" onClick={() => setMensajeExito('')}>×</button>
        </div>
      )}

      {mensajeError && (
        <div className="resp-alerta error" role="alert">
          <span>{mensajeError}</span>
          <button type="button" className="resp-btn-secondary" onClick={() => setMensajeError('')}>×</button>
        </div>
      )}

      {/* Cuadro de progreso durante la ejecución */}
      {generando && (
        <div className="resp-progreso-box">
          <div className="resp-progreso-titulo">
            <span className="resp-spinner" /> Ejecutando caso de uso de respaldo...
          </div>
          <ul className="resp-progreso-pasos">
            <li>{pasoActual >= 2 ? '[Completado]' : '[En progreso]'} Paso 4: Verificando espacio disponible y permisos de almacenamiento...</li>
            <li>{pasoActual >= 3 ? '[Completado]' : '[En progreso]'} Paso 5: Cambiando la base de datos a modo monousuario...</li>
            <li>{pasoActual >= 4 ? '[Completado]' : '[En progreso]'} Paso 6: Generando volcado de seguridad ({tipo.toUpperCase()})...</li>
            <li>{pasoActual >= 4 ? '[Completado]' : '[En progreso]'} Paso 7: Almacenando archivo(s) en {particiones} partición(es)...</li>
            <li>{pasoActual >= 5 ? '[Completado]' : '[En progreso]'} Paso 9: Restaurando base de datos a modo multiusuario...</li>
            <li>{pasoActual >= 6 ? '[Completado]' : '[En progreso]'} Paso 10: Registrando acción en bitácora con DVH y DVV...</li>
          </ul>
        </div>
      )}

      <div className="resp-grid">
        {/* Formulario de generación de respaldo */}
        <section className="resp-card">
          <h2>Generar nuevo respaldo</h2>
          <p className="resp-card-desc">Configure los parámetros de la copia de seguridad y presione el botón de confirmación.</p>

          <form onSubmit={ejecutarRespaldo}>
            {/* Tipo de respaldo */}
            <div className="resp-form-group">
              <label htmlFor="tipo-respaldo">Tipo de Respaldo:</label>
              <select
                id="tipo-respaldo"
                className="resp-select"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                disabled={generando}
              >
                <option value="completo">Completo (Estructura de tablas y todos los datos)</option>
                <option value="datos">Solo Datos (Inserts de registros sin DDL)</option>
                <option value="estructura">Solo Estructura (Definición de tablas y claves)</option>
              </select>
            </div>

            {/* Ubicación de almacenamiento */}
            <div className="resp-form-group">
              <label htmlFor="destino-respaldo">Ubicación de Almacenamiento:</label>
              <div className="resp-row-group">
                <input
                  id="destino-respaldo"
                  type="text"
                  className="resp-input"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="./backups"
                  disabled={generando}
                  required
                />
                <button
                  type="button"
                  className="resp-btn-secondary"
                  onClick={comprobarEspacioYPermisos}
                  disabled={verificandoEspacio || generando}
                  title="Comprobar permisos y espacio en disco"
                >
                  {verificandoEspacio ? 'Verificando…' : 'Verificar espacio'}
                </button>
              </div>

              {infoEspacio && (
                <div className={`resp-verif-box ${infoEspacio.ok ? 'ok' : 'error'}`}>
                  <strong>✓ Destino validado:</strong> {infoEspacio.ubicacion} <br />
                  <span>Espacio libre: {infoEspacio.espacioDisponibleLegible} | Permiso de escritura: Sí</span>
                </div>
              )}
            </div>

            {/* Cantidad de particiones */}
            <div className="resp-form-group">
              <label htmlFor="particiones-respaldo">Cantidad de Particiones:</label>
              <select
                id="particiones-respaldo"
                className="resp-select"
                value={particiones}
                onChange={(e) => setParticiones(Number(e.target.value))}
                disabled={generando}
              >
                <option value={1}>1 Partición (Archivo único .sql)</option>
                <option value={2}>2 Particiones (Volúmenes divididos)</option>
                <option value={3}>3 Particiones (Volúmenes divididos)</option>
                <option value={4}>4 Particiones (Volúmenes divididos)</option>
              </select>
            </div>

            {/* Comentario opcional */}
            <div className="resp-form-group">
              <label htmlFor="comentario-respaldo">Comentario o Motivo (Opcional):</label>
              <input
                id="comentario-respaldo"
                type="text"
                className="resp-input"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Ej: Respaldo previo a cierre contable mensual"
                disabled={generando}
              >
              </input>
            </div>

            {/* Botón principal */}
            <button
              type="submit"
              className="resp-btn-primary"
              disabled={generando}
            >
              {generando ? (
                <>
                  <span className="resp-spinner" /> Generando respaldo...
                </>
              ) : (
                <>Iniciar copia de seguridad</>
              )}
            </button>
          </form>
        </section>

        {/* Historial de respaldos realizados */}
        <section className="resp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Historial de respaldos</h2>
            <button
              type="button"
              className="resp-btn-secondary"
              onClick={cargarHistorial}
              disabled={cargandoHistorial || generando}
            >
              Actualizar
            </button>
          </div>
          <p className="resp-card-desc">Copias de seguridad almacenadas físicamente en el servidor.</p>

          {cargandoHistorial ? (
            <p className="resp-vacio">Cargando copias de seguridad...</p>
          ) : respaldos.length === 0 ? (
            <p className="resp-vacio">No hay copias de seguridad generadas en esta ubicación.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="resp-historial-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Tamaño</th>
                    <th>Particiones</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {respaldos.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{new Date(item.fecha).toLocaleDateString('es-AR')}</strong>
                        <div style={{ fontSize: '0.74rem', color: 'var(--resp-muted)' }}>
                          {new Date(item.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <span className={`resp-tag resp-tag-${item.tipo}`}>
                          {item.tipo}
                        </span>
                      </td>
                      <td>{item.tamanioTotalLegible}</td>
                      <td>{item.particiones || (item.archivos?.length || 1)} vol.</td>
                      <td>
                        <div className="resp-acciones-col">
                          {(item.archivos || []).map((nom) => (
                            <button
                              key={nom}
                              type="button"
                              className="resp-btn-accion"
                              onClick={() => descargarArchivo(nom)}
                              title={`Descargar ${nom}`}
                            >
                              Descargar {item.particiones > 1 ? nom.split('.').slice(-2).join('.') : 'SQL'}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="resp-btn-accion resp-btn-peligro"
                            onClick={() => eliminarArchivo(item.id || item.archivos?.[0])}
                            title="Eliminar este respaldo"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

