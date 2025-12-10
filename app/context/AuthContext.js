// context/AuthContext.js
'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);

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
        console.log('Token expirado al cargar, limpiando sesión');
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
      console.log(`Token válido, expira en ${Math.round(timeLeft / 60000)} minutos`);
      
      // Limpiar timeout anterior si existe (aunque en este contexto es nuevo)
      const timeoutId = setTimeout(() => {
        console.log('Token expirado por timeout');
        logout();
      }, timeLeft);
      
      return () => clearTimeout(timeoutId); // Cleanup en un useEffect si fuera necesario, pero aquí es difícil retornar
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
    const intervalId = setInterval(() => {
        const tokenTimestamp = localStorage.getItem('tokenTimestamp');
        if (tokenTimestamp) {
            const now = new Date().getTime();
            const tokenAge = now - parseInt(tokenTimestamp, 10);
             if (tokenAge > 60 * 60 * 1000) {
                console.log('Token expirado detectado por intervalo');
                logout();
            }
        }
    }, 60000); // Verificar cada minuto

    return () => clearInterval(intervalId);

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
    setTimeout(logout, 60 * 60 * 1000);
  }, [logout]);

  const selectStore = useCallback((store) => {
    localStorage.setItem('selectedStore', JSON.stringify(store));
    setSelectedStore(store);
  }, []);

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
        selectStore,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);