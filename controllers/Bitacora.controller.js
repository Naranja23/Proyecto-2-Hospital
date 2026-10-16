async function registrar(proceso, dni) {
  console.log(`[BITACORA] ${new Date().toISOString()} | usuario ${dni ?? '-'} | ${proceso}`)
}
module.exports = { registrar }