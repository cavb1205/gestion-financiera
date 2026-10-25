// utils/api.js
// Utilidad centralizada para llamadas API con autenticación automática

import { clearStoredSession, storedSessionIdentity } from './authSession.mjs';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Singleton: si ya hay un refresh en vuelo, todas las llamadas comparten la misma promesa
// para evitar que dos refreshes simultáneos invaliden el token del otro.
let refreshOperation = null;

function assertCurrentSession(identity) {
  if (storedSessionIdentity(localStorage) !== identity) {
    throw new Error('La sesión cambió. Vuelve a abrir esta pantalla.');
  }
}

async function isManualMembershipBlock(response) {
  if (response.status !== 401 && response.status !== 403) return false;
  const data = await response.clone().json().catch(() => null);
  return data?.code === 'membresia_vencida_manual';
}

/**
 * Intenta renovar el access token usando el refresh token.
 * Retorna el nuevo token o null si falla.
 * Garantiza que solo haya una petición de refresh activa a la vez.
 */
async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  const identity = storedSessionIdentity(localStorage);
  if (refreshOperation?.refreshToken === refreshToken
    && refreshOperation.identity === identity) return refreshOperation.promise;
  const operation = { refreshToken, identity, promise: null };
  refreshOperation = operation;
  operation.promise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`${API_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
        signal: controller.signal,
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (typeof data.access !== 'string' || !data.access) return null;
      // Una respuesta tardía nunca restaura una sesión cerrada o reemplazada.
      if (storedSessionIdentity(localStorage) !== identity
        || localStorage.getItem('refreshToken') !== refreshToken) return null;
      localStorage.setItem('authToken', data.access);
      if (typeof data.refresh === 'string' && data.refresh) {
        localStorage.setItem('refreshToken', data.refresh);
      }
      localStorage.setItem('tokenTimestamp', new Date().getTime().toString());
      return data.access;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
      if (refreshOperation === operation) refreshOperation = null;
    }
  })();

  return operation.promise;
}

/**
 * Limpia toda la data de autenticación y redirige a login.
 */
function forceLogout(identity) {
  if (storedSessionIdentity(localStorage) !== identity) return;
  clearStoredSession(localStorage);
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
  const identity = storedSessionIdentity(localStorage);
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  if (new URL(url).origin !== new URL(API_URL).origin) {
    throw new Error('No se pueden enviar credenciales a un servidor externo.');
  }

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
    assertCurrentSession(identity);

    // A route suspension is not an account/session failure. Keep other routes accessible.
    const membershipBlocked = await isManualMembershipBlock(response);
    assertCurrentSession(identity);
    if (membershipBlocked) {
      window.dispatchEvent(new CustomEvent('cartera:membership-blocked'));
      return response;
    }

    // Si es 401, intentar refresh y reintentar una vez
    if (response.status === 401 && token) {
      const newToken = await tryRefreshToken();
      assertCurrentSession(identity);
      if (newToken && localStorage.getItem('authToken') === newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers, signal: controller.signal });
        assertCurrentSession(identity);
      } else {
        forceLogout(identity);
        throw new Error('Sesión expirada');
      }
    }

    const blockedAfterRefresh = await isManualMembershipBlock(response);
    assertCurrentSession(identity);
    if (blockedAfterRefresh) {
      window.dispatchEvent(new CustomEvent('cartera:membership-blocked'));
      return response;
    }

    // Si el token renovado también es rechazado, no repetir el ciclo ni
    // conservar datos del usuario anterior en una sesión inválida.
    if (response.status === 401) {
      forceLogout(identity);
      throw new Error('Sesión expirada');
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
