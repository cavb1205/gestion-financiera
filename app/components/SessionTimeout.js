// components/SessionTimeout.js
"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';


export default function SessionTimeout() {
  const { logout } = useAuth();
  const [timeoutModal, setTimeoutModal] = useState(false);
  const [countdown, setCountdown] = useState(60); // 60 segundos para renovar

  useEffect(() => {
    let inactivityTimer;
    let countdownTimer;
    
    const resetTimer = () => {
      // Resetear el temporizador de inactividad
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setTimeoutModal(true);
        
        // Iniciar cuenta regresiva para renovar sesión
        countdownTimer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownTimer);
              logout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 55 * 60 * 1000); // 55 minutos de inactividad
    };
    
    // Eventos que resetearán el temporizador
    const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });
    
    // Iniciar el temporizador
    resetTimer();
    
    return () => {
      clearTimeout(inactivityTimer);
      clearInterval(countdownTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [logout]);

  const handleRenewSession = () => {
    setTimeoutModal(false);
    setCountdown(60);
    // Aquí podrías implementar la renovación automática
  };

  if (!timeoutModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Sesión a punto de expirar</h2>
        <p className="text-gray-600 mb-4">
          Su sesión expirará en {countdown} segundos por inactividad.
        </p>
        <p className="text-gray-600 mb-6">
          ¿Desea continuar trabajando?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={logout}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
          <button
            onClick={handleRenewSession}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}