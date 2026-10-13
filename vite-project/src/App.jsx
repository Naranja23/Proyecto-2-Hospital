import { useState } from 'react'
import Navbar from './Componentes/Navbar'
import Login from './Componentes/Login'
import RegisterConPanel from './Componentes/RegisterConPanel'
import './css/App.css'

function App() {
  const [vista, setVista] = useState('login') // 'login' | 'register'
  const [usuarioLogueado, setUsuarioLogueado] = useState(null)

  return (
    <div className="app">
      <Navbar onSeleccionarVista={setVista} vistaActual={vista} />
      <main className="content">
        {vista === 'login' && (
          <Login
            onIrARegister={() => setVista('register')}
            onLoginExitoso={(usr) => setUsuarioLogueado(usr)}
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
