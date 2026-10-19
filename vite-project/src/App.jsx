import { useState } from 'react'
import Navbar from './Componentes/Navbar'
import Login from './Componentes/Login'
import RegisterConPanel from './Componentes/RegisterConPanel'
import Home from './Componentes/Home'
import './css/App.css'

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

  const manejarLoginExitoso = (usr) => {
    setUsuarioLogueado(usr)
    setVista('home')
  }

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuarioLogueado(null)
    setVista('login')
  }

  return (
    <div className="app">
      <Navbar
        onSeleccionarVista={setVista}
        vistaActual={vista}
        usuarioLogueado={usuarioLogueado}
        onCerrarSesion={cerrarSesion}
      />
      <main className="content">
        {vista === 'home' && (
          <Home
            usuario={usuarioLogueado}
            onCerrarSesion={cerrarSesion}
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
      </main>
    </div>
  )
}

export default App
