"use client";

import { FiAlertCircle, FiChevronDown, FiInfo } from "react-icons/fi";
import { formatMoney, formatDate } from "../../../../utils/format";
import { diasDelPeriodo, diferencia, porcentaje, resumirReporte } from "../report-model";
import ReportMetric, { IndicatorHelp } from "./ReportMetric";
import HistoricalReport from "./HistoricalReport";

const EXPLICACIONES = {
  interesesCobrados: "El sistema aplica los pagos reales primero al capital de cada préstamo. Reconoce interés cuando el acumulado supera ese capital, hasta el interés contratado. No incluye abonos de renovación ni ajustes negativos; estos últimos deben revisarse por separado.",
  gastos: "Suma de gastos ingresados con fecha dentro del período. Se descuentan del resultado cobrado. La clasificación depende de lo registrado: un gasto extraordinario puede estar incluido. No incluye los retiros de utilidad.",
  utilidadCobrada: "Es el interés efectivamente reconocido como cobrado menos los gastos registrados. No descuenta pérdidas de capital, provisiones ni retiros. No equivale al efectivo disponible ni autoriza un retiro.",
  utilidadesRetiradas: "Salidas registradas como distribución de utilidades en estas fechas. Pueden corresponder a resultados acumulados de períodos anteriores. Registrar un retiro no demuestra que haya sido sostenible.",
  resultadoMenosRetiros: "Diferencia entre el resultado cobrado y los retiros registrados en el período. No incluye resultados acumulados de otras fechas ni ajustes por pérdidas. El dinero puede estar nuevamente prestado; no es saldo de caja ni importe disponible para retirar.",
  totalVendido: "Capital original de los préstamos creados en el período. Incluye préstamos por renovación, por lo que no siempre equivale a efectivo nuevo entregado. No representa la cartera total que permanece en la calle.",
  recaudos: "Pagos positivos registrados en esta ruta, excluyendo renovaciones. Pueden contener capital e interés. Los registros de otra ruta, sin préstamo o con ajustes negativos deben revisarse. Este total no verifica efectivo físico.",
  capitalRecuperado: "Parte de los pagos reales aplicada a recuperar el capital original de los préstamos de esta ruta. Puede provenir de préstamos de meses anteriores. Es recuperación de lo prestado, no ganancia.",
  aportes: "Entradas registradas como aportes de capital dentro del período. Aumentan los recursos del negocio, pero no son intereses ni forman parte del resultado cobrado.",
  interesesGenerados: "Interés pactado de los préstamos originados en las fechas seleccionadas. Puede no haberse cobrado todavía. No es el interés pendiente de toda la cartera. No lo restes del interés cobrado para calcular un saldo pendiente: ambos pueden pertenecer a préstamos distintos.",
  perdidaCapital: "Capital no recuperado de los préstamos originados en el período que actualmente están marcados como pérdida. Los pagos se aplican primero al capital. Se presenta por la fecha del préstamo, no por la fecha en que se declaró perdido. No es una salida de caja del período ni una estimación de toda la cartera riesgosa.",
  interesNoCobrado: "Interés no cobrado de esos mismos préstamos actualmente en pérdida. Es ingreso que no se obtuvo, no capital prestado perdido ni interés pendiente de toda la cartera. Se presenta separado para no sumarlo como pérdida de capital.",
  recaudosPorRevisar: "Suma de importes de registros que necesitan aclaración: pagos de esta ruta registrados fuera, pagos de otras rutas registrados aquí, pagos sin préstamo y ajustes negativos en valor absoluto. No es una diferencia neta de caja, una pérdida confirmada ni evidencia por sí sola de fraude.",
};

function Section({ number, title, description, children }) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400" aria-hidden="true">{number}</span>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Notice({ children, warning = false }) {
  return (
    <div className={`mt-4 flex items-start gap-2.5 rounded-xl border p-4 text-sm leading-relaxed ${warning ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300"}`}>
      {warning ? <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden="true" /> : <FiInfo className="mt-0.5 shrink-0" aria-hidden="true" />}
      <div>{children}</div>
    </div>
  );
}

function MostrarMonto({ value }) {
  return <span className={value === null ? "text-slate-400" : value < 0 ? "text-rose-600 dark:text-rose-400" : ""}>{value === null ? "No disponible" : formatMoney(value)}</span>;
}

