"use client";

import { formatDate, formatMoney } from "../../utils/format";

export default function CalendarioCobro({ credito, vistaPrevia = false }) {
  const calendario = credito.calendario_pago;
  if (!calendario) return null;
  const voluntario = calendario.cobro_voluntario;
  return (
    <div className={`mt-2 rounded-xl border px-3 py-2 text-xs leading-relaxed ${voluntario ? "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200" : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"}`}>
      <p className="font-bold">{vistaPrevia ? voluntario ? "Proyección · cobro voluntario" : "Proyección · cuota pendiente" : voluntario ? "Adelantado · cobro voluntario" : calendario.gestionado_hoy ? "Gestión registrada hoy" : "Cuota exigible pendiente"}</p>
      <p>{voluntario ? `Sin obligación de abonar ni registrar falla ${vistaPrevia ? "en esta fecha" : "hoy"}.` : `Pendiente ${vistaPrevia ? "proyectado " : ""}hasta esta fecha: ${formatMoney(Number(calendario.importe_pendiente_hoy))}.`}</p>
      {calendario.proxima_cuota && <p>Próxima cuota pendiente: {formatDate(calendario.proxima_cuota)}</p>}
    </div>
  );
}
