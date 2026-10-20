// PANTALLA CU005: formulario React para cargar un hospital nuevo.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import '../css/Hospitales.css';

const FORM_VACIO = { nombre: '', direccion: '', ciudad: '', telefono: '' };

// F1 (CU005): validación en pantalla; el back vuelve a validar lo mismo
function validar(f) {
  const e = {};
  if (f.nombre.trim().length < 3) e.nombre = 'Ingresá el nombre del hospital (mínimo 3 caracteres).';
  if (!f.direccion.trim()) e.direccion = 'Ingresá la dirección.';
  if (!f.ciudad.trim()) e.ciudad = 'Ingresá la ciudad.';
  if (f.telefono.trim() && !/^[0-9+()\-\s]{6,20}$/.test(f.telefono.trim()))
    e.telefono = 'El teléfono solo puede tener números, espacios, +, - y paréntesis.';
  return e;
}

function Campo({ id, etiqueta, valor, onChange, error, ...resto }) {
  return (
    <div className="hosp-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        value={valor}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...resto}
      />
      {error && (
        <p id={`${id}-error`} className="hosp-campo__error">
          {error}
        </p>
      )}
    </div>
  );
}

export default function AgregarHospital() {
  const [form, setForm] = useState(FORM_VACIO);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'error', texto, extension }
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setAviso(null);

    const errs = validar(form);
    setErrores(errs);
    if (Object.keys(errs).length) {
      setAviso({ tipo: 'error', texto: 'Hay datos incorrectos o incompletos. Corregilos y volvé a intentar.' });
      return;
    }

    setEnviando(true);
    try {
      const { data } = await api.post('/hospitales', form);
      setForm(FORM_VACIO);
      setErrores({});
      setAviso({ tipo: 'ok', texto: data.mensaje, extension: data.extension });
    } catch (err) {
      // F1 desde el back, F2 (duplicado) y F3 (error al guardar) llegan acá con su mensaje
      if (err.errores) setErrores(err.errores);
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="hosp-page">
      <header className="hosp-encabezado">
        <div>
          <h1>Añadir hospital</h1>
          <p className="hosp-subtitulo">El hospital se incorpora a la cartilla médica apenas se guarda.</p>
        </div>
      </header>

      {aviso && (
        <div className={`hosp-aviso hosp-aviso--${aviso.tipo}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}>
          <span>{aviso.texto}</span>
          <span className="hosp-aviso__acciones">
            {/* Paso 7 (CU024): cuando exista su pantalla propia, cambiá el destino de este Link */}
            {aviso.tipo === 'ok' && aviso.extension === 'CU024' && (
              <Link to="/admin/cartilla" className="hosp-btn hosp-btn--link">
                Asignar a obras sociales
              </Link>
            )}
            <button type="button" className="hosp-btn hosp-btn--link" onClick={() => setAviso(null)}>
              Cerrar
            </button>
          </span>
        </div>
      )}

      <form className="hosp-form" onSubmit={enviar} noValidate>
        <Campo id="hosp-nombre" etiqueta="Nombre" valor={form.nombre} onChange={cambiar('nombre')} error={errores.nombre} />
        <Campo id="hosp-direccion" etiqueta="Dirección" valor={form.direccion} onChange={cambiar('direccion')} error={errores.direccion} />
        <Campo id="hosp-ciudad" etiqueta="Ciudad" valor={form.ciudad} onChange={cambiar('ciudad')} error={errores.ciudad} />
        <Campo id="hosp-telefono" etiqueta="Teléfono (opcional)" valor={form.telefono} onChange={cambiar('telefono')} error={errores.telefono} type="tel" />
        <div className="hosp-form__pie">
          <button type="submit" className="hosp-btn hosp-btn--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar hospital'}
          </button>
        </div>
      </form>
    </section>
  );
}
