// utils/api.js
// Utilidad centralizada para llamadas API con autenticación automática

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Singleton: si ya hay un refresh en vuelo, todas las llamadas comparten la misma promesa
// para evitar que dos refreshes simultáneos invaliden el token del otro.
let refreshPromise = null;

/**
 * Intenta renovar el access token usando el refresh token.
 * Retorna el nuevo token o null si falla.
 * Garantiza que solo haya una petición de refresh activa a la vez.
 */
async function tryRefreshToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${API_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      localStorage.setItem('authToken', data.access);
      localStorage.setItem('tokenTimestamp', new Date().getTime().toString());
      return data.access;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Limpia toda la data de autenticación y redirige a login.
 */
function forceLogout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('userProfile');
  localStorage.removeItem('tokenTimestamp');
  localStorage.removeItem('selectedStore');
  window.location.href = '/login';
}

/**
 * Fetch centralizado con autenticación automática.
 * - Agrega Authorization header automáticamente
 * - En caso de 401, intenta refresh y reintenta una vez
 * - Si el refresh falla, fuerza logout
 *
 * @param {string} path - Path relativo (ej: "/clientes/tienda/1/") o URL completa
 * @param {RequestInit} options - Opciones de fetch estándar
 * @returns {Promise<Response>}
 */
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('authToken');
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;

  const headers = { ...options.headers };

  // Solo agregar Content-Type JSON en requests con body — nunca en FormData
  // (el navegador debe poner el boundary multipart por su cuenta).
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Timeout de 15 segundos para evitar que la app se congele
  const timeout = options.timeout || 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    let response = await fetch(url, { ...options, headers, signal: controller.signal });

    // Si es 401, intentar refresh y reintentar una vez
    if (response.status === 401 && token) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers, signal: controller.signal });
      } else {
        forceLogout();
        throw new Error('Sesión expirada');
      }
    }

    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('El servidor no respondió. Verifica tu conexión e intenta de nuevo.');
    }
    if (!navigator.onLine || err instanceof TypeError) {
      throw new Error('Sin conexión a internet. Verifica tu red e intenta de nuevo.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extrae un mensaje de error legible de una respuesta no-ok.
 * Nunca lanza: si el cuerpo no es JSON (HTML de un 500, proxy caído),
 * devuelve el mensaje de respaldo.
 * @param {Response} response
 * @param {string} fallback - Mensaje si no se puede extraer uno del cuerpo
 * @returns {Promise<string>}
 */
export async function getApiError(response, fallback = 'Ocurrió un error inesperado') {
  try {
    const data = await response.json();
    if (typeof data === 'string' && data) return data;
    if (data?.detail) return data.detail;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    // Errores de validación de DRF: { campo: ["mensaje"] } — tomar el primero
    const first = Object.values(data || {})[0];
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
    if (typeof first === 'string') return first;
    return fallback;
  } catch {
    return fallback;
  }
}

export { tryRefreshToken };
