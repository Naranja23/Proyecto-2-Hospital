import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SoloAdmin from './SoloAdmin';
import '../css/GestionUsuarios.css';

const API = 'http://localhost:3000';
const conToken = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export default function GestionUsuarios({ onSesionExpirada }) {
  // Lista de usuarios y planes disponibles
  const [usuarios, setUsuarios] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Filtros de búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Mensajes de retroalimentación
  const [avisoExito, setAvisoExito] = useState('');
  const [avisoError, setAvisoError] = useState('');

  // Estado del Modal de Formulario (Crear / Modificar)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false); // false = Crear, true = Modificar
  const [guardando, setGuardando] = useState(false);
  const [erroresFormulario, setErroresFormulario] = useState({});

  // Campos del formulario
  const [formData, setFormData] = useState({
    dni: '',
    NomApeU: '',
    email: '',
    password: '',
    edad: '',
    rol: 'Paciente',
    IDPlanes: '',
    estado: 'Activo'
  });

  // Modal de confirmación (Bloquear / Eliminar)
  const [confirmacion, setConfirmacion] = useState({
    abierto: false,
    tipo: null, // 'bloquear' | 'desbloquear' | 'eliminar' | 'reactivar'
    usuario: null,
    procesando: false
  });

  // ==========================================================================
  // PASO 2: Cargar la lista de usuarios registrados del sistema
  // Flujo Alternativo F 2: Manejo de error si la lista no llega correctamente
  // ==========================================================================
  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setAvisoError('');
    try {
      const [resUsers, resPlanes] = await Promise.all([
        axios.get(`${API}/users?todos=true&incluirInactivos=true`, conToken()),
        axios.get(`${API}/planes`, conToken()).catch(() => ({ data: [] }))
      ]);

      setUsuarios(Array.isArray(resUsers.data) ? resUsers.data : []);
      setPlanes(Array.isArray(resPlanes.data) ? resPlanes.data : []);
    } catch (err) {
      if (err.response?.status === 401 && onSesionExpirada) {
        onSesionExpirada();
        return;
      }
      const msg = err.response?.data?.message || err.message || 'No fue posible obtener la lista de usuarios.';
      setAvisoError(`[Flujo Alternativo F 2] Error al cargar los usuarios registrados: ${msg}. Haga clic en 'Reintentar'.`);
    } finally {
      setCargando(false);
    }
  }, [onSesionExpirada]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  // Limpiar avisos automáticamente luego de unos segundos
  useEffect(() => {
    if (avisoExito) {
      const timer = setTimeout(() => setAvisoExito(''), 7000);
      return () => clearTimeout(timer);
    }
  }, [avisoExito]);

  // ==========================================================================
  // PASO 3: Selección de acción: Crear Usuario
  // ==========================================================================
  const abrirModalCrear = () => {
    setAvisoError('');
    setAvisoExito('');
    setErroresFormulario({});
    setModoEdicion(false);
    setFormData({
      dni: '',
      NomApeU: '',
      email: '',
      password: '',
      edad: '',
      rol: 'Paciente',
      IDPlanes: '',
      estado: 'Activo'
    });
    setModalAbierto(true);
  };

  // ==========================================================================
  // PASO 3: Selección de acción: Modificar Usuario
  // ==========================================================================
  const abrirModalModificar = (usuario) => {
    setAvisoError('');
    setAvisoExito('');
    setErroresFormulario({});
    setModoEdicion(true);

    const rolActual = usuario.Rols?.[0]?.DescripcionR || (usuario.Rols?.some(r => r.DescripcionR === 'Administrador') ? 'Administrador' : 'Paciente');

    setFormData({
      dni: usuario.DNIUsuario,
      NomApeU: usuario.NomApeU || '',
      email: usuario.Email || '',
      password: '', // En blanco salvo que se quiera cambiar
      edad: usuario.EdadU ?? '',
      rol: rolActual,
      IDPlanes: usuario.IDPlanes ?? '',
      estado: usuario.EstadoU || 'Activo'
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
    setErroresFormulario({});
  };

  // ==========================================================================
  // PASO 4 y 5: Validación y Guardado (Crear o Modificar)
  // Flujo Alternativo F 4: Validación de datos
  // Flujo Alternativo F 6: Error al guardar cambios
  // ==========================================================================
  const validarFormulario = () => {
    const errs = {};
    if (!modoEdicion) {
      const dniNum = Number(formData.dni);
      if (!formData.dni || isNaN(dniNum) || dniNum < 1000000 || dniNum > 99999999) {
        errs.dni = 'El DNI debe ser numérico y contener entre 7 y 8 dígitos.';
      }
    }

    if (!formData.NomApeU || formData.NomApeU.trim().length < 3) {
      errs.NomApeU = 'El nombre y apellido son obligatorios (mínimo 3 caracteres).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      errs.email = 'Debe ingresar una dirección de correo electrónico válida.';
    }

    if (!modoEdicion) {
      if (!formData.password || formData.password.length < 6) {
        errs.password = 'La contraseña es obligatoria (mínimo 6 caracteres).';
      }
    } else if (formData.password && formData.password.length < 6) {
      errs.password = 'Si cambia la contraseña, debe contener al menos 6 caracteres.';
    }

    if (formData.edad !== '' && formData.edad !== null) {
      const edadNum = Number(formData.edad);
      if (isNaN(edadNum) || edadNum < 1 || edadNum > 125) {
        errs.edad = 'La edad debe ser un número entero válido (1 - 125 años).';
      }
    }

    setErroresFormulario(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setAvisoError('');
    setAvisoExito('');

    // Validación F 4
    if (!validarFormulario()) {
      setAvisoError('[Flujo Alternativo F 4] Los datos ingresados son inválidos. Revise los campos destacados.');
      return;
    }

    setGuardando(true);
    try {
      if (modoEdicion) {
        // PASO 5: Actualizar información de usuario existente
        const payload = {
          NomApeU: formData.NomApeU.trim(),
          Email: formData.email.trim(),
          EdadU: formData.edad !== '' ? Number(formData.edad) : null,
          EstadoU: formData.estado,
          rol: formData.rol,
          IDPlanes: formData.IDPlanes ? Number(formData.IDPlanes) : null
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }

        const res = await axios.put(`${API}/users/${formData.dni}`, payload, conToken());

        // PASO 7 y 8: El sistema informa éxito y registra en bitácora con DVH y DVV
        setAvisoExito(`✓ ${res.data?.message || 'Usuario modificado correctamente.'} (Dígitos verificadores recalculados y bitácora actualizada).`);
      } else {
        // PASO 5: Crear nuevo usuario
        const payload = {
          dni: Number(formData.dni),
          NomApeU: formData.NomApeU.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          EdadU: formData.edad !== '' ? Number(formData.edad) : null,
          rol: formData.rol,
          IDPlanes: formData.IDPlanes ? Number(formData.IDPlanes) : null,
          EstadoU: formData.estado
        };

        const res = await axios.post(`${API}/users`, payload, conToken());

        // PASO 7 y 8: Éxito con DV y bitácora
        setAvisoExito(`✓ ${res.data?.message || 'Usuario creado correctamente.'} (Dígito Verificador DVH calculado y DVV actualizado).`);
      }

      setModalAbierto(false);
      await cargarUsuarios(); // Vuelve al paso 2
    } catch (err) {
      if (err.response?.status === 401 && onSesionExpirada) {
        onSesionExpirada();
        return;
      }
      // Flujo Alternativo F 3: El usuario seleccionado no existe
      if (err.response?.status === 404) {
        setAvisoError('[Flujo Alternativo F 3] El usuario seleccionado no existe en el sistema. Se recarga la lista.');
        setModalAbierto(false);
        cargarUsuarios();
        return;
      }
      // Flujo Alternativo F 4: Datos inválidos
      if (err.response?.status === 400 || err.response?.status === 409) {
        const msg = err.response?.data?.message || 'Datos ingresados no válidos.';
        setAvisoError(`[Flujo Alternativo F 4] ${msg}`);
        return;
      }
      // Flujo Alternativo F 6: Error al guardar cambios
      const msg = err.response?.data?.message || err.message || 'Error desconocido';
      setAvisoError(`[Flujo Alternativo F 6] Ocurrió un error al guardar los cambios en la base de datos: ${msg}. Vuelve a la lista.`);
      setModalAbierto(false);
      cargarUsuarios();
    } finally {
      setGuardando(false);
    }
  };

  // ==========================================================================
  // PASO 3: Selección de acción: Bloquear / Desbloquear Usuario
  // ==========================================================================
  const abrirConfirmacionBloqueo = (usuario) => {
    const esBloqueado = usuario.EstadoU === 'Bloqueado';
    setConfirmacion({
      abierto: true,
      tipo: esBloqueado ? 'desbloquear' : 'bloquear',
      usuario,
      procesando: false
    });
  };

  // ==========================================================================
  // PASO 3: Selección de acción: Eliminar Usuario (Baja lógica)
  // ==========================================================================
  const abrirConfirmacionEliminar = (usuario) => {
    setConfirmacion({
      abierto: true,
      tipo: 'eliminar',
      usuario,
      procesando: false
    });
  };

  const abrirConfirmacionReactivar = (usuario) => {
    setConfirmacion({
      abierto: true,
      tipo: 'reactivar',
      usuario,
      procesando: false
    });
  };

  const ejecutarAccionConfirmada = async () => {
    const { tipo, usuario } = confirmacion;
    if (!usuario) return;

    setConfirmacion((prev) => ({ ...prev, procesando: true }));
    setAvisoError('');
    setAvisoExito('');

    try {
      if (tipo === 'bloquear' || tipo === 'desbloquear') {
        const nuevoEstado = tipo === 'bloquear' ? 'Bloqueado' : 'Activo';
        const res = await axios.put(`${API}/users/${usuario.DNIUsuario}/bloquear`, { estado: nuevoEstado }, conToken());
        setAvisoExito(`✓ ${res.data?.message || 'Estado del usuario actualizado.'} (DVH y DVV recalculados, bitácora registrada).`);
      } else if (tipo === 'eliminar') {
        const res = await axios.delete(`${API}/users/${usuario.DNIUsuario}`, conToken());
        setAvisoExito(`✓ ${res.data?.message || 'Usuario eliminado correctamente (borrado lógico).'} (DVH y DVV recalculados).`);
      } else if (tipo === 'reactivar') {
        const res = await axios.put(`${API}/users/${usuario.DNIUsuario}/reactivar`, {}, conToken());
        setAvisoExito(`✓ ${res.data?.message || 'Usuario reactivado a estado Activo.'} (DVH y DVV recalculados).`);
      }

      setConfirmacion({ abierto: false, tipo: null, usuario: null, procesando: false });
      await cargarUsuarios(); // Vuelve a paso 2
    } catch (err) {
      if (err.response?.status === 401 && onSesionExpirada) {
        onSesionExpirada();
        return;
      }
      if (err.response?.status === 404) {
        setAvisoError('[Flujo Alternativo F 3] El usuario seleccionado no existe en el sistema.');
      } else if (err.response?.status === 400) {
        const msg = err.response?.data?.message || 'Operación inválida.';
        setAvisoError(`[Flujo Alternativo F 4] ${msg}`);
      } else {
        const msg = err.response?.data?.message || err.message || 'Error al procesar la operación';
        setAvisoError(`[Flujo Alternativo F 6] Ocurrió un error al guardar los cambios: ${msg}`);
      }
      setConfirmacion({ abierto: false, tipo: null, usuario: null, procesando: false });
      cargarUsuarios(); // Vuelve a paso 2
    }
  };

  // ==========================================================================
  // FILTRADO DE USUARIOS
  // ==========================================================================
  const usuariosFiltrados = usuarios.filter((u) => {
    // Filtro por texto (DNI, Nombre, Email)
    const q = busqueda.trim().toLowerCase();
    const coincideTexto =
      !q ||
      String(u.DNIUsuario).includes(q) ||
      (u.NomApeU && u.NomApeU.toLowerCase().includes(q)) ||
      (u.Email && u.Email.toLowerCase().includes(q));

    // Filtro por Estado
    const coincideEstado =
      filtroEstado === 'Todos' ||
      (u.EstadoU && u.EstadoU.toLowerCase() === filtroEstado.toLowerCase());

    // Filtro por Rol
    const rolUsuario = u.Rols?.[0]?.DescripcionR || (u.Rols?.some(r => r.DescripcionR === 'Administrador') ? 'Administrador' : 'Paciente');
    const coincideRol =
      filtroRol === 'Todos' ||
      rolUsuario.toLowerCase() === filtroRol.toLowerCase();

    return coincideTexto && coincideEstado && coincideRol;
  });

  // Estadísticas rápidas
  const totalActivos = usuarios.filter((u) => u.EstadoU === 'Activo').length;
  const totalBloqueados = usuarios.filter((u) => u.EstadoU === 'Bloqueado').length;
  const totalInactivos = usuarios.filter((u) => u.EstadoU === 'Inactivo').length;

  return (
    <SoloAdmin>
      <section className="gestion-usuarios" aria-labelledby="titulo-gestion-usuarios">
        {/* Encabezado del caso de uso */}
        <header className="gu-header">
          <div className="gu-header-info">
            <span className="gu-badge-cu">CU001</span>
            <h1 id="titulo-gestion-usuarios">Gestionar Usuarios</h1>
            <p className="gu-subtitulo">
              Permite al administrador crear, modificar, bloquear o dar de baja usuarios del sistema con validación de integridad (DVH / DVV) y auditoría en bitácora.
            </p>
          </div>
          <div className="gu-header-acciones">
            <button
              type="button"
              className="btn-crear-usuario"
              onClick={abrirModalCrear}
              title="Dar de alta un nuevo usuario en el sistema"
            >
              + Nuevo Usuario
            </button>
          </div>
        </header>

        {/* Métricas y resumen del sistema */}
        <div className="gu-stats-bar">
          <div className="gu-stat-item">
            <span className="gu-stat-num">{usuarios.length}</span>
            <span className="gu-stat-label">Total Usuarios</span>
          </div>
          <div className="gu-stat-item stat-activo">
            <span className="gu-stat-num">{totalActivos}</span>
            <span className="gu-stat-label">Activos</span>
          </div>
          <div className="gu-stat-item stat-bloqueado">
            <span className="gu-stat-num">{totalBloqueados}</span>
            <span className="gu-stat-label">Bloqueados</span>
          </div>
          <div className="gu-stat-item stat-inactivo">
            <span className="gu-stat-num">{totalInactivos}</span>
            <span className="gu-stat-label">Inactivos (Baja lógica)</span>
          </div>
        </div>

        {/* Mensajes de retroalimentación de la operación */}
        {avisoExito && (
          <div className="gu-alerta gu-alerta-exito" role="status">
            <span>{avisoExito}</span>
            <button type="button" onClick={() => setAvisoExito('')} aria-label="Cerrar aviso">×</button>
          </div>
        )}

        {avisoError && (
          <div className="gu-alerta gu-alerta-error" role="alert">
            <span>{avisoError}</span>
            <button type="button" className="btn-reintentar" onClick={cargarUsuarios}>
              🔄 Reintentar
            </button>
            <button type="button" onClick={() => setAvisoError('')} aria-label="Cerrar error">×</button>
          </div>
        )}

        {/* Barra de Filtros y Búsqueda */}
        <div className="gu-filtros-bar">
          <div className="gu-buscador">
            <input
              type="text"
              placeholder="Buscar por DNI, Nombre o Email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar usuarios"
            />
            {busqueda && (
              <button
                type="button"
                className="btn-limpiar-busqueda"
                onClick={() => setBusqueda('')}
                title="Limpiar búsqueda"
              >
                ×
              </button>
            )}
          </div>

          <div className="gu-selectores">
            <label htmlFor="filtro-rol">
              Rol:
              <select
                id="filtro-rol"
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
              >
                <option value="Todos">Todos los roles</option>
                <option value="Administrador">Administrador</option>
                <option value="Medico">Médico</option>
                <option value="Paciente">Paciente</option>
              </select>
            </label>

            <label htmlFor="filtro-estado">
              Estado:
              <select
                id="filtro-estado"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="Todos">Todos los estados</option>
                <option value="Activo">Activos</option>
                <option value="Bloqueado">Bloqueados</option>
                <option value="Inactivo">Inactivos</option>
              </select>
            </label>

            <button
              type="button"
              className="btn-recargar"
              onClick={cargarUsuarios}
              disabled={cargando}
              title="Recargar la lista de usuarios desde la base de datos"
            >
              🔄 Recargar
            </button>
          </div>
        </div>

        {/* Tabla de Usuarios Registrados (Paso 2) */}
        <div className="gu-tabla-container">
          {cargando ? (
            <div className="gu-cargando">
              <span className="gu-spinner" />
              <p>Cargando lista de usuarios registrados...</p>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="gu-vacio">
              <p>No se encontraron usuarios que coincidan con los criterios de búsqueda.</p>
              {(busqueda || filtroRol !== 'Todos' || filtroEstado !== 'Todos') && (
                <button
                  type="button"
                  className="btn-limpiar-filtros"
                  onClick={() => { setBusqueda(''); setFiltroRol('Todos'); setFiltroEstado('Todos'); }}
                >
                  Restablecer filtros
                </button>
              )}
            </div>
          ) : (
            <table className="gu-tabla" aria-label="Tabla de usuarios registrados">
              <thead>
                <tr>
                  <th>DNI</th>
                  <th>Nombre y Apellido</th>
                  <th>Email</th>
                  <th>Edad</th>
                  <th>Rol</th>
                  <th>Plan / Obra Social</th>
                  <th>Estado</th>
                  <th>DVH</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => {
                  const rolDesc = u.Rols?.[0]?.DescripcionR || (u.Rols?.some(r => r.DescripcionR === 'Administrador') ? 'Administrador' : 'Paciente');
                  const planDesc = u.Plan?.NombrePlan || 'Sin plan';
                  const esBloqueado = u.EstadoU === 'Bloqueado';
                  const esInactivo = u.EstadoU === 'Inactivo';

                  return (
                    <tr key={u.DNIUsuario} className={`fila-usuario ${esInactivo ? 'fila-inactiva' : ''} ${esBloqueado ? 'fila-bloqueada' : ''}`}>
                      <td className="celda-dni">
                        <strong>{u.DNIUsuario}</strong>
                      </td>
                      <td className="celda-nombre">{u.NomApeU || '—'}</td>
                      <td className="celda-email">{u.Email}</td>
                      <td>{u.EdadU ? `${u.EdadU} años` : '—'}</td>
                      <td>
                        <span className={`badge-rol badge-rol-${rolDesc.toLowerCase()}`}>
                          {rolDesc}
                        </span>
                      </td>
                      <td>{planDesc}</td>
                      <td>
                        <span className={`badge-estado badge-estado-${(u.EstadoU || 'Activo').toLowerCase()}`}>
                          {u.EstadoU || 'Activo'}
                        </span>
                      </td>
                      <td className="celda-dvh" title={`Dígito Verificador Horizontal numérico: ${u.DVH ?? 'N/A'}`}>
                        <code>{u.DVH != null ? u.DVH : '—'}</code>
                      </td>
                      <td className="celda-acciones">
                        {/* Botón Modificar */}
                        <button
                          type="button"
                          className="btn-accion btn-modificar"
                          onClick={() => abrirModalModificar(u)}
                          title="Modificar datos del usuario (CU001)"
                        >
                          ✏️ Modificar
                        </button>

                        {/* Botón Bloquear / Desbloquear */}
                        {!esInactivo && (
                          <button
                            type="button"
                            className={`btn-accion ${esBloqueado ? 'btn-desbloquear' : 'btn-bloquear'}`}
                            onClick={() => abrirConfirmacionBloqueo(u)}
                            title={esBloqueado ? 'Desbloquear acceso al usuario' : 'Bloquear acceso al usuario (CU001)'}
                          >
                            {esBloqueado ? '🔓 Desbloquear' : '🔒 Bloquear'}
                          </button>
                        )}

                        {/* Botón Eliminar / Reactivar */}
                        {!esInactivo ? (
                          <button
                            type="button"
                            className="btn-accion btn-eliminar"
                            onClick={() => abrirConfirmacionEliminar(u)}
                            title="Dar de baja al usuario (Borrado lógico - CU001)"
                          >
                            🗑️ Eliminar
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-accion btn-reactivar"
                            onClick={() => abrirConfirmacionReactivar(u)}
                            title="Reactivar usuario dado de baja"
                          >
                            🔄 Reactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ================================================================== */}
        {/* MODAL: CREAR / MODIFICAR USUARIO (PASOS 4 Y 5)                     */}
        {/* ================================================================== */}
        {modalAbierto && (
          <div className="gu-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
            <div className="gu-modal-content">
              <header className="gu-modal-header">
                <h2 id="modal-titulo">
                  {modoEdicion ? `Modificar Usuario (DNI: ${formData.dni})` : 'Crear Nuevo Usuario'}
                </h2>
                <button
                  type="button"
                  className="btn-cerrar-modal"
                  onClick={cerrarModal}
                  disabled={guardando}
                  aria-label="Cerrar ventana"
                >
                  ×
                </button>
              </header>

              <form onSubmit={handleSubmitForm} className="gu-form">
                {/* DNI */}
                <div className="gu-campo">
                  <label htmlFor="campo-dni">
                    DNI <span className="requerido">*</span>:
                  </label>
                  <input
                    id="campo-dni"
                    type="number"
                    placeholder="Ej: 35123456"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    disabled={modoEdicion || guardando}
                    className={erroresFormulario.dni ? 'campo-invalido' : ''}
                    autoFocus={!modoEdicion}
                  />
                  {erroresFormulario.dni && (
                    <span className="error-texto" role="alert">{erroresFormulario.dni}</span>
                  )}
                  {modoEdicion && (
                    <small className="gu-ayuda">El DNI es la clave identificadora y no se puede modificar.</small>
                  )}
                </div>

                {/* Nombre y Apellido */}
                <div className="gu-campo">
                  <label htmlFor="campo-nombre">
                    Nombre y Apellido <span className="requerido">*</span>:
                  </label>
                  <input
                    id="campo-nombre"
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={formData.NomApeU}
                    onChange={(e) => setFormData({ ...formData, NomApeU: e.target.value })}
                    disabled={guardando}
                    className={erroresFormulario.NomApeU ? 'campo-invalido' : ''}
                  />
                  {erroresFormulario.NomApeU && (
                    <span className="error-texto" role="alert">{erroresFormulario.NomApeU}</span>
                  )}
                </div>

                {/* Email */}
                <div className="gu-campo">
                  <label htmlFor="campo-email">
                    Correo Electrónico <span className="requerido">*</span>:
                  </label>
                  <input
                    id="campo-email"
                    type="email"
                    placeholder="juan.perez@hospital.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={guardando}
                    className={erroresFormulario.email ? 'campo-invalido' : ''}
                  />
                  {erroresFormulario.email && (
                    <span className="error-texto" role="alert">{erroresFormulario.email}</span>
                  )}
                </div>

                {/* Contraseña */}
                <div className="gu-campo">
                  <label htmlFor="campo-password">
                    Contraseña {modoEdicion ? '(Opcional si no desea cambiarla)' : <span className="requerido">*</span>}:
                  </label>
                  <input
                    id="campo-password"
                    type="password"
                    placeholder={modoEdicion ? 'Dejar en blanco para mantener la actual' : 'Mínimo 6 caracteres'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={guardando}
                    className={erroresFormulario.password ? 'campo-invalido' : ''}
                  />
                  {erroresFormulario.password && (
                    <span className="error-texto" role="alert">{erroresFormulario.password}</span>
                  )}
                </div>

                {/* Fila doble: Edad y Rol */}
                <div className="gu-fila-doble">
                  <div className="gu-campo">
                    <label htmlFor="campo-edad">Edad:</label>
                    <input
                      id="campo-edad"
                      type="number"
                      placeholder="Ej: 32"
                      value={formData.edad}
                      onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                      disabled={guardando}
                      min="1"
                      max="125"
                      className={erroresFormulario.edad ? 'campo-invalido' : ''}
                    />
                    {erroresFormulario.edad && (
                      <span className="error-texto" role="alert">{erroresFormulario.edad}</span>
                    )}
                  </div>

                  <div className="gu-campo">
                    <label htmlFor="campo-rol">
                      Rol en el Sistema <span className="requerido">*</span>:
                    </label>
                    <select
                      id="campo-rol"
                      value={formData.rol}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                      disabled={guardando}
                    >
                      <option value="Paciente">Paciente</option>
                      <option value="Medico">Médico</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>
                </div>

                {/* Fila doble: Plan / Obra Social y Estado */}
                <div className="gu-fila-doble">
                  <div className="gu-campo">
                    <label htmlFor="campo-plan">Plan / Prepaga:</label>
                    <select
                      id="campo-plan"
                      value={formData.IDPlanes}
                      onChange={(e) => setFormData({ ...formData, IDPlanes: e.target.value })}
                      disabled={guardando}
                    >
                      <option value="">Ninguno / Particular</option>
                      {planes.map((p) => (
                        <option key={p.IDPlan} value={p.IDPlan}>
                          {p.NombrePlan} {p.TipoPlan ? `(${p.TipoPlan})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="gu-campo">
                    <label htmlFor="campo-estado">
                      Estado <span className="requerido">*</span>:
                    </label>
                    <select
                      id="campo-estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      disabled={guardando}
                    >
                      <option value="Activo">Activo</option>
                      <option value="Bloqueado">Bloqueado</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>

                <footer className="gu-modal-footer">
                  <button
                    type="button"
                    className="btn-cancelar"
                    onClick={cerrarModal}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-guardar"
                    disabled={guardando}
                  >
                    {guardando ? (
                      <>
                        <span className="gu-spinner gu-spinner-chico" /> Guardando...
                      </>
                    ) : modoEdicion ? (
                      'Actualizar Usuario'
                    ) : (
                      'Crear Usuario'
                    )}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL DE CONFIRMACIÓN (BLOQUEAR / ELIMINAR / REACTIVAR)             */}
        {/* ================================================================== */}
        {confirmacion.abierto && confirmacion.usuario && (
          <div className="gu-modal-overlay" role="dialog" aria-modal="true">
            <div className="gu-modal-content gu-modal-confirmacion">
              <h3>
                {confirmacion.tipo === 'bloquear' && '¿Bloquear acceso al usuario?'}
                {confirmacion.tipo === 'desbloquear' && '¿Desbloquear acceso al usuario?'}
                {confirmacion.tipo === 'eliminar' && '¿Confirmar baja lógica del usuario?'}
                {confirmacion.tipo === 'reactivar' && '¿Reactivar usuario inactivo?'}
              </h3>
              <p>
                {confirmacion.tipo === 'bloquear' && (
                  <>
                    El usuario <strong>{confirmacion.usuario.NomApeU}</strong> (DNI: {confirmacion.usuario.DNIUsuario}) no podrá iniciar sesión en el sistema mientras se encuentre bloqueado.
                  </>
                )}
                {confirmacion.tipo === 'desbloquear' && (
                  <>
                    Se restablecerá el acceso para el usuario <strong>{confirmacion.usuario.NomApeU}</strong> (DNI: {confirmacion.usuario.DNIUsuario}).
                  </>
                )}
                {confirmacion.tipo === 'eliminar' && (
                  <>
                    Se realizará la baja lógica del usuario <strong>{confirmacion.usuario.NomApeU}</strong> (DNI: {confirmacion.usuario.DNIUsuario}). Sus datos históricos se mantendrán para auditoría y su estado pasará a <em>Inactivo</em>.
                  </>
                )}
                {confirmacion.tipo === 'reactivar' && (
                  <>
                    El usuario <strong>{confirmacion.usuario.NomApeU}</strong> volverá a figurar como <em>Activo</em> en el sistema.
                  </>
                )}
              </p>
              <footer className="gu-modal-footer">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => setConfirmacion({ abierto: false, tipo: null, usuario: null, procesando: false })}
                  disabled={confirmacion.procesando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`btn-confirmar btn-confirmar-${confirmacion.tipo}`}
                  onClick={ejecutarAccionConfirmada}
                  disabled={confirmacion.procesando}
                >
                  {confirmacion.procesando ? 'Procesando...' : 'Confirmar'}
                </button>
              </footer>
            </div>
          </div>
        )}
      </section>
    </SoloAdmin>
  );
}

