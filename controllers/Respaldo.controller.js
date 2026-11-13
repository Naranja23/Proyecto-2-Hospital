const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { sequelize } = require('../config/db.js');
const bitacora = require('./Bitacora.controller.js');
const { calcularDV } = require('./Dvv y Dvh.js');

// Estado de modo monousuario del sistema (CU004 - Pasos 5 y 9)
let modoMonousuario = false;
let usuarioMonousuario = null;
let inicioMonousuario = null;

function activarModoMonousuario(dniUsuario) {
  modoMonousuario = true;
  usuarioMonousuario = dniUsuario || 'DBA';
  inicioMonousuario = new Date();
}

function desactivarModoMonousuario() {
  modoMonousuario = false;
  usuarioMonousuario = null;
  inicioMonousuario = null;
}

function getEstadoMonousuario() {
  return {
    activo: modoMonousuario,
    usuario: usuarioMonousuario,
    desde: inicioMonousuario
  };
}

// Directorio por defecto para guardar los respaldos
const CARPETA_DEFAULT = path.resolve(__dirname, '../backups');

function asegurarCarpeta(rutaDirectorio) {
  const dir = rutaDirectorio ? path.resolve(rutaDirectorio) : CARPETA_DEFAULT;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

const ARCHIVO_HISTORIAL = (dir) => path.join(dir, 'historial_respaldos.json');

function leerHistorial(dir) {
  try {
    const archivo = ARCHIVO_HISTORIAL(dir);
    if (!fs.existsSync(archivo)) return [];
    const raw = fs.readFileSync(archivo, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function guardarHistorial(dir, items) {
  try {
    const archivo = ARCHIVO_HISTORIAL(dir);
    fs.writeFileSync(archivo, JSON.stringify(items, null, 2), 'utf8');
  } catch (err) {
    console.warn('[RESPALDO] No se pudo guardar historial:', err.message);
  }
}

function formatearBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Paso 4 / Flujo F4: Verificación de espacio y permisos
async function verificarEspacioYPermisos(req, res) {
  try {
    const rutaSolicitada = req.query?.destino || req.body?.destino || CARPETA_DEFAULT;
    const dir = asegurarCarpeta(rutaSolicitada);

    // 1. Verificar permisos de escritura
    try {
      fs.accessSync(dir, fs.constants.W_OK);
    } catch {
      return res.status(403).json({
        ok: false,
        error: 'F4: Permisos insuficientes',
        mensaje: `No se poseen permisos de escritura en la ubicación: ${dir}`
      });
    }

    // 2. Verificar espacio disponible en disco
    let espacioBytes = null;
    try {
      if (typeof fs.statfsSync === 'function') {
        const stats = fs.statfsSync(dir);
        espacioBytes = Number(stats.bavail) * Number(stats.bsize);
      }
    } catch (_) {}

    // Si tenemos el cálculo de espacio, requerimos al menos 50 MB
    const UMBRAL_MINIMO_BYTES = 50 * 1024 * 1024; // 50 MB
    if (espacioBytes !== null && espacioBytes < UMBRAL_MINIMO_BYTES) {
      return res.status(400).json({
        ok: false,
        error: 'F4: Espacio insuficiente',
        mensaje: `Espacio de almacenamiento insuficiente. Disponible: ${formatearBytes(espacioBytes)}, requerido mínimo: 50 MB.`
      });
    }

    return res.status(200).json({
      ok: true,
      ubicacion: dir,
      permisosEscritura: true,
      espacioDisponibleBytes: espacioBytes,
      espacioDisponibleLegible: espacioBytes ? formatearBytes(espacioBytes) : 'Espacio suficiente verificado',
      modoMonousuario: getEstadoMonousuario()
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'Error de verificación',
      mensaje: err.message
    });
  }
}

// Fallback nativo: genera SQL a partir de Sequelize en caso de no poder ejecutar pg_dump
async function volcadoNativoSequelize(tipo) {
  let sql = `-- =====================================================================\n`;
  sql += `-- RESPALDO NATIVO DE BASE DE DATOS (SEQUELIZE)\n`;
  sql += `-- Fecha: ${new Date().toISOString()}\n`;
  sql += `-- Tipo: ${tipo.toUpperCase()}\n`;
  sql += `-- =====================================================================\n\n`;

  const dialect = sequelize.getDialect();
  sql += `SET statement_timeout = 0;\n`;
  sql += `SET client_encoding = 'UTF8';\n\n`;

  // Modelos ordenados
  const modelos = Object.values(sequelize.models);

  for (const M of modelos) {
    const tableName = M.tableName || M.name;
    const rawAttrs = M.rawAttributes;

    if (tipo === 'completo' || tipo === 'estructura') {
      sql += `-- ---------------------------------------------------------------------\n`;
      sql += `-- Tabla: "${tableName}" (Estructura)\n`;
      sql += `-- ---------------------------------------------------------------------\n`;
      sql += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;

      const defCols = [];
      for (const [colName, attr] of Object.entries(rawAttrs)) {
        let typeStr = 'TEXT';
        if (attr.type && attr.type.toSql) {
          typeStr = attr.type.toSql();
        } else if (attr.type && attr.type.key) {
          typeStr = attr.type.key;
        }

        let colDef = `  "${colName}" ${typeStr}`;
        if (attr.primaryKey) colDef += ' PRIMARY KEY';
        if (attr.allowNull === false && !attr.primaryKey) colDef += ' NOT NULL';
        if (attr.defaultValue !== undefined && typeof attr.defaultValue !== 'function') {
          colDef += ` DEFAULT ${JSON.stringify(attr.defaultValue)}`;
        }
        defCols.push(colDef);
      }
      sql += defCols.join(',\n') + '\n);\n\n';
    }

    if (tipo === 'completo' || tipo === 'datos') {
      const filas = await M.findAll({ raw: true });
      if (filas.length > 0) {
        sql += `-- Datos de la tabla "${tableName}" (${filas.length} registros)\n`;
        const cols = Object.keys(rawAttrs);

        for (const fila of filas) {
          const vals = cols.map((c) => {
            const v = fila[c];
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'number') return v;
            if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
            if (v instanceof Date) return `'${v.toISOString()}'`;
            return `'${String(v).replace(/'/g, "''")}'`;
          });

          sql += `INSERT INTO "${tableName}" ("${cols.join('", "')}") VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
        }
        sql += `\n`;
      }
    }
  }

  return sql;
}

// Ejecuta pg_dump si está disponible, o recurre al volcado nativo
function ejecutarPgDump(dbConfig, tipo) {
  return new Promise((resolve, reject) => {
    let flagTipo = '';
    if (tipo === 'estructura') flagTipo = '--schema-only';
    if (tipo === 'datos') flagTipo = '--data-only';

    const cmd = `pg_dump -h "${dbConfig.host}" -p ${dbConfig.port} -U "${dbConfig.username}" ${flagTipo} --no-owner --no-privileges "${dbConfig.database}"`;

    const env = {
      ...process.env,
      PGPASSWORD: dbConfig.password ? String(dbConfig.password) : ''
    };

    exec(cmd, { env, maxBuffer: 100 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        // Si falla pg_dump (ej. falta auth o pg_dump no conecta), reject para ir al fallback
        return reject(new Error(stderr || error.message));
      }
      resolve(stdout);
    });
  });
}

// Escenario Principal CU004 - Hacer respaldo
async function hacerRespaldo(req, res) {
  const dniUsuario = req.usuario?.DNIUsuario || req.user?.DNIUsuario || 'DBA';
  const tipo = (req.body?.tipo || 'completo').toLowerCase(); // completo | datos | estructura
  const particiones = Math.max(1, Math.min(4, Number(req.body?.particiones) || 1));
  const rutaDestino = req.body?.destino || CARPETA_DEFAULT;
  const comentario = req.body?.comentario || 'Respaldo manual del sistema';

  let dirDestino;

  try {
    // 1. Validar conexión previa a la BD (Flujo F7: pérdida de conexión)
    try {
      await sequelize.authenticate();
    } catch (errDb) {
      return res.status(503).json({
        ok: false,
        error: 'F7: Pérdida de conexión',
        mensaje: 'Se perdió la conexión con la base de datos durante el respaldo.',
        detalle: errDb.message
      });
    }

    // 2. Verificar espacio disponible y permisos necesarios (Paso 4 / Flujo F4)
    dirDestino = asegurarCarpeta(rutaDestino);
    try {
      fs.accessSync(dirDestino, fs.constants.W_OK);
    } catch {
      return res.status(403).json({
        ok: false,
        error: 'F4: Permisos insuficientes',
        mensaje: `No existe permiso de escritura en la carpeta de destino: ${dirDestino}`
      });
    }

    if (typeof fs.statfsSync === 'function') {
      try {
        const stats = fs.statfsSync(dirDestino);
        const espacioBytes = Number(stats.bavail) * Number(stats.bsize);
        if (espacioBytes < 20 * 1024 * 1024) { // 20 MB mínimo
          return res.status(400).json({
            ok: false,
            error: 'F4: Espacio insuficiente',
            mensaje: `Espacio de almacenamiento insuficiente para generar la copia de seguridad (${formatearBytes(espacioBytes)} disponible).`
          });
        }
      } catch (_) {}
    }

    // 3. Paso 5: La base de datos se vuelve monousuario
    activarModoMonousuario(dniUsuario);
    console.log(`[RESPALDO] Base de datos en MODO MONOUSUARIO por usuario ${dniUsuario}`);

    // 4. Paso 6: El sistema inicia el proceso de copia de seguridad
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseNombre = `backup_messi_${tipo}_${timestamp}`;

    let sqlCompleto = '';
    const configDb = {
      database: sequelize.config.database || 'messi',
      username: sequelize.config.username || 'naranja',
      password: sequelize.config.password || '1234',
      host: sequelize.config.host || '127.0.0.1',
      port: sequelize.config.port || 5432
    };

    try {
      sqlCompleto = await ejecutarPgDump(configDb, tipo);
    } catch (errPg) {
      console.warn('[RESPALDO] pg_dump no disponible o falló, recurriendo a volcado nativo Sequelize:', errPg.message);
      sqlCompleto = await volcadoNativoSequelize(tipo);
    }

    if (!sqlCompleto || sqlCompleto.trim().length === 0) {
      throw new Error('El volcado de datos generado está vacío.');
    }

    // 5. Paso 7: Almacenar archivo(s) de respaldo según particiones
    const archivosGenerados = [];
    let tamanioTotal = 0;

    if (particiones === 1) {
      const nombreArchivo = `${baseNombre}.sql`;
      const rutaArchivo = path.join(dirDestino, nombreArchivo);
      fs.writeFileSync(rutaArchivo, sqlCompleto, 'utf8');
      const stats = fs.statSync(rutaArchivo);
      tamanioTotal = stats.size;
      archivosGenerados.push({
        nombre: nombreArchivo,
        ruta: rutaArchivo,
        particion: 1,
        totalParticiones: 1,
        tamanioBytes: stats.size,
        tamanioLegible: formatearBytes(stats.size)
      });
    } else {
      // Particionamiento: dividir el volcado en N archivos
      const lineas = sqlCompleto.split('\n');
      const lineasPorParte = Math.ceil(lineas.length / particiones);

      for (let i = 0; i < particiones; i++) {
        const parteLineas = lineas.slice(i * lineasPorParte, (i + 1) * lineasPorParte);
        const nombreParte = `${baseNombre}.part${i + 1}de${particiones}.sql`;
        const rutaParte = path.join(dirDestino, nombreParte);

        const encabezadoParte = `-- ========================================================\n` +
          `-- RESPALDO PARTICIONADO: PARTE ${i + 1} DE ${particiones}\n` +
          `-- Archivo base: ${baseNombre}\n` +
          `-- ========================================================\n\n`;

        fs.writeFileSync(rutaParte, encabezadoParte + parteLineas.join('\n'), 'utf8');
        const stats = fs.statSync(rutaParte);
        tamanioTotal += stats.size;
        archivosGenerados.push({
          nombre: nombreParte,
          ruta: rutaParte,
          particion: i + 1,
          totalParticiones: particiones,
          tamanioBytes: stats.size,
          tamanioLegible: formatearBytes(stats.size)
        });
      }
    }

    // 6. Registrar en el historial de respaldos (Postcondición)
    const nuevoRegistro = {
      id: `${Date.now()}`,
      baseNombre,
      tipo,
      particiones,
      archivos: archivosGenerados.map(a => a.nombre),
      tamanioTotalBytes: tamanioTotal,
      tamanioTotalLegible: formatearBytes(tamanioTotal),
      fecha: new Date().toISOString(),
      usuarioResponsable: String(dniUsuario),
      ubicacion: dirDestino,
      comentario,
      metodo: 'CU004 - Hacer respaldo'
    };

    const historial = leerHistorial(dirDestino);
    historial.unshift(nuevoRegistro);
    guardarHistorial(dirDestino, historial);

    // 7. Paso 10: Registrar acción en bitácora con cálculo de DVH y DVV
    const detalleBitacora = `Se generó copia de seguridad (${tipo}) con ${particiones} partición(es). Archivo: ${archivosGenerados[0].nombre}. Tamaño: ${formatearBytes(tamanioTotal)}`;
    await bitacora.registrar(`CU004 - Hacer respaldo: ${detalleBitacora}`, dniUsuario);
    await calcularDV('Bitacora');

    // 8. Paso 8: Responder con mensaje de éxito
    return res.status(201).json({
      ok: true,
      mensaje: 'El respaldo fue realizado correctamente.',
      respaldo: nuevoRegistro
    });
  } catch (errorGeneral) {
    console.error('[RESPALDO ERROR F7]:', errorGeneral);
    return res.status(500).json({
      ok: false,
      error: 'F7: Falla en la generación del respaldo',
      mensaje: 'Ocurrió una falla durante la generación del respaldo. La operación no pudo completarse.',
      detalle: errorGeneral.message
    });
  } finally {
    // Paso 9: La base de datos se vuelve multiusuario siempre
    desactivarModoMonousuario();
    console.log('[RESPALDO] Base de datos RESTAURADA a MODO MULTIUSUARIO.');
  }
}

// Listar historial de respaldos disponibles
async function listarRespaldos(req, res) {
  try {
    const rutaDestino = req.query?.destino || CARPETA_DEFAULT;
    const dir = asegurarCarpeta(rutaDestino);
    const historial = leerHistorial(dir);

    // Verificar si los archivos físicos aún existen
    const historialActualizado = historial.map(item => {
      const todosExisten = (item.archivos || []).every(nombre =>
        fs.existsSync(path.join(dir, nombre))
      );
      return { ...item, archivoDisponible: todosExisten };
    });

    return res.status(200).json({
      ok: true,
      respaldos: historialActualizado,
      ubicacion: dir,
      modoMonousuario: getEstadoMonousuario()
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al listar respaldos: ' + err.message
    });
  }
}

// Descargar un archivo de respaldo específico
async function descargarRespaldo(req, res) {
  try {
    const nombreArchivo = path.basename(req.params.nombre);
    const rutaDestino = req.query?.destino || CARPETA_DEFAULT;
    const rutaCompleta = path.join(asegurarCarpeta(rutaDestino), nombreArchivo);

    if (!fs.existsSync(rutaCompleta)) {
      return res.status(404).json({
        ok: false,
        mensaje: 'El archivo de respaldo no fue encontrado en el servidor.'
      });
    }

    return res.download(rutaCompleta, nombreArchivo);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al descargar el archivo: ' + err.message
    });
  }
}

// Eliminar un respaldo del almacenamiento
async function eliminarRespaldo(req, res) {
  try {
    const nombreArchivo = path.basename(req.params.nombre);
    const rutaDestino = req.query?.destino || CARPETA_DEFAULT;
    const dir = asegurarCarpeta(rutaDestino);
    const dniUsuario = req.usuario?.DNIUsuario || req.user?.DNIUsuario || 'DBA';

    let historial = leerHistorial(dir);
    const item = historial.find(h =>
      h.archivos && h.archivos.includes(nombreArchivo) || h.baseNombre === nombreArchivo || h.id === nombreArchivo
    );

    const archivosAEliminar = item ? item.archivos : [nombreArchivo];
    for (const nom of archivosAEliminar) {
      const p = path.join(dir, nom);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    historial = historial.filter(h => h !== item && h.id !== nombreArchivo);
    guardarHistorial(dir, historial);

    await bitacora.registrar(`CU004 - Eliminar respaldo: Archivo ${nombreArchivo} eliminado`, dniUsuario);
    await calcularDV('Bitacora');

    return res.status(200).json({
      ok: true,
      mensaje: 'Copia de seguridad eliminada correctamente.'
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar respaldo: ' + err.message
    });
  }
}

// Middleware para verificar modo monousuario en otras rutas
function middlewareModoMonousuario(req, res, next) {
  if (!modoMonousuario) return next();

  // El usuario que inició el respaldo o peticiones de respaldo pueden continuar
  const ruta = req.originalUrl || req.url || '';
  if (ruta.includes('/respaldos')) return next();

  return res.status(503).json({
    ok: false,
    monousuario: true,
    mensaje: 'El sistema se encuentra en modo monousuario temporal debido a la generación de una copia de seguridad. Por favor, reintente en unos instantes.'
  });
}

module.exports = {
  hacerRespaldo,
  verificarEspacioYPermisos,
  listarRespaldos,
  descargarRespaldo,
  eliminarRespaldo,
  middlewareModoMonousuario,
  getEstadoMonousuario
};

