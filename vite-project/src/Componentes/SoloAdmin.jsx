// PROTECCIÓN VISUAL: oculta la pantalla a quien no tenga sesión o rol administrador.

import { Link, Navigate } from 'react-router-dom';
import { esAdmin, leerUsuario } from '../auth';
import '../css/Hospitales.css';

/**
 * Actor principal: Administrador. Envuelve las pantallas que solo él puede ver:
 *   <Route path="/admin/cartilla" element={<SoloAdmin><Cartilla /></SoloAdmin>} />
 * Sin sesión te manda a /login. Es una ayuda de interfaz: la seguridad real
 * está en el back (verificarSesion + soloAdmin).
 */
export default function SoloAdmin({ children }) {
  if (!leerUsuario()) return <Navigate to="/login" replace />;

  if (!esAdmin()) {
    return (
      <section className="hosp-page">
        <p className="hosp-vacio">Esta sección es solo para administradores.</p>
        <p className="hosp-vacio">
          <Link to="/">Volver al inicio</Link>
        </p>
      </section>
    );
  }
  return children;
}
