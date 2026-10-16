import React from 'react';
import './Navbar.css';

export default function Navbar({ onSeleccionarVista, vistaActual }) {
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
              if (onSeleccionarVista) onSeleccionarVista('home');
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
          </div>
        </div>
      </nav>
    </header>
  );
}
