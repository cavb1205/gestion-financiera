"use client";

import { formatDate, formatMoney } from '../../../../utils/format';
import { resumenPlanEdicion } from '../../../../utils/edicionCredito.mjs';

export default function PlanEdicionCredito({ original, fecha, plazo, cuotas, total, cuota }) {
  const plan = resumenPlanEdicion(original, { fecha, plazo, cuotas });
  if (!plan) return <p role="status" className="text-sm text-slate-500">Indica una fecha y entre 1 y 120 cuotas para ver el plan.</p>;
  return (
    <section aria-label="Vista previa del plan editado" className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 text-sm dark:border-indigo-900 dark:bg-indigo-950/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-indigo-950 dark:text-indigo-100">Así quedaría el plan de pagos</h2>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-slate-900 dark:text-indigo-300">{plazo} · {cuotas} {Number(cuotas) === 1 ? 'cuota' : 'cuotas'}</span>
      </div>
      {plan.cambioModalidad && <p className="mt-3 font-semibold text-indigo-800 dark:text-indigo-200">Cambio de modalidad: {original.plazo} → {plazo}</p>}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {[['Total del crédito', formatMoney(total)], ['Valor por cuota', formatMoney(cuota)],
          ['Primer pago', formatDate(plan.primera)], ['Última cuota', formatDate(plan.ultima)],
          ['Vencimiento contractual', formatDate(plan.vencimiento)]].map(([label, value]) => (
          <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 font-semibold tabular-nums text-slate-900 dark:text-white">{value}</dd></div>
        ))}
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        {plazo === 'Semanal' ? 'Un pago cada 7 días. Cuatro cuotas son 28 días.' : plazo === 'Mensual'
          ? plan.version === 1 ? 'Un pago cada mes calendario; si el día no existe se usa el último día del mes.' : 'Se conserva el calendario histórico de pagos cada 30 días.'
          : 'Se conserva la modalidad diaria y sus reglas de cobranza.'}
        {plan.tolerancia > 0 ? ' El vencimiento incluye los 4 días de tolerancia del contrato histórico.' : ''}
        {' '}El interés corresponde al crédito completo, no se aplica de nuevo por cada cuota. La última cuota puede ajustar el redondeo.
      </p>
      <details className="mt-3 text-indigo-700 dark:text-indigo-300">
        <summary className="cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-indigo-500">Ver fechas de las cuotas</summary>
        <ol className="mt-3 grid max-h-40 list-inside list-decimal gap-2 overflow-auto sm:grid-cols-2">{plan.fechas.map(dia => <li key={dia}>{formatDate(dia)}</li>)}</ol>
      </details>
      <p className="mt-3 text-xs text-slate-500">Vista previa contractual. No descuenta abonos ni modifica pagos registrados. Los cambios se aplican al guardar.</p>
    </section>
  );
}
