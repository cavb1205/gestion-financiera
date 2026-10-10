// Coordenadas de viewport; nunca convierte un filtro en el recorrido completo.
export function destinoArrastre(filas, area, x, y, origenId) {
  if (!filas.length || x < area.left || x > area.right || y < area.top || y > area.bottom) return null;
  if (y < filas[0].top || y > filas.at(-1).bottom) return null;
  const fila = filas.find(f => y <= f.bottom) || filas.at(-1);
  if (fila.id === origenId) return null;
  return { destinoId: fila.id, ubicacion: y < (fila.top + fila.bottom) / 2 ? 'antes' : 'despues' };
}

export function velocidadArrastre(area, x, y) {
  if (x < area.left || x > area.right || y < area.top || y > area.bottom) return 0;
  const margen = Math.min(48, (area.bottom - area.top) / 4);
  if (margen <= 0) return 0;
  if (y < area.top + margen) return -480 * (1 - (y - area.top) / margen);
  if (y > area.bottom - margen) return 480 * (1 - (area.bottom - y) / margen);
  return 0;
}
