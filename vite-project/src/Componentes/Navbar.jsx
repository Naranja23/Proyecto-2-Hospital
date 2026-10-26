import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/Navbar.css';
import { esAdmin } from '../auth'

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
              //Gestiones Medicas
                {esAdmin() && (
                  <button
                    type="button"
                    className={`navbar-item navbar-login ${
                      path === '/admin/especialidades' ? 'activo' : ''
                    }`}
                    onClick={() => navigate('/admin/especialidades')}
                  >
                    Especialidades
                  </button>
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
                  className={`navbar-item navbar-login ${path === '/planes' ? 'activo' : ''}`}
                  onClick={() => navigate('/planes')}
                >
                  Gestionar planes
                </button>
                <button
                  type="button"
                  className={`navbar-item navbar-login ${(path === '/turnos') ? 'activo' : ''}`}
                  onClick={() => navigate('/turnos')}
                >
                  Mis turnos / Reservas
                </button>
                <button
                  type="button"
                  className={`navbar-item navbar-login ${path === '/gt' ? 'activo' : ''}`}
                  onClick={() => navigate('/valoraciones')}
                >
                  Valoraciones
                </button>
                <button
                  type="button"
                  className={`navbar-item navbar-login ${path === '/integridad' ? 'activo' : ''}`}
                  onClick={() => navigate('/integridad')}
                >
                  Integridad BD
                </button>
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