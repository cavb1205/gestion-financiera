// Orden operativo: estas funciones nunca filtran créditos ni cambian importes.
export function textoRecorrido(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function validarRecorrido(data, tiendaId) {
  if (data?.tienda !== Number(tiendaId) || typeof data.configurado !== 'boolean' ||
      !Number.isInteger(data.version) || data.version < 0 || !Array.isArray(data.clientes) ||
      data.clientes.some(c => !Number.isInteger(c?.id) || c.id <= 0) ||
      new Set(data.clientes.map(c => c.id)).size !== data.clientes.length) {
    throw new Error('El servidor devolvió un recorrido inválido. Intenta de nuevo.');
  }
  return data;
}

export function moverCliente(clientes, id, accion, destinoId) {
  const indice = clientes.findIndex(c => c.id === id);
  if (indice < 0) return clientes;
  let destino;
  if (accion === 'subir') destino = Math.max(0, indice - 1);
  else if (accion === 'bajar') destino = Math.min(clientes.length - 1, indice + 1);
  else if (accion === 'inicio') destino = 0;
  else if (accion === 'antes' || accion === 'despues') {
    if (destinoId === id) return clientes;
    const restantes = clientes.filter(c => c.id !== id);
    const referencia = restantes.findIndex(c => c.id === destinoId);
    if (referencia < 0) return clientes;
    const copia = [...restantes];
    copia.splice(referencia + (accion === 'despues' ? 1 : 0), 0, clientes[indice]);
    return copia;
  } else return clientes;
  if (destino === indice) return clientes;
  const copia = [...clientes];
  const [cliente] = copia.splice(indice, 1);
  copia.splice(destino, 0, cliente);
  return copia;
}

export function ordenarCreditosRecorrido(creditos, recorrido) {
  if (!recorrido?.configurado) return creditos;
  const posiciones = new Map(recorrido.clientes.map((c, i) => [c.id, i]));
  return [...creditos].sort((a, b) =>
    (posiciones.get(a.cliente?.id) ?? posiciones.size) -
    (posiciones.get(b.cliente?.id) ?? posiciones.size));
}

export function mismoOrden(a, b) {
  return a.length === b.length && a.every((cliente, indice) => cliente.id === b[indice].id);
}
