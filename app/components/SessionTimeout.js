// components/SessionTimeout.js
"use client";
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiClock } from 'react-icons/fi';

export default function SessionTimeout() {
  const { logout, refreshAuthToken } = useAuth();
  const [timeoutModal, setTimeoutModal] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [renewing, setRenewing] = useState(false);
  const inactivityTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timeoutModal) return; // No resetear si el modal está visible

      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        setTimeoutModal(true);
        setCountdown(60);

        countdownTimerRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownTimerRef.current);
              logout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 55 * 60 * 1000); // 55 minutos de inactividad
    };

    const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(inactivityTimerRef.current);
      clearInterval(countdownTimerRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [logout, timeoutModal]);

  const handleRenewSession = async () => {
    setRenewing(true);
    const success = await refreshAuthToken();
    setRenewing(false);

    if (success) {
      clearInterval(countdownTimerRef.current);
      setTimeoutModal(false);
      setCountdown(60);
    } else {
      logout();
    }
  };

  if (!timeoutModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass rounded-2xl p-8 w-96 max-w-[90vw] text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
          <FiClock className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          Sesión a punto de expirar
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-2">
          Su sesión expirará en <span className="font-bold text-amber-500">{countdown}</span> segundos por inactividad.
        </p>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
          ¿Desea continuar trabajando?
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={logout}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          >
            Cerrar sesión
          </button>
          <button
            onClick={handleRenewSession}
            disabled={renewing}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {renewing ? 'Renovando...' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
