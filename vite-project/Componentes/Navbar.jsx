import React from 'react';
import './Navbar.css';

export default function Navbar() {
  return (
    <header className="navbar-header">
      <nav className="navbar" aria-label="Navegación principal">
        <div className="navbar-container">
          <a href="#" className="navbar-logo" aria-label="Inicio">
            <img
              src="/resources/logo.svg"
              alt="Logo Hospital"
              className="logo-icon"
              width="36"
              height="36"
            />
          </a>

          <div className="navbar-links">
            <a href="#login" className="navbar-item navbar-login">
              Login
            </a>
            <a href="#register" className="navbar-item navbar-register">
              Register
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
