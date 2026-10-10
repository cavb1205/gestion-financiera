// context/AuthContext.js
'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, tryRefreshToken } from '../utils/api';

const AuthContext = createContext({
  user: null,
  profile: null,
  token: null,
  selectedStore: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshAuthToken: () => {},
  selectStore: () => {},
  clearStore: () => {},
  updateStoreData: () => {},
  refreshSelectedStore: async () => {},
  isAuthenticated: false,
});

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const tokenTimeoutRef = useRef(null);
  const storeRefreshRef = useRef(null);

  // Función para limpiar la autenticación
  const clearAuth = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('tokenTimestamp');
    localStorage.removeItem('selectedStore');
    localStorage.removeItem('noPago');
    localStorage.removeItem('cliente');
    localStorage.removeItem('liquidarFecha');
    localStorage.removeItem('abono');
    localStorage.removeItem('aporteEditar');
    localStorage.removeItem('utilidadEditar');

    setToken(null);
    setUser(null);
    setProfile(null);
    setSelectedStore(null);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    router.push('/login');
  }, [clearAuth, router]);

  // Función para verificar y cargar la autenticación
  const loadAuthData = useCallback(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('userData');
      const storedProfile = localStorage.getItem('userProfile');
      const storedStore = localStorage.getItem('selectedStore');
      const tokenTimestamp = localStorage.getItem('tokenTimestamp');
      
      if (!storedToken || !storedUser || !storedProfile || !tokenTimestamp) {
        setLoading(false);
        return false;
      }

      const now = new Date().getTime();
      const tokenAge = now - parseInt(tokenTimestamp, 10);
      const tokenExpired = tokenAge > 60 * 60 * 1000; // 60 minutos
      
      if (tokenExpired) {
        clearAuth();
        setLoading(false);
        // Solo redirigir si no estamos ya en login
        if (window.location.pathname !== '/login') {
             router.push('/login');
        }
        return false;
      }

      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setProfile(JSON.parse(storedProfile));
      
      if (storedStore) {
        setSelectedStore(JSON.parse(storedStore));
      }
      
      // Programar expiración basada en el tiempo restante real
      const timeLeft = Math.max(0, 60 * 60 * 1000 - tokenAge);

      clearTimeout(tokenTimeoutRef.current);
      tokenTimeoutRef.current = setTimeout(logout, timeLeft);
    } catch (error) {
      console.error('Error parsing auth data:', error);
      clearAuth();
      setLoading(false);
      return false;
    }
  }, [clearAuth, logout, router]);

  useEffect(() => {
    // Solo se ejecuta en el cliente
    if (typeof window === 'undefined') {
      return;
    }

    // Intentar cargar los datos de autenticación
    loadAuthData();
    setLoading(false);
    
    // Intervalo para verificar expiración periódicamente (por si el timeout falla o el usuario hiberna la PC)
    const intervalId = setInterval(async () => {
        const tokenTimestamp = localStorage.getItem('tokenTimestamp');
        if (tokenTimestamp) {
            const now = new Date().getTime();
            const tokenAge = now - parseInt(tokenTimestamp, 10);
            // Intentar refresh proactivo a los 55 minutos
            if (tokenAge > 55 * 60 * 1000 && tokenAge <= 60 * 60 * 1000) {
                const newToken = await tryRefreshToken();
                if (newToken) {
                    setToken(newToken);
                    clearTimeout(tokenTimeoutRef.current);
                    tokenTimeoutRef.current = setTimeout(logout, 60 * 60 * 1000);
                }
            } else if (tokenAge > 60 * 60 * 1000) {
                logout();
            }
        }
    }, 60000); // Verificar cada minuto

    return () => {
      clearInterval(intervalId);
      clearTimeout(tokenTimeoutRef.current);
    };

  }, [loadAuthData, logout]);

  const login = useCallback((data) => {
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('refreshToken', data.refresh);
    localStorage.setItem('userData', JSON.stringify(data.user));
    localStorage.setItem('userProfile', JSON.stringify(data.perfil));
    localStorage.setItem('tokenTimestamp', new Date().getTime().toString());
    
    setToken(data.token);
    setUser(data.user);
    setProfile(data.perfil);
    setLoading(false);
    
    // Programar expiración exactamente a los 60 minutos
    clearTimeout(tokenTimeoutRef.current);
    tokenTimeoutRef.current = setTimeout(logout, 60 * 60 * 1000);
  }, [logout]);

  const selectStore = useCallback((store) => {
    const previousRaw = localStorage.getItem('selectedStore');
    let previousId = null;
    try {
      previousId = previousRaw ? JSON.parse(previousRaw)?.tienda?.id : null;
    } catch {}
    const nextId = store?.tienda?.id;
    if (previousId && nextId && String(previousId) !== String(nextId)) {
      [
        'noPago',
        'liquidarFecha',
        'cliente',
        'abono',
        'aporteEditar',
        'utilidadEditar',
        'gastoEditar',
        'ventaEditar',
        'recaudoEditar',
        'recaudo',
      ].forEach((key) => localStorage.removeItem(key));
    }
    localStorage.setItem('selectedStore', JSON.stringify(store));
    setSelectedStore(store);
  }, []);

  const clearStore = useCallback(() => {
    localStorage.removeItem('selectedStore');
    setSelectedStore(null);
  }, []);

  // Renovar token usando refresh token
  const refreshAuthToken = useCallback(async () => {
    const newToken = await tryRefreshToken();
    if (newToken) {
      setToken(newToken);
      // Reprogramar expiración a 60 min desde ahora
      clearTimeout(tokenTimeoutRef.current);
      tokenTimeoutRef.current = setTimeout(logout, 60 * 60 * 1000);
      return true;
    }
    logout();
    return false;
  }, [logout]);

  const updateStoreData = useCallback((newData) => {
    setSelectedStore(prev => {
        if (!prev) return null;
        if (Number.isInteger(newData.version) && Number.isInteger(prev.version) && newData.version < prev.version) return prev;
        // Fusionar datos nuevos (ej: fecha_vencimiento actualizada) preservando la estructura
        const updated = { ...prev, ...newData };
        localStorage.setItem('selectedStore', JSON.stringify(updated));
        return updated;
    });
  }, []);

  const refreshSelectedStore = useCallback(async ({ membershipOnly = false } = {}) => {
    const storedToken = localStorage.getItem('authToken');
    const storedStore = localStorage.getItem('selectedStore');
    if (!storedToken || !storedStore) return null;
    let tiendaId;
    try {
      tiendaId = JSON.parse(storedStore)?.tienda?.id;
    } catch { return null; }
    if (!tiendaId) return null;
    if (storeRefreshRef.current?.id === tiendaId) return storeRefreshRef.current.promise;

    const requestUser = localStorage.getItem('userData');
    const operation = { id: tiendaId, promise: null };
    operation.promise = (async () => {
      try {
        const res = await apiFetch(`/tiendas/detail/admin/${tiendaId}/${membershipOnly ? '?vista=membresia' : ''}`, { cache: 'no-store' });
        const nowStored = localStorage.getItem('selectedStore');
        const current = nowStored ? JSON.parse(nowStored) : null;
        // Never overwrite a different route or restore a cleared session.
        if (String(current?.tienda?.id) !== String(tiendaId)
          || localStorage.getItem('userData') !== requestUser) return null;
        if (res.ok) {
          const received = await res.json();
          const latestRaw = localStorage.getItem('selectedStore');
          const latest = latestRaw ? JSON.parse(latestRaw) : null;
          if (String(latest?.tienda?.id) !== String(tiendaId)
            || localStorage.getItem('userData') !== requestUser) return null;
          const fresh = membershipOnly ? { ...latest, ...received } : received;
          if (Number.isInteger(fresh.version) && Number.isInteger(latest.version) && fresh.version < latest.version) return latest;
          // Keep component effects quiet when nothing has changed.
          if (JSON.stringify(latest) !== JSON.stringify(fresh)) {
            setSelectedStore(fresh);
            localStorage.setItem('selectedStore', JSON.stringify(fresh));
          }
          return fresh;
        }
        if (res.status === 401 || res.status === 403) {
          const body = await res.clone().json().catch(() => null);
          if (body?.code === 'membresia_vencida_manual') {
            const blocked = { ...current, vencida_manualmente: true, estado: 'Vencida' };
            localStorage.setItem('selectedStore', JSON.stringify(blocked));
            setSelectedStore(blocked);
            return blocked;
          }
        }
        if (res.status === 403 || res.status === 404) {
          localStorage.removeItem('selectedStore');
          setSelectedStore(null);
          router.push('/select-store');
        }
        return null;
      } catch { return null; }
      finally {
        if (storeRefreshRef.current === operation) storeRefreshRef.current = null;
      }
    })();
    storeRefreshRef.current = operation;
    return operation.promise;
  }, [router]);

  useEffect(() => {
    if (!token || !selectedStore?.tienda?.id) return;
    const refreshVisibleStore = () => {
      if (document.visibilityState === 'visible') void refreshSelectedStore({ membershipOnly: true });
    };
    refreshVisibleStore();
    window.addEventListener('focus', refreshVisibleStore);
    document.addEventListener('visibilitychange', refreshVisibleStore);
    window.addEventListener('cartera:membership-blocked', refreshVisibleStore);
    const interval = setInterval(refreshVisibleStore, 60000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refreshVisibleStore);
      document.removeEventListener('visibilitychange', refreshVisibleStore);
      window.removeEventListener('cartera:membership-blocked', refreshVisibleStore);
    };
  }, [token, selectedStore?.tienda?.id, refreshSelectedStore]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        selectedStore,
        loading,
        login,
        logout,
        refreshAuthToken,
        selectStore,
        clearStore,
        updateStoreData,
        refreshSelectedStore,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
