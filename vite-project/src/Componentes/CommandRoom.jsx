import React, { useState } from 'react';
import axios from 'axios';
import SoloAdmin from './SoloAdmin';
import '../css/CommandRoom.css';

const API = 'http://localhost:3000';

export default function CommandRoom() {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [haciendoRespaldo, setHaciendoRespaldo] = useState(false);
  const token = localStorage.getItem('token');

  const appendOutput = (line) => setOutput((prev) => [...prev, line]);

  // Función para ejecutar el respaldo (CU004)
  const realizarRespaldo = async () => {
    if (haciendoRespaldo) return;
    setHaciendoRespaldo(true);
    appendOutput('> [CU004] Iniciando generación de copia de seguridad...');
    appendOutput('  -> Paso 4: Verificando espacio disponible y permisos en almacenamiento...');
    appendOutput('  -> Paso 5: Activando modo monousuario en la base de datos...');
    appendOutput('  -> Paso 6-7: Extrayendo volcado de base de datos y almacenando...');

    try {
      const res = await axios.post(
        `${API}/respaldos`,
        {
          tipo: 'completo',
          particiones: 1,
          comentario: 'Respaldo generado desde la Consola de Administración'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const r = res.data?.respaldo;
      appendOutput('  -> Paso 9: Base de datos restaurada a modo multiusuario.');
      appendOutput('  -> Paso 10: Evento registrado en la bitácora (DVH y DVV calculados).');
      appendOutput(`✓ [ÉXITO] ${res.data?.mensaje || 'Respaldo realizado correctamente.'}`);
      if (r) {
        appendOutput(`   Archivo: ${r.archivos?.[0] || r.baseNombre}`);
        appendOutput(`   Tamaño: ${r.tamanioTotalLegible || 'N/A'}`);
        appendOutput(`   Ubicación: ${r.ubicacion}`);
      }
    } catch (err) {
      const msg = err.response?.data?.mensaje || err.response?.data?.error || err.message || 'Error desconocido';
      appendOutput(`✗ [ERROR] No se pudo completar el respaldo: ${msg}`);
    } finally {
      setHaciendoRespaldo(false);
    }
  };

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
        case 'backup':
        case 'respaldo': {
          await realizarRespaldo();
          break;
        }
        case 'clear':
        case 'cls': {
          setOutput([]);
          break;
        }
        default:
          appendOutput('Comando no reconocido. Use: list, add, delete, update, respaldo, clear');
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
        <div className="command-header">
          <h2>Consola de Administración</h2>
          <button
            type="button"
            className="btn-backup"
            onClick={realizarRespaldo}
            disabled={haciendoRespaldo}
            title="Generar copia de seguridad de la base de datos (CU004)"
          >
            {haciendoRespaldo ? 'Generando respaldo...' : 'Hacer Respaldo'}
          </button>
        </div>

        <div className="output" aria-live="polite">
          {output.length === 0 ? (
            <pre style={{ color: '#627b82' }}>
              Consola lista. Podés presionar el botón "Hacer Respaldo" o escribir comandos como "respaldo", "list", "add", "update", "delete".
            </pre>
          ) : (
            output.map((line, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <pre key={i}>{line}</pre>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            placeholder="Escribí un comando (ej: respaldo, list)..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            autoFocus
            disabled={haciendoRespaldo}
          />
          <button type="submit" disabled={haciendoRespaldo}>Ejecutar</button>
        </form>
      </section>
    </SoloAdmin>
  );
}
