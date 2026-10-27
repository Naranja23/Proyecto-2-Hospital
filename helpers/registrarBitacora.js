//cree carpeta helpers ya q registrarBitacora es algo q se usa muy seguido. 
const { Bitacora } = require('../models/Bitacora.Model')

module.exports = async function registrarBitacora(req, { proceso, explicacion }, transaction) { //función reutilizable para cualquier controlador
  //se puede pedir prceso y explicacion tanto por req como escribirlo uno mismo
  //transaction sirve como un boton de guardar datos o cancelar
  // 1. Obtenemos el nombre del usuario de forma simple
  let nombreUsuario = 'Anónimo';
  
  if (req.user) {
    if (typeof req.user.nombre === 'string') { // lo q hace es q le dice q si es string directamente lo guarde en la variable
      nombreUsuario = req.user.nombre;
    } else if (typeof req.user.usuario === 'string') {
      nombreUsuario = req.user.usuario;
    } else if (req.user.id) {
      nombreUsuario = String(req.user.id); // transforma el id a string directo 
    }
  }
  // type of: determina que tipo es depende a lo q se ingrese 
  // 2. Creamos el registro usando exactamente los nombres de columnas 
  await Bitacora.create(
    {
      Proceso: proceso,         // Ej: "Eliminar Usuario"
      Explicacion: explicacion, // Ej: "Se eliminó al usuario con ID 5"
      Usuario: nombreUsuario,   // Nombre o ID del admin
      DVH: null                 // O la lógica de DVH si tu sistema la calcula acá
    },
    { transaction }
    //Si no le pasás ese { transaction }, Sequelize hace la operación de forma independiente y 
    // directa en la base de datos,
    // ignorando el botón de "cancelar" si algo llega a fallar.
  );
};