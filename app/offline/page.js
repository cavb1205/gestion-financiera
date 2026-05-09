"use client";

import { useState, useEffect } from "react";
import { FiWifiOff, FiRefreshCw, FiWifi } from "react-icons/fi";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [stillOffline, setStillOffline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      const last = sessionStorage.getItem('cartera_last_path') || '/dashboard';
      window.location.href = last;
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      const last = sessionStorage.getItem('cartera_last_path') || '/dashboard';
      window.location.href = last;
    } else {
      setStillOffline(true);
      setTimeout(() => setStillOffline(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="glass max-w-sm w-full rounded-[2.5rem] p-12 text-center border-white/60 dark:border-slate-800 shadow-2xl">
        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 transition-colors ${isOnline ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
          {isOnline
            ? <FiWifi className="text-emerald-500" size={36} />
            : <FiWifiOff className="text-slate-400" size={36} />
          }
        </div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-3">
          {isOnline ? 'Conexión restaurada' : 'Sin conexión'}
        </h1>
        <p className="text-sm font-medium text-slate-500 leading-relaxed mb-10">
          {isOnline
            ? 'Ya tienes internet. Puedes continuar.'
            : 'No hay internet disponible. Revisa tu conexión e intenta de nuevo.'
          }
        </p>

        {stillOffline && (
          <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest mb-4">
            Aún sin conexión — espera un momento
          </p>
        )}

        <button
          onClick={handleRetry}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <FiRefreshCw size={15} />
          {isOnline ? 'Continuar' : 'Reintentar'}
        </button>
      </div>
    </div>
  );
}
