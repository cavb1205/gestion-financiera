// Control de frecuencia del refresco de la ruta seleccionada (/tiendas/detail/admin/).
// Navegar sin modificar datos no necesita volver a pedir la ruta en cada pantalla;
// cualquier escritura exitosa (POST/PUT/PATCH/DELETE) invalida la marca.

export const EVENTO_DATOS_MODIFICADOS = 'cartera:datos-modificados';

export function esEscritura(method) {
  return Boolean(method) && !['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase());
}

export function refrescoReciente(ultimo, { id, membershipOnly = false, maxAgeMs, ahora = Date.now() }) {
  if (!maxAgeMs || !ultimo || String(ultimo.id) !== String(id)) return false;
  // Un refresco completo también trae la membresía.
  const marca = membershipOnly ? Math.max(ultimo.completo || 0, ultimo.membresia || 0) : (ultimo.completo || 0);
  return marca > 0 && ahora - marca < maxAgeMs;
}

export function registrarRefresco(ultimo, { id, membershipOnly = false, ahora = Date.now() }) {
  const base = ultimo && String(ultimo.id) === String(id) ? ultimo : { id };
  return membershipOnly ? { ...base, id, membresia: ahora } : { ...base, id, completo: ahora, membresia: ahora };
}
