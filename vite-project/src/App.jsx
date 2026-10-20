import { useState } from 'react'
import Navbar from './Componentes/Navbar'
import Login from './Componentes/Login'
import RegisterConPanel from './Componentes/RegisterConPanel'
import Home from './Componentes/Home'
import './css/App.css'
import Valoraciones from './Componentes/Valoraciones'
import axios from 'axios'
import Planes from './Componentes/Planes'

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

  const [vista, setVista] = useState(() => {
    return localStorage.getItem('usuario') ? 'home' : 'login'
  })

  const [cerrandoSesion, setCerrandoSesion] = useState(false)

  const [errorSesion, setErrorSesion] = useState('')

  const manejarLoginExitoso = (usr) => {
    setUsuarioLogueado(usr)
    setVista('home')
  }

  const limpiarSesionLocal = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  setUsuarioLogueado(null)
  setErrorSesion('')
  setVista('login')
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
    <div className="app">
      <Navbar
        onSeleccionarVista={setVista}
        vistaActual={vista}
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
        {vista === 'home' && (
          <Home
            usuario={usuarioLogueado}
            onCerrarSesion={cerrarSesion}
            onSeleccionarVista={setVista}
          />
        )}
        {vista === 'valoraciones' && usuarioLogueado && (
        <Valoraciones 
            onSesionExpirada={limpiarSesionLocal} 
        />
        )}
        {vista === 'login' && (
          <Login
            onIrARegister={() => setVista('register')}
            onLoginExitoso={manejarLoginExitoso}
          />
        )}
        {vista === 'register' && (
          <RegisterConPanel
            onIrALogin={() => setVista('login')}
          />
        )}
        {vista === 'planes' && usuarioLogueado && (
          <Planes onSesionExpirada={limpiarSesionLocal} />
        )}
      </main>
    </div>
  )
}

export default App
