import { parseMoney } from "../../../utils/format.js";

// Older responses and fallback sources do not know every indicator.
// Missing values must not be presented as confirmed zeroes.
export const MONEY_FIELDS = [
  "totalVendido", "interesesGenerados", "gastos", "perdidas",
  "perdidaCapital", "interesNoCobrado", "utilidadEstimada",
  "capitalRecuperado", "interesesCobrados", "utilidadCobrada",
  "recaudos", "recaudosAplicados", "recaudosConciliados",
  "recaudosFueraRuta", "recaudosDeOtrasRutas", "recaudosSinVenta",
  "recaudosNegativos", "recaudosPorRevisar", "aportes", "utilidadesRetiradas",
  "capitalNuevos", "capitalRenovado", "capitalSinClasificar",
  "capitalPerdidaDeclarado", "interesPerdidaDeclarado",
];
const COUNT_FIELDS = ["cantidadVentas", "cantidadDeclaracionesPerdida", "declaracionesPorRevisar"];

export function countOrNull(value) {
  return value !== null && value !== undefined && value !== ""
    && Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
}

export function moneyOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  return Number.isFinite(Number.parseFloat(value)) ? parseMoney(value) : null;
}

export function normalizarFilaReporte(fila) {
  const resultado = {
    fecha: fila.fecha,
    categoriasGastos: fila.categoriasGastos && typeof fila.categoriasGastos === "object"
      ? Object.fromEntries(Object.entries(fila.categoriasGastos).map(([k, v]) => [k, parseMoney(v)]))
      : null,
  };
  for (const campo of COUNT_FIELDS) resultado[campo] = countOrNull(fila[campo]);
  for (const campo of MONEY_FIELDS) resultado[campo] = moneyOrNull(fila[campo]);
  resultado.utilidadEstimada = moneyOrNull(fila.utilidadEstimada ?? fila.utilidad);
  return resultado;
}

export function normalizarReporte(data, inicio, fin) {
  if (!Array.isArray(data) || data.some((fila) => typeof fila?.fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fila.fecha))) {
    throw new Error("Respuesta incompleta del reporte.");
  }
  return data.filter((fila) => fila?.fecha >= inicio && fila.fecha <= fin)
    .map(normalizarFilaReporte).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function resumirReporte(filas) {
  const totales = { categoriasGastos: Object.create(null) };
  for (const campo of [...MONEY_FIELDS, ...COUNT_FIELDS]) {
    totales[campo] = filas.length > 0 && filas.every((fila) => fila[campo] !== null)
      ? filas.reduce((suma, fila) => suma + fila[campo], 0) : null;
  }
  for (const fila of filas) {
    for (const [nombre, valor] of Object.entries(fila.categoriasGastos || {})) {
      totales.categoriasGastos[nombre] = (totales.categoriasGastos[nombre] || 0) + valor;
    }
  }
  if (filas.some((fila) => fila.categoriasGastos === null)) totales.categoriasGastos = null;
  totales.resultadoMenosRetiros = diferencia(totales.utilidadCobrada, totales.utilidadesRetiradas);
  return totales;
}

export function leerRespuestaReporte(data, inicio, fin, tiendaId) {
  if (Array.isArray(data)) return { filas: normalizarReporte(data, inicio, fin), historico: null };
  const contexto = data?.contexto;
  // Do not accept another route/period as the selected report.
  if (data?.version !== 2 || !contexto || contexto.inicio !== inicio || contexto.fin !== fin
    || Number(contexto.tiendaId) !== Number(tiendaId)) {
    throw new Error("Respuesta incompleta del reporte.");
  }
  return {
    filas: normalizarReporte(data.filas, inicio, fin),
    historico: {
      consultadoEn: typeof contexto.consultadoEn === "string" ? contexto.consultadoEn : null,
      fechaConsulta: /^\d{4}-\d{2}-\d{2}$/.test(contexto.fechaConsulta) ? contexto.fechaConsulta : null,
      zonaHoraria: typeof contexto.zonaHoraria === "string" ? contexto.zonaHoraria : null,
      perdidasSinFecha: {
        cantidad: countOrNull(contexto.perdidasSinFecha?.cantidad),
        capitalActual: moneyOrNull(contexto.perdidasSinFecha?.capitalActual),
      },
    },
  };
}

export function diferencia(resultado, retiros) {
  return resultado === null || retiros === null ? null : resultado - retiros;
}

export function porcentaje(numerador, denominador) {
  return numerador === null || denominador === null || denominador <= 0
    ? null : (numerador / denominador) * 100;
}

export function diasDelPeriodo(inicio, fin) {
  const inicioUtc = Date.parse(`${inicio}T00:00:00Z`);
  const finUtc = Date.parse(`${fin}T00:00:00Z`);
  return Number.isFinite(inicioUtc) && Number.isFinite(finUtc) && finUtc >= inicioUtc
    ? Math.floor((finUtc - inicioUtc) / 86400000) + 1 : 0;
}

