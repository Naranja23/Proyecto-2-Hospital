import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './Componentes/Navbar'
import Login from './Componentes/Login'
import RegisterConPanel from './Componentes/RegisterConPanel'
import Valoraciones from './Componentes/Valoraciones'
import Planes from './Componentes/Planes'
import Historial from './Componentes/Historial'
import Home from './Componentes/Home'
import Perfil from './Componentes/Perfil'
import Integridad from './Componentes/Integridad'
import Buscador from './Componentes/Buscador'
import SacarTurno from './Componentes/SacarTurno'
import './css/App.css'
import axios from 'axios'
// Import para el frontend de Gestiones Medicas
import Especialidades from './Componentes/Especialidades'
import SoloAdmin from './Componentes/SoloAdmin'
<<<<<<< HEAD
//Import de Backups
import Backups from './Componentes/Backups'
=======
import Panel from './Componentes/panel'
import GestionUsuarios from './Componentes/GestionUsuarios'
import Cartilla from './Componentes/Cartilla'
import AgregarHospital from './Componentes/AgregarHospital'
import BloquearHospital from './Componentes/BloquearHospital'
import SacarHospital from './Componentes/SacarHospital'
import Respaldo from './Componentes/Respaldo'
>>>>>>> ad1382b59c4d5cbfb47e4f1d8db54e7303066cb6

