function numero(value) {
  if (value === null || value === undefined || typeof value === 'boolean' ||
      (typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') return NaN;
  return Number(value);
}

export function tieneCoordenadas(punto) {
  const lat = numero(punto?.latitud), lng = numero(punto?.longitud);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export function nombreAutor(punto) {
  return punto.autor_nombre || punto.trabajador_nombre || 'Autor histórico';
}

export function claveAutor(punto) {
  if (punto.registrado_por != null) return `u:${punto.registrado_por}`;
  if (punto.trabajador != null) return `p:${punto.trabajador}`;
  return `sin-autor:${punto.id}`;
}

export function colorAutor(punto) {
  const key = claveAutor(punto);
  const hash = [...key].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 0);
  return ['#4f46e5', '#059669', '#d97706', '#e11d48', '#0284c7'][hash % 5];
}

export function secuenciasPublicidad(puntos) {
  const grupos = new Map();
  for (const punto of puntos.filter(tieneCoordenadas)) {
    // Nunca unir responsables ni jornadas diferentes.
    const key = `${claveAutor(punto)}:${punto.fecha}`;
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key).push(punto);
  }
  return [...grupos.values()].map(grupo => grupo.sort((a, b) =>
    (Date.parse(a.hora) || a.id) - (Date.parse(b.hora) || b.id)));
}

export function esPropio(punto, userId, perfilId) {
  return punto.registrado_por != null ? String(punto.registrado_por) === String(userId)
    : perfilId != null && punto.trabajador != null && String(punto.trabajador) === String(perfilId);
}

export function validarRangoPublicidad(desde, hasta, hoy) {
  const valida = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!valida(desde) || !valida(hasta)) return 'Selecciona fechas válidas.';
  if (desde > hasta) return 'La fecha inicial debe ser anterior o igual a la final.';
  if (hasta > hoy) return 'La publicidad realizada no se consulta en fechas futuras.';
  if ((Date.parse(hasta) - Date.parse(desde)) / 86400000 > 92) return 'Selecciona como máximo 93 días.';
  return '';
}

export function posicionPublicidad(pos, ahora = Date.now()) {
  const coords = pos?.coords;
  if (!tieneCoordenadas({ latitud: coords?.latitude, longitud: coords?.longitude }) ||
      !Number.isFinite(coords?.accuracy) || coords.accuracy < 0) {
    throw new Error('El dispositivo no devolvió una ubicación GPS válida. Intenta de nuevo.');
  }
  if (!Number.isFinite(pos.timestamp) || ahora - pos.timestamp > 30000 || pos.timestamp > ahora + 5000) {
    throw new Error('La ubicación es antigua. Vuelve a capturar el GPS.');
  }
  return { latitud: Number(coords.latitude.toFixed(7)), longitud: Number(coords.longitude.toFixed(7)), precision_gps: coords.accuracy };
}

export function capturarUbicacionPublicidad() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Este dispositivo no ofrece ubicación. Puedes consultar el mapa sin GPS.')); return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => { try { resolve(posicionPublicidad(pos)); } catch (error) { reject(error); } },
      error => reject(new Error(error.code === 1
        ? 'Permite la ubicación en tu navegador para registrar una entrega.'
        : 'No se pudo obtener una ubicación reciente. Revisa el GPS e intenta de nuevo.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}
