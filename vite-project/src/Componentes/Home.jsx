import React from 'react';
import '../css/Home.css';

function Home({ usuario }) {
  return (
    <div className="home-container">
      <h1 className="home-title">
        ¡Hola{usuario?.NomApeU ? `, ${usuario.NomApeU}` : ''}! Bienvenido a TurnoSalud
      </h1>
    </div>
  );
}

export default Home;

