import { apiFetch } from "./api";

const CLIENTES_CACHE_TTL = 30_000;
const clientesCache = new Map();

/**
 * Comparte la carga de clientes entre pantallas que necesitan el mismo listado.
 * La caché es por tienda y conserva una solicitud en curso para evitar llamadas
 * duplicadas cuando dos componentes se montan al mismo tiempo.
 */
export function getClientesTienda(tiendaId, { force = false } = {}) {
  if (tiendaId === undefined || tiendaId === null || tiendaId === "") {
    return Promise.reject(new Error("No se recibió la tienda para cargar clientes"));
  }

  const key = String(tiendaId);
  const current = clientesCache.get(key);

  if (current?.promise) {
    return current.promise;
  }

  if (!force && current?.data && Date.now() - current.cachedAt < CLIENTES_CACHE_TTL) {
    return Promise.resolve(current.data);
  }

  const request = apiFetch(`/clientes/tienda/${key}/`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al obtener los clientes");
      }
      return response.json();
    })
    .then((data) => (Array.isArray(data) ? data : []));

  clientesCache.set(key, {
    data: current?.data || null,
    cachedAt: current?.cachedAt || 0,
    promise: request,
  });

  request.then(
    (data) => {
      const entry = clientesCache.get(key);
      if (entry?.promise === request) {
        clientesCache.set(key, { data, cachedAt: Date.now(), promise: null });
      }
    },
    () => {
      const entry = clientesCache.get(key);
      if (entry?.promise === request) {
        clientesCache.delete(key);
      }
    }
  );

  return request;
}

export function invalidateClientesTienda(tiendaId) {
  if (tiendaId === undefined || tiendaId === null || tiendaId === "") return;
  clientesCache.delete(String(tiendaId));
}
