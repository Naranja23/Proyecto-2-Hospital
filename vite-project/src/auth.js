export function leerUsuario() {
  try {
    const usuario = localStorage.getItem('usuario')
    return usuario ? JSON.parse(usuario) : null
  } catch {
    return null
  }
}

export function esAdmin() {
  const usuario = leerUsuario()

  return usuario?.rol === 'Administrador' ||
    usuario?.roles?.some((rol) =>
      (typeof rol === 'string' ? rol : rol?.DescripcionR) === 'Administrador'
    )
}