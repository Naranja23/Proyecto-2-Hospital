import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/users': 'http://localhost:3000',
      '/hospitales': 'http://localhost:3000',
      '/cartilla': 'http://localhost:3000',
      '/bloquear-hospital': 'http://localhost:3000',
      '/sacar-hospital': 'http://localhost:3000',
      '/seguridad': 'http://localhost:3000',
      '/turnos': 'http://localhost:3000',
      '/planes': 'http://localhost:3000',
      '/valoraciones': 'http://localhost:3000',
      '/especialidades': 'http://localhost:3000',
      '/buscador': 'http://localhost:3000',
      '/panel': 'http://localhost:3000',
    }
  }
})
