"use client";

import { FiInfo } from "react-icons/fi";
import { formatMoney } from "../../../../utils/format";

export function IndicatorHelp({ title, children, formula }) {
  return (
    <details className="mt-3 text-sm group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 [&::-webkit-details-marker]:hidden" aria-label={`Qué significa: ${title}`}>
        <FiInfo className="shrink-0" aria-hidden="true" />
        <span>¿Qué significa?</span>
      </summary>
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <p>{children}</p>
        {formula && (
          <p className="mt-2 border-t border-slate-200 pt-2 font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
            {"Cálculo: "}{formula}
          </p>
        )}
      </div>
    </details>
  );
}

export default function ReportMetric({ title, value, description, help, formula, emphasis = false, percentage = false }) {
  const disponible = value !== null && value !== undefined;
  const negativo = disponible && value < 0;
  return (
    <div className={`min-w-0 rounded-2xl border p-5 md:p-6 ${emphasis ? "border-indigo-200 bg-indigo-50/80 dark:border-indigo-800 dark:bg-indigo-950/40" : "border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/70"}`}>
      <h3 className="text-sm font-semibold leading-snug text-slate-600 dark:text-slate-300">{title}</h3>
      <p className={`mt-3 break-words text-2xl md:text-3xl font-bold tracking-tight tabular-nums ${negativo ? "text-rose-600 dark:text-rose-400" : emphasis ? "text-indigo-700 dark:text-indigo-300" : "text-slate-900 dark:text-white"}`}>
        {disponible ? (percentage ? `${value.toFixed(1)}%` : formatMoney(value)) : <span className="text-lg font-medium text-slate-500">No disponible</span>}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      <IndicatorHelp title={title} formula={formula}>{help}</IndicatorHelp>
    </div>
  );
}
