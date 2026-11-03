import React, { useState } from 'react';
import axios from 'axios';
import SoloAdmin from './SoloAdmin';
import '../css/CommandRoom.css';

const API = 'http://localhost:3000';

export default function CommandRoom() {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const token = localStorage.getItem('token');

  const appendOutput = (line) => setOutput((prev) => [...prev, line]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const args = command.trim().split(/\s+/);
    const cmd = args[0]?.toLowerCase();
    if (!cmd) return;
    appendOutput(`> ${command}`);
    try {
      switch (cmd) {
        case 'list': {
          const res = await axios.get(`${API}/users`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { incluirInactivos: true },
          });
          res.data.forEach((u) =>
            appendOutput(`${u.DNIUsuario}\t${u.NomApeU}\t${u.Email}\t${u.EstadoU}`)
          );
          break;
        }
        case 'add': {
          // add <dni> <nombre> <email> <password> [edad]
          const [dni, nombre, email, password, edad] = args.slice(1);
          if (!dni || !nombre || !email || !password) {
            throw new Error('Uso: add <dni> <nombre> <email> <password> [edad]');
          }
          await axios.post(
            `${API}/users`,
            {
              dni: Number(dni),
              NomApeU: nombre,
              email,
              password,
              edad: edad ? Number(edad) : null,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          appendOutput('Usuario creado');
          break;
        }
        case 'delete': {
          const dni = args[1];
          if (!dni) throw new Error('Uso: delete <dni>');
          await axios.delete(`${API}/users/${dni}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          appendOutput('Usuario eliminado (borrado lógico)');
          break;
        }
        case 'update': {
          // update <dni> field=value [field=value ...]
          const dni = args[1];
          const kvPairs = args.slice(2);
          if (!dni || kvPairs.length === 0) {
            throw new Error('Uso: update <dni> field=value ...');
          }
          const payload = {};
          kvPairs.forEach((p) => {
            const [k, v] = p.split('=');
            if (k && v !== undefined) payload[k] = v;
          });
          await axios.put(`${API}/users/${dni}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          appendOutput('Usuario actualizado');
          break;
        }
        default:
          appendOutput('Comando no reconocido. Use: list, add, delete, update');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error';
      appendOutput(`Error: ${msg}`);
    }
    setCommand('');
  };

  return (
    <SoloAdmin>
      <section className="command-room">
        <h2>Consola de Administración</h2>
        <div className="output" aria-live="polite">
          {output.map((line, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <pre key={i}>{line}</pre>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            placeholder="Escribí un comando..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            autoFocus
          />
          <button type="submit">Ejecutar</button>
        </form>
      </section>
    </SoloAdmin>
  );
}
