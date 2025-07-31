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
      return false;
    }

    try {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setProfile(JSON.parse(storedProfile));
      
      if (storedStore) {
        setSelectedStore(JSON.parse(storedStore));
      }
      
      // Programar verificación de expiración
      const timeLeft = 60 * 60 * 1000 - tokenAge;
      setTimeout(logout, timeLeft);
      
      return true;
    } catch (error) {
      console.error('Error parsing auth data:', error);
      clearAuth();
      return false;
    }
  }, [clearAuth, logout]);

  useEffect(() => {
    // Solo se ejecuta en el cliente
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // Intentar cargar los datos de autenticación
    const authLoaded = loadAuthData();
    
    // Si no se cargaron datos, marcamos loading como false
    if (!authLoaded) {
      setLoading(false);
    } else {
      // Si se cargaron datos, ya estamos autenticados
      setLoading(false);
    }
  }, [loadAuthData]);

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