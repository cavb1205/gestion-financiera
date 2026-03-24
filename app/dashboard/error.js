"use client";

import { FiAlertTriangle, FiRefreshCw, FiHome } from "react-icons/fi";
import Link from "next/link";

export default function DashboardError({ error, reset }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="glass rounded-[2rem] p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FiAlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">
          Error en el módulo
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {error?.message || "Ocurrió un error al cargar esta sección."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
          >
            <FiRefreshCw size={16} />
            Reintentar
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <FiHome size={16} />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