const API = 'http://localhost:3000'

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(() => {
    try {
      const stored = localStorage.getItem('usuario')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [errorSesion, setErrorSesion] = useState('')

  const manejarLoginExitoso = (usr) => {
    setUsuarioLogueado(usr)
  }

  const limpiarSesionLocal = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuarioLogueado(null)
    setErrorSesion('')
  }

  const cerrarSesion = async () => {
    setErrorSesion('')
    setCerrandoSesion(true)
    try {
      await axios.post(
        `${API}/users/logout`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      limpiarSesionLocal()
    } catch (error) {
      if (error.response?.status === 401) {
        limpiarSesionLocal()
      } else {
        setErrorSesion(error.response?.data?.message || 'No fue posible cerrar sesión. Probá de nuevo.')
      }
    } finally {
      setCerrandoSesion(false)
    }
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Navbar
          usuarioLogueado={usuarioLogueado}
          onCerrarSesion={cerrarSesion}
          cerrandoSesion={cerrandoSesion}
        />
        {errorSesion && (
          <div className="aviso-sesion" role="alert">
            <span>{errorSesion}</span>
            <button type="button" onClick={cerrarSesion} disabled={cerrandoSesion}>Reintentar</button>
          </div>
        )}
        <main className="content">
          <Routes>
            <Route
              path="/"
              element={<Navigate to={usuarioLogueado ? "/home" : "/login"} replace />}
            />
            <Route
              path="/login"
              element={usuarioLogueado ? <Navigate to="/home" replace /> : <Login onLoginExitoso={manejarLoginExitoso} />}
            />
            <Route
              path="/register"
              element={usuarioLogueado ? <Navigate to="/home" replace /> : <RegisterConPanel />}
            />
            <Route
              path="/home"
              element={usuarioLogueado ? <Home usuario={usuarioLogueado} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/buscador"
              element={usuarioLogueado ? <Buscador onSesionExpirada={limpiarSesionLocal} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/sacar-turno"
              element={usuarioLogueado ? <SacarTurno onSesionExpirada={limpiarSesionLocal} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/turnos"
              element={usuarioLogueado ? <Historial onSesionExpirada={limpiarSesionLocal} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/reservaciones"
              element={usuarioLogueado ? <Historial onSesionExpirada={limpiarSesionLocal} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/integridad"
              element={usuarioLogueado ? (
                <SoloAdmin>
                  <Integridad onSesionExpirada={limpiarSesionLocal} />
                </SoloAdmin>
              ) : <Navigate to="/login" replace />}
            />
            <Route
              path="/valoraciones"
              element={usuarioLogueado ? <Valoraciones onSesionExpirada={limpiarSesionLocal} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/planes"
              element={usuarioLogueado ? <Planes onSesionExpirada={limpiarSesionLocal} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/perfil"
              element={usuarioLogueado ? (
                <Perfil
                  usuario={usuarioLogueado}
                  onUsuarioActualizado={setUsuarioLogueado}
                  onSesionExpirada={limpiarSesionLocal}
                />
              ) : <Navigate to="/login" replace />}
            />
<<<<<<< HEAD
            {/* Gestión médica */}
=======
            {/* Gestiones Medicas */}
>>>>>>> ad1382b59c4d5cbfb47e4f1d8db54e7303066cb6
            <Route
              path="/admin/especialidades"
              element={usuarioLogueado ? (
                <SoloAdmin>
                  <Especialidades onSesionExpirada={limpiarSesionLocal} />
                </SoloAdmin>
              ) : <Navigate to="/login" replace />}
            />
            {/* Backups Automaticos */}
            <Route
              path="/admin/backups"
              element={
                usuarioLogueado ? (
                  <SoloAdmin>
                    <Backups onSesionExpirada={limpiarSesionLocal} />
                  </SoloAdmin>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/admin/panel"
              element={usuarioLogueado ? (
                <SoloAdmin><Panel onSesionExpirada={limpiarSesionLocal} /></SoloAdmin>
              ) : <Navigate to="/login" replace />}
            />
            <Route
              path="/admin/usuarios"
              element={usuarioLogueado ? (
                <SoloAdmin>
                  <GestionUsuarios onSesionExpirada={limpiarSesionLocal} />
                </SoloAdmin>
              ) : <Navigate to="/login" replace />}
            />
            <Route
              path="/admin/command"
              element={<Navigate to="/admin/usuarios" replace />}
            />
            <Route
              path="/admin/respaldo"
              element={usuarioLogueado ? (
                <SoloAdmin>
                  <Respaldo onSesionExpirada={limpiarSesionLocal} />
                </SoloAdmin>
              ) : <Navigate to="/login" replace />}
            />
            <Route
              path="/respaldo"
              element={usuarioLogueado ? (
                <SoloAdmin>
                  <Respaldo onSesionExpirada={limpiarSesionLocal} />
                </SoloAdmin>
              ) : <Navigate to="/login" replace />}
            />

            {/* Hospitales y Cartilla */}
            <Route
              path="/admin/cartilla"
              element={usuarioLogueado ? (
                <SoloAdmin>
                  <Cartilla />
                </SoloAdmin>
              ) : <Navigate to="/login" replace />}
            />
            <Route
              path="/cartilla"
              element={usuarioLogueado ? (
                <SoloAdmin>
                  <Cartilla />
                </SoloAdmin>
              ) : <Navigate to="/login" replace />}
            />
            <Route
              path="/admin/agregar-hospital"
              element={usuarioLogueado ? (
                <SoloAdmin>
                  <AgregarHospital />
                </SoloAdmin>
              ) : <Navigate to="/login" replace />}
            />
            <Route
              path="/agregar-hospital"
              element={usuarioLogueado ? (
                <SoloAdmin>
                  <AgregarHospital />
                </SoloAdmin>
              ) : <Navigate to="/login" replace />}
            />
            <Route
              path="/admin/bloquear-hospital/:id"
              element={usuarioLogueado ? (
                <SoloAdmin>
                  <BloquearHospital />
                </SoloAdmin>
              ) : <Navigate to="/login" replace />}
            />
            <Route
              path="/bloquear-hospital/:id"
              element={usuarioLogueado ? (
                <SoloAdmin>
                  <BloquearHospital />
                </SoloAdmin>
              ) : <Navigate to="/login" replace />}
            />
            <Route
              path="/admin/sacar-hospital"
              element={usuarioLogueado ? (
                <SoloAdmin>
                  <SacarHospital />
                </SoloAdmin>
              ) : <Navigate to="/login" replace />}
            />
            <Route
              path="/sacar-hospital"
              element={usuarioLogueado ? (
                <SoloAdmin>
                  <SacarHospital />
                </SoloAdmin>
              ) : <Navigate to="/login" replace />}
            />

            <Route
              path="*"
              element={<Navigate to={usuarioLogueado ? "/home" : "/login"} replace />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
