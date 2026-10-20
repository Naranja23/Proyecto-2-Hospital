import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home({ usuario }) {
  const navigate = useNavigate();

  return (
    <div className="home-container" style={{
      maxWidth: '900px',
      margin: '60px auto',
      padding: '40px 24px',
      textAlign: 'center',
      fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    }}>
      <h1 style={{ fontSize: '2.5rem', color: '#0f172a', marginBottom: '12px' }}>
        ¡Hola{usuario?.NomApeU ? `, ${usuario.NomApeU}` : ''}! Bienvenido a TurnoSalud
      </h1>
      <p style={{ fontSize: '1.15rem', color: '#64748b', marginBottom: '36px' }}>
        Tu portal para gestionar turnos médicos, calificar la atención y consultar tus coberturas.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <button
          type="button"
          style={{
            padding: '14px 28px',
            backgroundColor: '#0b6e77',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(11, 110, 119, 0.2)'
          }}
          onClick={() => navigate('/turnos')}
        >
          📋 Mis turnos y reservas
        </button>

        <button
          type="button"
          style={{
            padding: '14px 28px',
            backgroundColor: '#ffffff',
            color: '#0b6e77',
            border: '2px solid #0b6e77',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/valoraciones')}
        >
          ⭐ Consultar valoraciones de hospitales
        </button>

        <button
          type="button"
          style={{
            padding: '14px 28px',
            backgroundColor: '#f1f5f9',
            color: '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/planes')}
        >
          🏥 Gestionar planes
        </button>
      </div>
    </div>
  )
}

export default Home;
