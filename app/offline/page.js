"use client";

import { FiWifiOff, FiRefreshCw } from "react-icons/fi";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="glass max-w-sm w-full rounded-[2.5rem] p-12 text-center border-white/60 dark:border-slate-800 shadow-2xl">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
          <FiWifiOff className="text-slate-400" size={36} />
        </div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-3">
          Sin conexión
        </h1>
        <p className="text-sm font-medium text-slate-500 leading-relaxed mb-10">
          No hay internet disponible. Revisa tu conexión e intenta de nuevo.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40 transition-all flex items-center justify-center gap-2"
        >
          <FiRefreshCw size={15} />
          Reintentar
        </button>
      </div>
    </div>
  );
}
