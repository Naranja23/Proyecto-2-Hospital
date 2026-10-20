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
import './css/App.css'
import axios from 'axios'

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
              path="/turnos"
              element={usuarioLogueado ? <Historial onSesionExpirada={limpiarSesionLocal} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/reservaciones"
              element={usuarioLogueado ? <Historial onSesionExpirada={limpiarSesionLocal} /> : <Navigate to="/login" replace />}
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