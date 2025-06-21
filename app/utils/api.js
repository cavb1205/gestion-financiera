// utils/api.js

import { useAuth } from "../context/AuthContext";


// Función fetch que maneja automáticamente tokens expirados
export const authFetch = async (url, options = {}) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { token, refreshToken, logout } = useAuth();
  
  // Verificar si el token está expirado
  const tokenTimestamp = localStorage.getItem('tokenTimestamp');
  const now = new Date().getTime();
  const tokenAge = now - parseInt(tokenTimestamp, 10);
  const tokenExpired = tokenAge > 60 * 60 * 1000;
  
  let currentToken = token;
  
  // Si el token está expirado, intentar renovarlo
  if (tokenExpired) {
    currentToken = await refreshToken();
    if (!currentToken) {
      logout();
      throw new Error('Token expired and refresh failed');
    }
  }
  
  // Configurar headers con el token
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${currentToken}`,
    'Content-Type': 'application/json',
  };
  
  // Realizar la solicitud
  const response = await fetch(url, { ...options, headers });
  
  // Si la respuesta es 401 (no autorizado), intentar renovar token y reintentar
  if (response.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      return fetch(url, { ...options, headers });
    } else {
      logout();
      return response;
    }
  }
  
  return response;
};