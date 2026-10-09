"use client";

import { FiCalendar } from "react-icons/fi";

export default function FechaLiquidacion({ isWorker, selectedDate, onChange }) {
  return (
    <div className="space-y-2">
      <label htmlFor="periodo-contable" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha de consulta</label>
      <div className="relative">
        <FiCalendar className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
        {isWorker ? (
          <p className="pl-12 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-white">{selectedDate} · Hoy</p>
        ) : (
          <input
            id="periodo-contable"
            type="date"
            value={selectedDate}
            onChange={(event) => onChange(event.target.value)}
            className="w-full min-w-0 pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/10 outline-none"
          />
        )}
      </div>
      {!isWorker && <p className="text-xs text-slate-500 dark:text-slate-400">Las fechas futuras se consultan como vista previa, sin registrar operaciones.</p>}
    </div>
  );
}