const COLUMNAS = [
  ["Intereses cobrados", "interesesCobrados"], ["Gastos", "gastos"],
  ["Resultado cobrado antes de pérdidas", "utilidadCobrada"],
  ["Retiros", "utilidadesRetiradas"], ["Resultado menos retiros", "resultadoMenosRetiros"],
];
const ACTIVIDAD = [
  ["Capital colocado", "totalVendido"], ["Capital recuperado", "capitalRecuperado"],
  ["Interés contratado", "interesesGenerados"], ["Recaudos registrados", "recaudos"],
  ["Aportes", "aportes"], ["Capital en pérdida por fecha de origen", "perdidaCapital"],
  ["Créditos nuevos con evidencia", "capitalNuevos"], ["Capital renovado", "capitalRenovado"],
  ["Capital sin clasificación", "capitalSinClasificar"],
  ["Capital declarado en pérdida (fecha de declaración)", "capitalPerdidaDeclarado"],
  ["Interés no cobrado al declarar", "interesPerdidaDeclarado"],
  ["Interés no cobrado de préstamos en pérdida", "interesNoCobrado"], ["Movimientos por revisar", "recaudosPorRevisar"],
];

export default function ReportView({ reporte }) {
  const totales = resumirReporte(reporte.filas);
  const dias = diasDelPeriodo(reporte.inicio, reporte.fin);
  const diasConMovimientos = new Set(reporte.filas.map((fila) => fila.fecha)).size;
  const calculoDisponible = totales.utilidadCobrada !== null;
  const revisionesDisponibles = totales.recaudosPorRevisar !== null;
  const porRevisar = revisionesDisponibles && totales.recaudosPorRevisar > 0;
  const categorias = Object.entries(totales.categoriasGastos || {}).sort(([, a], [, b]) => b - a);
  const metric = (field, title, description, props = {}) => <ReportMetric key={field} title={title} value={totales[field]} description={description} help={EXPLICACIONES[field]} {...props} />;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4 text-sm dark:border-slate-800">
        <p className="font-medium text-slate-700 dark:text-slate-200">
          {formatDate(reporte.inicio)}
          {' '}
          — 
          {' '}
          {formatDate(reporte.fin)}
        </p>
        <p className="text-slate-500">
          {dias}
          {' '}
          días calendario · 
          {' '}
          {diasConMovimientos}
          {' '}
          con registros
        </p>
      </div>
      {(reporte.respaldo || !calculoDisponible) && <div className="mb-6">
        <Notice warning>
          <strong>Solo estimación disponible.</strong>
          {' '}
          No se pudo obtener el resultado cobrado completo. Los datos no disponibles se identifican expresamente; no deben interpretarse como cero ni usarse para concluir cuánto retirar.
        </Notice>
      </div>}

      <Section number="01" title="Resultado del período" description="Lo reconocido como interés cobrado, menos los gastos registrados.">
        <div className="grid gap-4 md:grid-cols-3">
          {metric("interesesCobrados", "Intereses cobrados", "Interés reconocido después de recuperar el capital de cada préstamo.")}
          {metric("gastos", "Gastos registrados", "Gastos ingresados en las fechas seleccionadas.")}
          {metric("utilidadCobrada", "Resultado cobrado antes de pérdidas", "No descuenta pérdidas de capital ni retiros.", { emphasis: true, formula: "Intereses cobrados − gastos registrados" })}
        </div>
        <Notice>
          <p className="font-medium text-slate-700 dark:text-slate-200">Intereses cobrados − gastos registrados = resultado cobrado</p>
          <p className="mt-1">Este resultado no equivale al efectivo disponible en caja. Antes de retirar, revisa también las pérdidas, obligaciones y recursos necesarios para seguir operando.</p>
        </Notice>
      </Section>

      <Section number="02" title="Retiros y resultado no retirado" description="Compara el resultado de estas fechas con las distribuciones que registraste.">
        <div className="grid gap-4 sm:grid-cols-2">
          {metric("utilidadesRetiradas", "Retiros registrados", "Distribuciones de utilidad anotadas en el período.")}
          {metric("resultadoMenosRetiros", "Resultado del período menos retiros", "No es saldo de caja ni una autorización de retiro.", { emphasis: true, formula: "Resultado cobrado − retiros registrados" })}
        </div>
        {totales.resultadoMenosRetiros !== null && totales.resultadoMenosRetiros < 0 && <Notice warning>Los retiros superan el resultado cobrado del período. Revisa si se financiaron con utilidades acumuladas o con capital. Esta comparación, por sí sola, no demuestra descapitalización.</Notice>}
      </Section>

      <Section number="03" title="Actividad de préstamos y recaudos" description="Capital y movimientos del período. No son, por sí mismos, ganancias ni saldo actual de caja.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metric("totalVendido", "Capital colocado", `${totales.cantidadVentas === null ? "Conteo de préstamos no disponible" : `${totales.cantidadVentas} préstamos registrados`}; puede incluir renovaciones.`)}
          {metric("recaudos", "Recaudos registrados", "Pagos positivos de esta ruta, sin abonos de renovación.")}
          {metric("capitalRecuperado", "Capital recuperado", "Dinero prestado que se recupera. No es utilidad.")}
          {metric("aportes", "Aportes de capital", "Aumentan los recursos del negocio, no su utilidad.")}
          {metric("interesesGenerados", "Interés contratado de préstamos del período", "Interés pactado, no necesariamente cobrado.")}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReportMetric title="Capital de créditos nuevos" value={totales.capitalNuevos} description="Origen nuevo comprobado; se agrupa por fecha del préstamo." help="Préstamos con marca de origen nuevo o movimiento de creación en la bitácora de caja. No incluye renovaciones identificadas. Es capital contractual según fecha del préstamo, no el flujo neto de caja: una creación o corrección puede haberse registrado en otro día." />
          <ReportMetric title="Capital renovado" value={totales.capitalRenovado} description="Saldo convertido en otro crédito, sin desembolso nuevo." help="Préstamos identificados como renovación por su marca de origen o vínculo conservado al crédito anterior. El importe puede incluir intereses anteriores capitalizados. Renovar no crea un cobro real ni una ganancia nueva en caja." />
          <ReportMetric title="Capital sin clasificación comprobable" value={totales.capitalSinClasificar} description="Históricos sin evidencia suficiente de su origen." help="Préstamos sin marca de origen, vínculo de renovación ni creación auditada. Un vínculo vacío no prueba que sean desembolsos nuevos: pudo eliminarse el préstamo original. No se reparten estos importes entre nuevos y renovaciones por suposición." />
        </div>
        {totales.capitalSinClasificar > 0 && <Notice warning>Hay capital histórico sin clasificación comprobable. Los créditos nuevos identificados no representan necesariamente todos los desembolsos del período.</Notice>}
        {totales.capitalNuevos === null && <Notice>La fuente consultada aún no permite separar créditos nuevos, renovaciones e históricos sin clasificación.</Notice>}
      </Section>

      <Section number="04" title="Pérdidas y registros por revisar" description="Separa el capital no recuperado de los gastos y de los movimientos que requieren aclaración.">
        <div className="grid gap-4 md:grid-cols-3">
          {metric("perdidaCapital", "Capital no recuperado en préstamos en pérdida", "Préstamos originados en el período que actualmente están en pérdida.")}
          {metric("interesNoCobrado", "Interés no cobrado de esos préstamos", "No es pérdida de capital ni interés pendiente de toda la cartera.")}
          {metric("recaudosPorRevisar", "Importe de movimientos por revisar", "No es una pérdida confirmada ni una diferencia neta de caja.")}
        </div>
        <Notice>Los dos indicadores anteriores de préstamos en pérdida conservan la lectura por fecha de origen. Las nuevas declaraciones se muestran abajo por su propia fecha. Son lecturas distintas: no deben sumarse entre sí ni descontarse automáticamente del resultado cobrado.</Notice>
        <HistoricalReport reporte={reporte} showMetrics />
        <details className="mt-4 rounded-2xl border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-indigo-500 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
              <FiChevronDown aria-hidden="true" />
              Revisión de registros de recaudo
            </span>
            <span className={`rounded-lg px-3 py-1 text-sm ${porRevisar ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{!revisionesDisponibles ? "No disponible" : porRevisar ? "Hay movimientos por revisar" : "Sin diferencias detectadas"}</span>
          </summary>
          <p className="mt-4 text-sm leading-relaxed text-slate-500">Compara dónde se registró cada pago con la ruta del préstamo. No verifica el efectivo físico ni certifica toda la contabilidad.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ReportMetric title="Pagos aplicados a préstamos de esta ruta" value={totales.recaudosAplicados} description="Según la ruta del préstamo, aunque el pago se haya registrado fuera." help="Pagos positivos, sin renovaciones, aplicados a préstamos de esta ruta. Pueden diferir de los recaudos registrados aquí si hay pagos cruzados entre rutas." />
            <ReportMetric title="Registros coincidentes" value={totales.recaudosConciliados} description="La ruta del registro y la del préstamo coinciden." help="Importe de pagos positivos cuya ruta registrada coincide con la del préstamo. No es una comprobación del efectivo en caja." />
          </div>
          <dl className="mt-4 divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {[["Pagos de esta ruta registrados fuera", "recaudosFueraRuta"], ["Pagos de otras rutas registrados aquí", "recaudosDeOtrasRutas"], ["Pagos sin préstamo asociado", "recaudosSinVenta"], ["Ajustes negativos (valor absoluto)", "recaudosNegativos"]].map(([title, field]) => <div key={field} className="flex flex-wrap justify-between gap-2 py-3">
              <dt className="text-slate-600 dark:text-slate-400">{title}</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-200"><MostrarMonto value={totales[field] === null ? null : Math.abs(totales[field])} /></dd>
            </div>)}
          </dl>
        </details>
      </Section>

      <Section number="05" title="Detalle y métricas adicionales" description="Consulta la composición de gastos, los movimientos diarios y las relaciones del período.">
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Gastos por categoría</h3>
          {categorias.length > 0 ? <dl className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {categorias.map(([nombre, valor]) => <div key={nombre} className="flex items-start justify-between gap-4 py-3 text-sm">
              <dt className="text-slate-600 dark:text-slate-400">{nombre}</dt>
              <dd className="shrink-0 font-semibold text-slate-800 dark:text-slate-200">{formatMoney(valor)}</dd>
                                                 </div>)}
          </dl> : <p className="mt-3 text-sm text-slate-500">{totales.categoriasGastos === null ? "Desglose por categoría no disponible." : "No hay gastos registrados por categoría."}</p>}
          <IndicatorHelp title="Gastos por categoría">Distribución de los gastos registrados. Una categoría describe cómo se ingresó el gasto, no garantiza su tratamiento contable como costo operativo o inversión.</IndicatorHelp>
        </div>

        <details className="mb-4 rounded-2xl border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-100 [&::-webkit-details-marker]:hidden">
            <FiChevronDown aria-hidden="true" />
            Relaciones y estimaciones del período
          </summary>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <ReportMetric title="Margen sobre intereses cobrados" value={porcentaje(totales.utilidadCobrada, totales.interesesCobrados)} percentage description="Parte del interés cobrado que queda después de gastos." help="No es rentabilidad del capital ni considera pérdidas de cartera. Si no hay interés cobrado positivo, la relación no está disponible." formula="Resultado cobrado ÷ intereses cobrados × 100" />
            <ReportMetric title="Retiros respecto al resultado cobrado" value={porcentaje(totales.utilidadesRetiradas, totales.utilidadCobrada)} percentage description="Comparación del período, no porcentaje de reparto recomendado." help="Un valor mayor a 100% no prueba por sí mismo uso de capital: puede haber utilidades acumuladas. Si el resultado no es positivo, esta relación no está disponible." formula="Retiros registrados ÷ resultado cobrado × 100" />
            <ReportMetric title="Resultado cobrado / capital colocado" value={porcentaje(totales.utilidadCobrada, totales.totalVendido)} percentage description="Relación de actividad; no es ROI de los mismos préstamos." help="Compara el resultado cobrado con el capital colocado en estas fechas. Los cobros pueden provenir de préstamos anteriores. No sirve como tasa mensual garantizada ni como rentabilidad de una cohorte de préstamos." formula="Resultado cobrado ÷ capital colocado × 100" />
            <ReportMetric title="Interés contratado / capital colocado" value={porcentaje(totales.interesesGenerados, totales.totalVendido)} percentage description="Tasa contratada promedio ponderada de los préstamos del período." help="Compara el interés total pactado con el capital original de los préstamos creados en estas fechas. No es una tasa mensual ni interés efectivamente cobrado. Si no hubo colocación, la relación no está disponible." formula="Interés contratado ÷ capital colocado × 100" />
            <ReportMetric title="Promedio diario del resultado cobrado" value={calculoDisponible && dias > 0 ? Math.round(totales.utilidadCobrada / dias) : null} description={`${dias} días calendario; incluye días sin movimientos.`} help="Divide el resultado cobrado entre todos los días de las fechas seleccionadas. No es una proyección ni garantiza que cada día se genere esa cantidad." formula="Resultado cobrado ÷ días calendario del período" />
            <ReportMetric title="Resultado estimado, no cobrado" value={totales.utilidadEstimada} description="Compara interés contratado, gastos y pérdidas según el cálculo disponible." help={totales.perdidaCapital !== null ? "Conserva la fórmula existente: interés contratado de los préstamos originados en el período, menos gastos y capital no recuperado de los préstamos actualmente en pérdida. Mezcla fechas de origen y gastos del período. No es dinero cobrado ni saldo disponible." : "Estimación histórica: interés contratado menos gastos y saldo en pérdida, que puede incluir interés. No hay desglose fiable de pérdida de capital. No es dinero cobrado ni disponible para retiro."} formula={totales.perdidaCapital !== null ? "Interés contratado − gastos − capital no recuperado en préstamos en pérdida" : "Interés contratado − gastos − saldo en pérdida histórico"} />
          </div>
        </details>

        <details className="rounded-2xl border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-100 [&::-webkit-details-marker]:hidden">
            <FiChevronDown aria-hidden="true" />
            Detalle diario · 
            {' '}
            {diasConMovimientos}
            {' '}
            días con registros
          </summary>
          <p className="mt-4 text-sm leading-relaxed text-slate-500">El resultado cobrado corresponde a pagos y gastos. Las colocaciones y pérdidas por origen usan la fecha del préstamo; las declaraciones usan la fecha real de declaración. “No disponible” no significa cero.</p>
          <div className="mt-4 space-y-3 md:hidden">
            {reporte.filas.map((fila) => <article key={fila.fecha} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100">{formatDate(fila.fecha)}</h4>
              <dl className="mt-3 space-y-2 text-sm">
                {COLUMNAS.map(([title, field]) => <div key={field} className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate-500">{title}</dt>
                  <dd className="font-medium text-slate-800 dark:text-slate-200"><MostrarMonto value={field === "resultadoMenosRetiros" ? diferencia(fila.utilidadCobrada, fila.utilidadesRetiradas) : fila[field]} /></dd>
                </div>)}
              </dl>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-indigo-600 dark:text-indigo-400">Ver actividad y pérdidas de esta fecha</summary>
                <dl className="mt-3 space-y-2">
                  {ACTIVIDAD.map(([title, field]) => <div key={field} className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-500">{title}</dt>
                    <dd className="text-slate-800 dark:text-slate-200"><MostrarMonto value={fila[field]} /></dd>
                                                     </div>)}
                </dl>
              </details>
                                         </article>)}
          </div>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">Resultado y retiros por fecha</caption>
              <thead className="bg-slate-50 text-left text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th scope="col" className="p-3">Fecha</th>
                  {COLUMNAS.map(([title, field]) => <th key={field} scope="col" className="min-w-32 p-3 text-right font-medium">{title}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 dark:divide-slate-800 dark:text-slate-200">
                {reporte.filas.map((fila) => <tr key={fila.fecha}>
                  <th scope="row" className="whitespace-nowrap p-3 text-left font-medium">{formatDate(fila.fecha)}</th>
                  {COLUMNAS.map(([, field]) => <td key={field} className="p-3 text-right tabular-nums"><MostrarMonto value={field === "resultadoMenosRetiros" ? diferencia(fila.utilidadCobrada, fila.utilidadesRetiradas) : fila[field]} /></td>)}
                </tr>)}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                <tr>
                  <th scope="row" className="p-3 text-left">Totales</th>
                  {COLUMNAS.map(([, field]) => <td key={field} className="p-3 text-right tabular-nums"><MostrarMonto value={totales[field]} /></td>)}
                </tr>
              </tfoot>
            </table>
          </div>
          <details className="mt-4 hidden md:block">
            <summary className="cursor-pointer text-sm font-medium text-indigo-600 dark:text-indigo-400">Ver actividad, pérdidas y revisiones por fecha</summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Actividad por origen y pérdidas por fecha de declaración</caption>
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th scope="col" className="p-3 text-left">Fecha</th>
                    {ACTIVIDAD.map(([title, field]) => <th key={field} scope="col" className="min-w-36 p-3 text-right font-medium">{title}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 dark:divide-slate-800 dark:text-slate-200">
                  {reporte.filas.map((fila) => <tr key={fila.fecha}>
                    <th scope="row" className="whitespace-nowrap p-3 text-left font-medium">{formatDate(fila.fecha)}</th>
                    {ACTIVIDAD.map(([, field]) => <td key={field} className="p-3 text-right tabular-nums"><MostrarMonto value={fila[field]} /></td>)}
                  </tr>)}
                </tbody>
              </table>
            </div>
          </details>
        </details>
      </Section>
      <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">Este reporte describe registros de la ruta. No aplica metas de retiro, porcentajes de reserva ni reglas de reparto entre socios. Cada administrador decide su política, considerando caja, cartera y obligaciones.</p>
    </>
  );
}
