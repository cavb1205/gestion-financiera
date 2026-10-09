"use client";

import { formatDate, formatMoney } from "../../../utils/format";
import { fechasPlanPago } from "../../../utils/calendario";

export default function PlanPagosPreview({ fecha, plazo, cuotas, total, cuota }) {
  const fechas = fechasPlanPago(fecha, cuotas, plazo);
  if (!fechas.length || plazo === "Diario") return null;
  return (
    <section aria-label="Calendario del nuevo crédito" className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-900 dark:bg-indigo-950/30">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Calendario de pagos</h2>
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{cuotas} {Number(cuotas) === 1 ? "cuota" : "cuotas"} · {formatMoney(cuota)} por cuota</p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div><dt className="text-slate-500">Primer pago</dt><dd className="mt-1 font-bold text-slate-900 dark:text-white">{formatDate(fechas[0])}</dd></div>
        <div><dt className="text-slate-500">Última cuota</dt><dd className="mt-1 font-bold text-slate-900 dark:text-white">{formatDate(fechas.at(-1))}</dd></div>
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{plazo === "Semanal" ? "Cada 7 días desde la creación. Cuatro cuotas equivalen a 28 días, no a un mes calendario." : "Mismo día del mes siguiente; si ese día no existe, se usa el último día de ese mes."} El interés es el pactado para todo el crédito. Total: {formatMoney(total)}; el redondeo puede ajustar la última cuota.</p>
      <details className="mt-3 text-sm text-indigo-700 dark:text-indigo-300">
        <summary className="cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-indigo-500">Ver todas las fechas</summary>
        <ol className="mt-3 grid max-h-48 list-inside list-decimal gap-2 overflow-auto sm:grid-cols-2">{fechas.map(dia => <li key={dia}>{formatDate(dia)}</li>)}</ol>
      </details>
    </section>
  );
}
