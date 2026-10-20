import React from 'react';

function Home({ onSeleccionarVista }) {
  return (
    <div className="home-container">
      <h1>Bienvenido a TurnoSalud</h1>
      <p>Gestioná tus turnos médicos fácilmente.</p>

      <button
        type="button"
        onClick={() => onSeleccionarVista?.('valoraciones')}
      >
        Consultar valoraciones de hospitales
      </button>
    </div>
  )
}

export default Home;