export function procesarRespaldo(ventas, gastos, inicio, fin) {
  if (!Array.isArray(ventas) || !Array.isArray(gastos)) throw new Error("Respuesta incompleta de las fuentes de respaldo.");
  const porFecha = {};
  function fila(fecha) {
    if (!porFecha[fecha]) porFecha[fecha] = {
      fecha, cantidadVentas: 0, totalVendido: 0, interesesGenerados: 0,
      gastos: 0, perdidas: 0, utilidadEstimada: 0, categoriasGastos: Object.create(null),
    };
    return porFecha[fecha];
  }
  for (const venta of ventas) {
    if (venta.fecha_venta < inicio || venta.fecha_venta > fin) continue;
    const datos = fila(venta.fecha_venta);
    datos.cantidadVentas += 1;
    datos.totalVendido += parseMoney(venta.valor_venta);
    datos.interesesGenerados += parseMoney(venta.total_a_pagar) - parseMoney(venta.valor_venta);
    if (venta.estado_venta === "Perdida") datos.perdidas += parseMoney(venta.perdida);
  }
  for (const gasto of gastos) {
    if (gasto.fecha < inicio || gasto.fecha > fin) continue;
    const datos = fila(gasto.fecha);
    const valor = parseMoney(gasto.valor);
    const categoria = gasto.tipo_gasto?.tipo_gasto || "Sin categoría";
    datos.gastos += valor;
    datos.categoriasGastos[categoria] = (datos.categoriasGastos[categoria] || 0) + valor;
  }
  for (const datos of Object.values(porFecha)) {
    // Preserve the existing fallback formula; its loss can include interest.
    datos.utilidadEstimada = datos.interesesGenerados - datos.gastos - datos.perdidas;
  }
  return normalizarReporte(Object.values(porFecha), inicio, fin);
}

function escaparCsv(valor) {
  // Route/category names are user supplied: CSV quoting alone does not prevent
  // spreadsheets from executing formulas. Numeric negative amounts stay numeric.
  const texto = typeof valor === "string" && /^[\s]*[=+\-@]/.test(valor) ? `'${valor}` : String(valor ?? "");
  return `"${texto.replaceAll('"', '""')}"`;
}

export function crearCsvReporte(reporte) {
  const columnas = [
    ["Fecha", "fecha"], ["Préstamos registrados", "cantidadVentas"],
    ["Capital colocado (incluye renovaciones)", "totalVendido"],
    ["Capital de créditos nuevos con evidencia (fecha del préstamo)", "capitalNuevos"],
    ["Capital renovado (sin desembolso nuevo)", "capitalRenovado"],
    ["Capital histórico sin clasificación comprobable", "capitalSinClasificar"],
    ["Interés contratado de préstamos del período", "interesesGenerados"],
    ["Capital recuperado", "capitalRecuperado"], ["Intereses cobrados", "interesesCobrados"],
    ["Gastos registrados", "gastos"],
    ["Capital no recuperado de préstamos originados en el período actualmente en pérdida", "perdidaCapital"],
    ["Interés no cobrado de esos préstamos en pérdida", "interesNoCobrado"],
    ["Saldo en pérdida histórico (puede incluir interés)", "perdidas"],
    ["Capital declarado en pérdida por fecha de declaración (bruto)", "capitalPerdidaDeclarado"],
    ["Interés no cobrado al declarar pérdida", "interesPerdidaDeclarado"],
    ["Número de declaraciones de pérdida", "cantidadDeclaracionesPerdida"],
    ["Declaraciones con saldo por revisar", "declaracionesPorRevisar"],
    ["Resultado estimado (no cobrado)", "utilidadEstimada"],
    ["Resultado cobrado antes de pérdidas y retiros", "utilidadCobrada"],
    ["Retiros registrados", "utilidadesRetiradas"],
    ["Resultado del período menos retiros (no es caja disponible)", "resultadoMenosRetiros"],
    ["Recaudos registrados", "recaudos"], ["Recaudos aplicados a préstamos", "recaudosAplicados"],
    ["Registros coincidentes entre ruta y préstamo", "recaudosConciliados"],
    ["Pagos de préstamos de esta ruta registrados fuera", "recaudosFueraRuta"],
    ["Pagos de préstamos de otra ruta registrados aquí", "recaudosDeOtrasRutas"],
    ["Pagos sin préstamo asociado", "recaudosSinVenta"],
    ["Ajustes negativos (no incluidos en intereses cobrados)", "recaudosNegativos"],
    ["Importe de movimientos por revisar", "recaudosPorRevisar"], ["Aportes", "aportes"],
  ];
  const encabezados = ["Ruta ID", "Ruta", "Desde", "Hasta", "Fuente", "Lectura", ...columnas.map(([nombre]) => nombre), "Categorías de gasto",
    "Consulta del contexto actual", "Zona horaria", "Préstamos actualmente en pérdida sin fecha conocida (toda la ruta)",
    "Capital actual de esas pérdidas sin fecha (no imputado al período)"];
  const lineas = reporte.filas.map((fila) => {
    const datos = { ...fila, resultadoMenosRetiros: diferencia(fila.utilidadCobrada, fila.utilidadesRetiradas) };
    return [reporte.tiendaId, reporte.nombre, reporte.inicio, reporte.fin,
      reporte.respaldo ? "Respaldo: solo estimación" : "Reporte consolidado",
      "Celdas vacías: dato no disponible. Declaraciones brutas, sin netear recuperaciones ni reactivaciones. Las pérdidas sin fecha son estado actual, no cargos del período. No representa caja disponible ni autoriza retiros.",
      ...columnas.map(([, campo]) => datos[campo]),
      fila.categoriasGastos === null ? null : Object.entries(fila.categoriasGastos).map(([k, v]) => `${k}: ${v}`).join(" | "),
      reporte.historico?.consultadoEn, reporte.historico?.zonaHoraria,
      reporte.historico?.perdidasSinFecha.cantidad, reporte.historico?.perdidasSinFecha.capitalActual,
    ];
  });
  return "\uFEFF" + [encabezados, ...lineas].map((fila) => fila.map(escaparCsv).join(",")).join("\n");
}
