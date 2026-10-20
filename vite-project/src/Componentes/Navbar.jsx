import React from 'react';
import '../css/Navbar.css';

export default function Navbar({ onSeleccionarVista, vistaActual, usuarioLogueado, onCerrarSesion }) {
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
              if (usuarioLogueado) {
                if (onSeleccionarVista) onSeleccionarVista('home');
              } else {
                if (onSeleccionarVista) onSeleccionarVista('login');
              }
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
                <button
                  type="button"
                  className={`navbar-item navbar-login ${vistaActual === 'home' ? 'activo' : ''}`}
                  onClick={() => onSeleccionarVista && onSeleccionarVista('home')}
                >
                  Inicio
                </button>
                <button
                  type="button"
                  className={`navbar-item navbar-login ${vistaActual === 'planes' ? 'activo' : ''}`}
                  onClick={() => onSeleccionarVista && onSeleccionarVista('planes')}
                >
                  Gestionar planes
                </button>
                <button
                  type="button"
                  className={`navbar-item navbar-login ${
                    vistaActual === 'valoraciones' ? 'activo' : ''
                  }`}
                  onClick={() => onSeleccionarVista && onSeleccionarVista('valoraciones')}
                >
                  Valoraciones
                </button>
                <span className="navbar-usuario">
                   {usuarioLogueado.NomApeU || usuarioLogueado.Email}
                </span>
                <button
                  type="button"
                  className="navbar-item navbar-logout"
                  onClick={onCerrarSesion}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`navbar-item navbar-login ${vistaActual === 'login' ? 'activo' : ''}`}
                  onClick={() => onSeleccionarVista && onSeleccionarVista('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`navbar-item navbar-register ${vistaActual === 'register' ? 'activo' : ''}`}
                  onClick={() => onSeleccionarVista && onSeleccionarVista('register')}
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
