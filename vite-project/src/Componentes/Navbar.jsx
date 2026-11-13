import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/Navbar.css';
import { esAdmin } from '../auth';

export default function Navbar({ usuarioLogueado, onCerrarSesion, cerrandoSesion }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  return (
    <header className="navbar-header">
      <nav className="navbar" aria-label="Navegación principal">
        <div className="navbar-container">
          <a
            href="#"
            className="navbar-logo"
            aria-label="Inicio"
            onClick={(e) => {
              e.preventDefault();
              navigate(usuarioLogueado ? '/home' : '/login');
            }}
          >
            <img
              src="/resources/logo.svg"
              alt="Logo Hospital"
              className="logo-icon"
              width="36"
              height="36"
            />
          </a>

          <div className="navbar-links">
            {usuarioLogueado ? (
              <>
                {/* Opciones de Administrador */}
                {esAdmin() && (
                  <>
                    <button
                      type="button"
                      className={`navbar-item navbar-login ${path === '/admin/panel' ? 'activo' : ''}`}
                      onClick={() => navigate('/admin/panel')}
                    >
                      Panel
                    </button>
                    <button
                      type="button"
                      className={`navbar-item navbar-login ${path === '/admin/especialidades' ? 'activo' : ''}`}
                      onClick={() => navigate('/admin/especialidades')}
                    >
                      Especialidades
                    </button>
                    <button
                      type="button"
                      className={`navbar-item navbar-login ${path === '/admin/cartilla' || path === '/cartilla' ? 'activo' : ''}`}
                      onClick={() => navigate('/admin/cartilla')}
                    >
                      Cartilla
                    </button>
                    <button
                      type="button"
                      className={`navbar-item navbar-login ${path === '/admin/agregar-hospital' || path === '/agregar-hospital' ? 'activo' : ''}`}
                      onClick={() => navigate('/admin/agregar-hospital')}
                    >
                      Añadir hospital
                    </button>
                    <button
                      type="button"
                      className={`navbar-item navbar-login ${path === '/admin/sacar-hospital' || path === '/sacar-hospital' ? 'activo' : ''}`}
                      onClick={() => navigate('/admin/sacar-hospital')}
                    >
                      Sacar hospital
                    </button>
                    <button
                      type="button"
                      className={`navbar-item navbar-login ${path === '/admin/respaldo' || path === '/respaldo' ? 'activo' : ''}`}
                      onClick={() => navigate('/admin/respaldo')}
                    >
                      Respaldos
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className={`navbar-item navbar-login ${path === '/home' ? 'activo' : ''}`}
                  onClick={() => navigate('/home')}
                >
                  Inicio
                </button>
                <button
                  type="button"
                  className={`navbar-item navbar-login ${path === '/buscador' ? 'activo' : ''}`}
                  onClick={() => navigate('/buscador')}
                >
                  Buscar hospital
                </button>
                <button
                  type="button"
                  className={`navbar-item navbar-login ${path === '/planes' ? 'activo' : ''}`}
                  onClick={() => navigate('/planes')}
                >
                  Gestionar planes
                </button>
                <button
                  type="button"
                  className={`navbar-item navbar-login ${path === '/sacar-turno' ? 'activo' : ''}`}
                  onClick={() => navigate('/sacar-turno')}
                >
                  Sacar turno
                </button>
                <button
                  type="button"
                  className={`navbar-item navbar-login ${path === '/turnos' ? 'activo' : ''}`}
                  onClick={() => navigate('/turnos')}
                >
                  Mis turnos / Reservas
                </button>
                {esAdmin() && (
                  <button
                    type="button"
                    className={`navbar-item navbar-login ${path === '/admin/command' ? 'activo' : ''}`}
                    onClick={() => navigate('/admin/command')}
                  >
                    Consola Admin
                  </button>
                )}
                <button
                  type="button"
                  className={`navbar-item navbar-login ${path === '/valoraciones' ? 'activo' : ''}`}
                  onClick={() => navigate('/valoraciones')}
                >
                  Valoraciones
                </button>
                {esAdmin() && (
                  <button
                    type="button"
                    className={`navbar-item navbar-login ${path === '/integridad' ? 'activo' : ''}`}
                    onClick={() => navigate('/integridad')}
                  >
                    Integridad BD
                  </button>
                )}
                <button
                  type="button"
                  className={`navbar-item navbar-usuario ${path === '/perfil' ? 'activo' : ''}`}
                  onClick={() => navigate('/perfil')}
                  title="Ver y editar perfil"
                >
                  👤 {usuarioLogueado.NomApeU || usuarioLogueado.Email}
                </button>
                <button
                  type="button"
                  className="navbar-item navbar-logout"
                  disabled={cerrandoSesion}
                  onClick={onCerrarSesion}
                >
                  {cerrandoSesion ? 'Cerrando...' : 'Cerrar sesión'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`navbar-item navbar-login ${path === '/login' || path === '/' ? 'activo' : ''}`}
                  onClick={() => navigate('/login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`navbar-item navbar-register ${path === '/register' ? 'activo' : ''}`}
                  onClick={() => navigate('/register')}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
