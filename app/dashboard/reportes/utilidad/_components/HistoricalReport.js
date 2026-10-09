"use client";

import { formatDate, formatMoney } from "../../../../utils/format";
import ReportMetric from "./ReportMetric";
import { resumirReporte } from "../report-model";

export default function HistoricalReport({ reporte, showMetrics = false }) {
  const contexto = reporte.historico;
  const totales = resumirReporte(reporte.filas);
  const pendientes = contexto?.perdidasSinFecha;
  return (
    <div className="mt-5 space-y-4">
      {showMetrics && <>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Declaraciones registradas en el período</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <ReportMetric title="Capital declarado en pérdida" value={totales.capitalPerdidaDeclarado}
            description="Según la fecha real de declaración, aunque el préstamo sea de otro mes."
            help="Foto del capital no recuperado al declarar pérdida. Considera pagos reales netos, incluidos ajustes negativos; excluye renovaciones. Es la suma bruta de declaraciones: no resta recuperaciones posteriores. Una reactivación seguida de otra declaración puede contar el mismo crédito otra vez. No es pérdida definitiva neta ni salida de caja del período." />
          <ReportMetric title="Interés no cobrado al declarar pérdida" value={totales.interesPerdidaDeclarado}
            description="Separado del capital, para no confundir ingreso no obtenido con dinero prestado."
            help="Interés contratado que quedaba sin cobrar en cada declaración. Se conserva la foto de ese momento y no se reescribe al cobrar después. No debe sumarse como pérdida de capital ni descontarse automáticamente de los intereses cobrados del mes." />
        </div>
        {totales.cantidadDeclaracionesPerdida !== null && <p className="text-sm text-slate-500">{totales.cantidadDeclaracionesPerdida} {totales.cantidadDeclaracionesPerdida === 1 ? "declaración registrada" : "declaraciones registradas"}. Estos importes no se descuentan automáticamente del resultado cobrado.</p>}
        {totales.declaracionesPorRevisar > 0 && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">{totales.declaracionesPorRevisar} declaraciones tienen diferencias entre saldo y pagos netos. Revisa los registros antes de usar estos importes para decidir retiros.</p>}
      </>}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
        <p className="font-semibold">Cobertura del historial de pérdidas</p>
        {!contexto ? <p className="mt-1">La fuente consultada no ofrece fechas de declaración ni cobertura histórica. “No disponible” no significa que no hubo pérdidas. Se necesita el backend actualizado para estos indicadores.</p>
          : pendientes.cantidad === null || pendientes.capitalActual === null ? <p className="mt-1">La cobertura de pérdidas históricas no está disponible; no se puede confirmar que el período esté completo.</p>
            : pendientes.cantidad > 0 ? <p className="mt-1">Toda la ruta tiene {pendientes.cantidad} {pendientes.cantidad === 1 ? "préstamo actualmente en pérdida" : "préstamos actualmente en pérdida"} sin fecha de declaración conocida, con {formatMoney(pendientes.capitalActual)} de capital no recuperado. Este es el estado actual al {contexto.fechaConsulta ? formatDate(contexto.fechaConsulta) : "momento de consulta"}, no una pérdida imputada al período seleccionado.</p>
              : <p className="mt-1">No hay préstamos actualmente en pérdida sin fecha conocida en esta ruta. Esto no certifica que todas las pérdidas históricas estén registradas: los préstamos eliminados o reactivados antes de esta auditoría pueden no dejar evidencia.</p>}
        <p className="mt-2">Solo se fechan las nuevas declaraciones registradas desde la activación de la auditoría. No se asigna la fecha de hoy a pérdidas antiguas ni se reconstruye su fecha a partir del origen del préstamo.</p>
        {contexto?.zonaHoraria && <p className="mt-2">Jornada de la ruta: {contexto.zonaHoraria}. Las fechas guardadas de cada declaración no cambian al modificar la zona horaria después.</p>}
      </div>
    </div>
  );
}
