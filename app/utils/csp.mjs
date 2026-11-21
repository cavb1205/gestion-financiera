// Content-Security-Policy del frontend. La aplica proxy.js a cada documento.
//
// script-src necesita 'unsafe-inline': Next.js inyecta scripts inline para la
// hidratación y las páginas se sirven estáticas (sin nonce por solicitud).
// El valor principal de esta política es connect-src/img-src: un script
// inyectado no puede enviar el token a un servidor ajeno con fetch ni con
// imágenes, y no se pueden cargar scripts de otros dominios.

const TILES_OSM = 'https://*.tile.openstreetmap.org';
const ICONOS_LEAFLET = 'https://cdnjs.cloudflare.com';

export function origenApi(url) {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
}

export function construirCsp({ apiUrl, dev = false } = {}) {
  const api = origenApi(apiUrl);
  const directivas = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', TILES_OSM, ICONOS_LEAFLET],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", ...(api ? [api] : []), ...(dev ? ['ws:'] : [])],
    'media-src': ["'self'", 'blob:'],
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };
  const texto = Object.entries(directivas).map(([k, v]) => `${k} ${v.join(' ')}`).join('; ');
  return dev ? texto : `${texto}; upgrade-insecure-requests`;
}
