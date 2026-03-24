"use client";

import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";

export default function GlobalError({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="glass rounded-[2rem] p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FiAlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">
          Algo salió mal
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {error?.message || "Ocurrió un error inesperado. Por favor intente de nuevo."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
        >
          <FiRefreshCw size={16} />
          Reintentar
        </button>
      </div>
    </div>
  );
}
