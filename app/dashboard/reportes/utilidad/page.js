// app/dashboard/reportes/utilidad/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiBarChart2,
  FiPercent,
  FiInfo,
  FiTarget,
} from "react-icons/fi";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney, parseMoney } from "../../../utils/format";

function crearFilaVacia(fecha) {
  return {
    fecha,
    cantidadVentas: 0,
    totalVendido: 0,
    interesesGenerados: 0,
    gastos: 0,
    perdidas: 0,
    perdidaCapital: 0,
    interesNoCobrado: 0,
    utilidad: 0,
    utilidadEstimada: 0,
    capitalRecuperado: 0,
    interesesCobrados: 0,
    utilidadCobrada: 0,
    recaudos: 0,
    recaudosAplicados: 0,
    recaudosConciliados: 0,
    recaudosFueraRuta: 0,
    recaudosDeOtrasRutas: 0,
    recaudosSinVenta: 0,
    recaudosNegativos: 0,
    recaudosPorRevisar: 0,
    aportes: 0,
    utilidadesRetiradas: 0,
    categoriasGastos: {},
  };
}

function normalizarCategoriasGastos(categorias) {
  if (!categorias || typeof categorias !== "object") return {};
  return Object.entries(categorias).reduce((resultado, [nombre, valor]) => {
    resultado[nombre] = parseMoney(valor);
    return resultado;
  }, {});
}

function normalizarFilaReporte(fila) {
  const utilidad = parseMoney(fila?.utilidadEstimada ?? fila?.utilidad);
  return {
    ...fila,
    cantidadVentas: Number(fila?.cantidadVentas || 0),
    totalVendido: parseMoney(fila?.totalVendido),
    interesesGenerados: parseMoney(fila?.interesesGenerados),
    gastos: parseMoney(fila?.gastos),
    perdidas: parseMoney(fila?.perdidas),
    perdidaCapital: parseMoney(fila?.perdidaCapital),
    interesNoCobrado: parseMoney(fila?.interesNoCobrado),
    utilidad,
    utilidadEstimada: utilidad,
    capitalRecuperado: parseMoney(fila?.capitalRecuperado),
    interesesCobrados: parseMoney(fila?.interesesCobrados),
    utilidadCobrada: parseMoney(fila?.utilidadCobrada),
    recaudos: parseMoney(fila?.recaudos),
    recaudosAplicados: parseMoney(fila?.recaudosAplicados),
    recaudosConciliados: parseMoney(fila?.recaudosConciliados),
    recaudosFueraRuta: parseMoney(fila?.recaudosFueraRuta),
    recaudosDeOtrasRutas: parseMoney(fila?.recaudosDeOtrasRutas),
    recaudosSinVenta: parseMoney(fila?.recaudosSinVenta),
    recaudosNegativos: parseMoney(fila?.recaudosNegativos),
    recaudosPorRevisar: parseMoney(fila?.recaudosPorRevisar),
    aportes: parseMoney(fila?.aportes),
    utilidadesRetiradas: parseMoney(fila?.utilidadesRetiradas),
    categoriasGastos: normalizarCategoriasGastos(fila?.categoriasGastos),
  };
}

function diasDelPeriodo(inicio, fin) {
  if (!inicio || !fin) return 0;
  const [inicioAnio, inicioMes, inicioDia] = inicio.split("-").map(Number);
  const [finAnio, finMes, finDia] = fin.split("-").map(Number);
  const fechaInicio = Date.UTC(inicioAnio, inicioMes - 1, inicioDia);
  const fechaFin = Date.UTC(finAnio, finMes - 1, finDia);
  if (!Number.isFinite(fechaInicio) || !Number.isFinite(fechaFin) || fechaFin < fechaInicio) return 0;
  return Math.floor((fechaFin - fechaInicio) / 86400000) + 1;
}

function escaparCsv(valor) {
  return `"${String(valor ?? "").replaceAll('"', '""')}"`;
}

export default function ReportesPage() {
  const { selectedStore, isAuthenticated, loading: authLoading } = useAuth();
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [datosReporte, setDatosReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [usandoRespaldo, setUsandoRespaldo] = useState(false);
  const [incluyeUtilidadCobrada, setIncluyeUtilidadCobrada] = useState(false);
  const [incluyeDesglosePerdidas, setIncluyeDesglosePerdidas] = useState(false);
  const [incluyeConciliacion, setIncluyeConciliacion] = useState(false);

  const ajustarFechaLocal = (fecha) => {
    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    setFechaInicio(ajustarFechaLocal(primerDiaMes));
    // El período inicial termina hoy: no incluimos días futuros en promedios
    // ni presentamos esos días como si ya hubieran sido auditados.
    setFechaFin(ajustarFechaLocal(hoy));
  }, []);

  const generarReporte = async (e) => {
    if (e) e.preventDefault();
    setCargando(true);
    setError("");
    setDatosReporte(null);
    setUsandoRespaldo(false);
    setIncluyeUtilidadCobrada(false);
    setIncluyeDesglosePerdidas(false);
    setIncluyeConciliacion(false);

    try {
      if (!fechaInicio || !fechaFin) {
        throw new Error("Seleccione las dos fechas del período");
      }
      if (fechaInicio > fechaFin) {
        throw new Error("La fecha de inicio no puede ser mayor que la fecha de fin");
      }

      const response = await apiFetch(
        `/tiendas/reportes/utilidad/${fechaInicio}/${fechaFin}/t/${selectedStore.tienda.id}/`
      );
      if (!response.ok) throw new Error("Error al consultar el reporte consolidado.");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Respuesta incompleta del reporte consolidado.");
      setIncluyeUtilidadCobrada(data.some((fila) => Object.prototype.hasOwnProperty.call(fila, "utilidadCobrada")));
      setIncluyeDesglosePerdidas(data.some((fila) => Object.prototype.hasOwnProperty.call(fila, "perdidaCapital")));
      setIncluyeConciliacion(data.some((fila) => Object.prototype.hasOwnProperty.call(fila, "recaudosPorRevisar")));
      setDatosReporte(data.map(normalizarFilaReporte));
    } catch (consolidatedError) {
      // Respaldo reversible mientras el endpoint consolidado esté disponible.
      console.warn("Se usará el respaldo del reporte de utilidad:", consolidatedError);
      try {
        const [ventasRes, gastosRes] = await Promise.all([
          apiFetch(`/ventas/list/${fechaInicio}/${fechaFin}/t/${selectedStore.tienda.id}/?vista=reporte`),
          apiFetch(`/gastos/list/${fechaInicio}/${fechaFin}/t/${selectedStore.tienda.id}/`),
        ]);
        if (!ventasRes.ok || !gastosRes.ok) throw new Error("Error al consultar fuentes de datos.");
        const ventasData = await ventasRes.json();
        const gastosData = await gastosRes.json();
        const processed = procesarDatosReporte(
          Array.isArray(ventasData) ? ventasData : [],
          Array.isArray(gastosData) ? gastosData : []
        );
        setUsandoRespaldo(true);
        setIncluyeUtilidadCobrada(false);
        setIncluyeDesglosePerdidas(false);
        setIncluyeConciliacion(false);
        setDatosReporte(processed.map(normalizarFilaReporte));
      } catch (err) {
        setError(err.message || "Fallo en la sincronización de auditoría.");
      }
    } finally {
      setCargando(false);
    }
  };

  const procesarDatosReporte = (ventas, gastos) => {
    const datosPorFecha = {};
    ventas.forEach((venta) => {
      const fecha = venta.fecha_venta;
      if (!datosPorFecha[fecha]) {
        datosPorFecha[fecha] = crearFilaVacia(fecha);
      }
      datosPorFecha[fecha].cantidadVentas += 1;
      datosPorFecha[fecha].totalVendido += parseMoney(venta.valor_venta);
      datosPorFecha[fecha].interesesGenerados += (parseMoney(venta.total_a_pagar) - parseMoney(venta.valor_venta));
      if (venta.estado_venta === "Perdida") {
        datosPorFecha[fecha].perdidas += parseMoney(venta.perdida);
      }
    });

    gastos.forEach((gasto) => {
      const fecha = gasto.fecha;
      if (!datosPorFecha[fecha]) {
        datosPorFecha[fecha] = crearFilaVacia(fecha);
      }
      datosPorFecha[fecha].gastos += parseMoney(gasto.valor);
    });

    Object.values(datosPorFecha).forEach((datos) => {
      datos.utilidad = datos.interesesGenerados - datos.gastos - datos.perdidas;
      datos.utilidadEstimada = datos.utilidad;
    });

    return Object.values(datosPorFecha)
      .filter(f => f.fecha >= fechaInicio && f.fecha <= fechaFin)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  };


  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  const totales = datosReporte ? datosReporte.reduce((acc, curr) => ({
    cantidadVentas: acc.cantidadVentas + curr.cantidadVentas,
    totalVendido: acc.totalVendido + curr.totalVendido,
    interesesGenerados: acc.interesesGenerados + curr.interesesGenerados,
    gastos: acc.gastos + curr.gastos,
    perdidas: acc.perdidas + curr.perdidas,
    perdidaCapital: acc.perdidaCapital + curr.perdidaCapital,
    interesNoCobrado: acc.interesNoCobrado + curr.interesNoCobrado,
    utilidad: acc.utilidad + curr.utilidad,
    capitalRecuperado: acc.capitalRecuperado + curr.capitalRecuperado,
    interesesCobrados: acc.interesesCobrados + curr.interesesCobrados,
    utilidadCobrada: acc.utilidadCobrada + curr.utilidadCobrada,
    recaudos: acc.recaudos + curr.recaudos,
    recaudosAplicados: acc.recaudosAplicados + curr.recaudosAplicados,
    recaudosConciliados: acc.recaudosConciliados + curr.recaudosConciliados,
    recaudosFueraRuta: acc.recaudosFueraRuta + curr.recaudosFueraRuta,
    recaudosDeOtrasRutas: acc.recaudosDeOtrasRutas + curr.recaudosDeOtrasRutas,
    recaudosSinVenta: acc.recaudosSinVenta + curr.recaudosSinVenta,
    recaudosNegativos: acc.recaudosNegativos + curr.recaudosNegativos,
    recaudosPorRevisar: acc.recaudosPorRevisar + curr.recaudosPorRevisar,
    aportes: acc.aportes + curr.aportes,
    utilidadesRetiradas: acc.utilidadesRetiradas + curr.utilidadesRetiradas,
    categoriasGastos: Object.entries(curr.categoriasGastos || {}).reduce((categorias, [nombre, valor]) => {
      categorias[nombre] = (categorias[nombre] || 0) + valor;
      return categorias;
    }, acc.categoriasGastos),
  }), {
    cantidadVentas: 0,
    totalVendido: 0,
    interesesGenerados: 0,
    gastos: 0,
    perdidas: 0,
    perdidaCapital: 0,
    interesNoCobrado: 0,
    utilidad: 0,
    capitalRecuperado: 0,
    interesesCobrados: 0,
    utilidadCobrada: 0,
    recaudos: 0,
    recaudosAplicados: 0,
    recaudosConciliados: 0,
    recaudosFueraRuta: 0,
    recaudosDeOtrasRutas: 0,
    recaudosSinVenta: 0,
    recaudosNegativos: 0,
    recaudosPorRevisar: 0,
    aportes: 0,
    utilidadesRetiradas: 0,
    categoriasGastos: {},
  }) : null;

  // Advanced metrics
  const utilidadDeFila = (fila) => incluyeUtilidadCobrada ? fila.utilidadCobrada : fila.utilidad;
  const mejorDia = datosReporte && datosReporte.length > 0
    ? datosReporte.reduce((best, curr) => utilidadDeFila(curr) > utilidadDeFila(best) ? curr : best)
    : null;
  const peorDia = datosReporte && datosReporte.length > 0
    ? datosReporte.reduce((worst, curr) => utilidadDeFila(curr) < utilidadDeFila(worst) ? curr : worst)
    : null;
  const diasPositivos = datosReporte ? datosReporte.filter(d => utilidadDeFila(d) > 0).length : 0;
  const diasNegativos = datosReporte ? datosReporte.filter(d => utilidadDeFila(d) < 0).length : 0;
  const utilidadPrincipal = totales
    ? (incluyeUtilidadCobrada ? totales.utilidadCobrada : totales.utilidad)
    : 0;
  const perdidaCapitalPrincipal = totales
    ? (incluyeDesglosePerdidas ? totales.perdidaCapital : totales.perdidas)
    : 0;
  const interesPrincipal = totales
    ? (incluyeUtilidadCobrada ? totales.interesesCobrados : totales.interesesGenerados)
    : 0;
  const periodoDias = diasDelPeriodo(fechaInicio, fechaFin);
  const diasSinActividad = datosReporte
    ? Math.max(0, periodoDias - datosReporte.length)
    : 0;
  const promedioDiario = totales && periodoDias > 0
    ? Math.round(utilidadPrincipal / periodoDias)
    : 0;
  const categoriasGastosOrdenadas = totales
    ? Object.entries(totales.categoriasGastos).sort(([, valorA], [, valorB]) => valorB - valorA)
    : [];
  const conciliacionTieneProblemas = Boolean(
    incluyeConciliacion && totales && totales.recaudosPorRevisar > 0
  );

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full">

        {/* Compact Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Inteligencia de Utilidad</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Rentabilidad cobrada y estimada • <span className="text-slate-400">{selectedStore.tienda.nombre}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={generarReporte}
              className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
            >
              <FiRefreshCw size={18} className={cargando ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
            </button>
            {datosReporte && (
              <button
                onClick={() => {
                  const encabezados = [
                    "Fecha",
                    "Num Ventas",
                    "Capital Colocado",
                    "Interés Estimado",
                    "Capital Recuperado",
                    "Interés Cobrado",
                    "Gastos",
                    "Pérdida de Capital",
                    "Interés No Cobrado",
                    "Utilidad Estimada",
                    "Utilidad Cobrada",
                    "Recaudos Registrados",
                    "Recaudos Aplicados",
                    "Recaudos Conciliados",
                    "Recaudos Fuera de Ruta",
                    "Recaudos de Otras Rutas",
                    "Ajustes Negativos",
                    "Recaudos por Revisar",
                    "Aportes",
                    "Retiros de Utilidad",
                    "Categorías de Gasto",
                  ];
                  const filas = datosReporte.map((fila) => [
                    fila.fecha,
                    fila.cantidadVentas,
                    fila.totalVendido,
                    fila.interesesGenerados,
                    fila.capitalRecuperado,
                    fila.interesesCobrados,
                    fila.gastos,
                    incluyeDesglosePerdidas ? fila.perdidaCapital : fila.perdidas,
                    fila.interesNoCobrado,
                    fila.utilidad,
                    fila.utilidadCobrada,
                    fila.recaudos,
                    fila.recaudosAplicados,
                    fila.recaudosConciliados,
                    fila.recaudosFueraRuta,
                    fila.recaudosDeOtrasRutas,
                    fila.recaudosNegativos,
                    fila.recaudosPorRevisar,
                    fila.aportes,
                    fila.utilidadesRetiradas,
                    Object.entries(fila.categoriasGastos || {})
                      .map(([nombre, valor]) => `${nombre}: ${valor}`)
                      .join(" | "),
                  ]);
                  const csv = [encabezados, ...filas]
                    .map((fila) => fila.map(escaparCsv).join(","))
                    .join("\n");
                  const blob = new Blob(["\uFEFF", csv], { type: 'text/csv;charset=utf-8;' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `utilidad_${fechaInicio}_${fechaFin}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                <FiDownload size={16} />
                <span className="hidden md:inline">Exportar</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 mb-8 p-6 md:p-8 shadow-2xl">
          <form onSubmit={generarReporte} className="flex flex-col lg:flex-row items-end gap-6">
            <div className="grid grid-cols-2 gap-4 flex-1 w-full">
              <div className="space-y-2">
                <label htmlFor="fecha-inicio" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Desde</label>
                <input
                  id="fecha-inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="block w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="fecha-fin" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hasta</label>
                <input
                  id="fecha-fin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="block w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={cargando}
              className="w-full lg:w-auto px-10 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
            >
              {cargando ? "Auditando..." : "Generar Reporte"}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-[2rem] flex items-center gap-4 text-rose-600">
            <FiAlertCircle size={20} className="shrink-0" />
            <p className="text-[11px] font-black uppercase tracking-widest leading-none">{error}</p>
          </div>
        )}

        {usandoRespaldo && (
          <div className="mb-8 p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-[2rem] flex items-start gap-4 text-amber-700 dark:text-amber-300">
            <FiInfo size={20} className="shrink-0 mt-0.5" />
            <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">
              Se muestran datos de respaldo: la utilidad cobrada no está disponible y se presenta la utilidad estimada histórica.
            </p>
          </div>
        )}

        {datosReporte && datosReporte.length > 0 && totales ? (
          <>
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="p-2.5 md:p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl md:rounded-2xl">
                    <FiDollarSign size={20} />
                  </div>
                  <FiTrendingUp className="text-emerald-500" size={16} />
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 select-all">
                  {formatMoney(totales.totalVendido)}
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Capital Colocado</p>
              </div>

              <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="p-2.5 md:p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl md:rounded-2xl">
                    <FiPercent size={20} />
                  </div>
                  <span className="text-[9px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                    {totales.totalVendido > 0 ? ((totales.interesesGenerados / totales.totalVendido) * 100).toFixed(1) : 0}% Yield
                  </span>
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                  {formatMoney(totales.interesesGenerados)}
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Interés Estimado</p>
              </div>

              <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="p-2.5 md:p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl md:rounded-2xl">
                    <FiTrendingDown size={20} />
                  </div>
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Egresos</span>
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                  {formatMoney(totales.gastos + perdidaCapitalPrincipal)}
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Gastos + Pérdida Capital</p>
              </div>

              <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border relative overflow-hidden shadow-2xl ${utilidadPrincipal >= 0 ? 'bg-emerald-600 border-emerald-500 shadow-emerald-200 dark:shadow-none' : 'bg-rose-600 border-rose-500 shadow-rose-200 dark:shadow-none'}`}>
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="p-2.5 md:p-3 bg-white/20 rounded-xl md:rounded-2xl">
                      <FiTarget size={20} />
                    </div>
                    <FiCheckCircle className="opacity-50" size={16} />
                  </div>
                  <p className="text-xl md:text-3xl font-black tracking-tighter mb-1 select-all">
                    {formatMoney(utilidadPrincipal)}
                  </p>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none opacity-80">{incluyeUtilidadCobrada ? "Utilidad Cobrada" : "Utilidad Estimada"}</p>
                  {incluyeUtilidadCobrada && (
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-2">Estimada: {formatMoney(totales.utilidad)}</p>
                  )}
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              </div>
            </div>

            {/* Cash movements kept separate from estimated profitability */}
            <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6">
                <div>
                  <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Movimientos de caja</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Información de efectivo del período</p>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">La utilidad cobrada solo reconoce interés después del capital</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">Recaudos registrados</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatMoney(totales.recaudos)}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">Pagos positivos anotados en esta ruta</p>
                </div>
                <div className="p-5 bg-sky-50 dark:bg-sky-900/10 rounded-3xl border border-sky-100 dark:border-sky-900/20">
                  <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-2">Capital recuperado</p>
                  <p className="text-xl font-black text-sky-600 dark:text-sky-400">{formatMoney(totales.capitalRecuperado)}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">Abonos aplicados primero al capital</p>
                </div>
                <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/20">
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">Interés cobrado</p>
                  <p className="text-xl font-black text-amber-600 dark:text-amber-400">{formatMoney(totales.interesesCobrados)}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">Excedente después de recuperar capital</p>
                </div>
                <div className="p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2">Aportes</p>
                  <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatMoney(totales.aportes)}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">Entradas de capital registradas</p>
                </div>
                <div className="p-5 bg-orange-50 dark:bg-orange-900/10 rounded-3xl border border-orange-100 dark:border-orange-900/20">
                  <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-2">Retiros de utilidad</p>
                  <p className="text-xl font-black text-orange-600 dark:text-orange-400">{formatMoney(totales.utilidadesRetiradas)}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">Salidas registradas por distribución</p>
                </div>
              </div>
            </div>

            {incluyeConciliacion ? (
              <div className={`glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border mb-8 ${
                conciliacionTieneProblemas
                  ? "border-amber-200 dark:border-amber-900/40"
                  : "border-emerald-200 dark:border-emerald-900/40"
              }`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${
                      conciliacionTieneProblemas
                        ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600"
                        : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                    }`}>
                      {conciliacionTieneProblemas ? <FiAlertCircle size={22} /> : <FiCheckCircle size={22} />}
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Conciliación de recaudos</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cada peso debe quedar explicado</p>
                    </div>
                  </div>
                  <span className={`self-start md:self-auto px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    conciliacionTieneProblemas
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  }`}>
                    {conciliacionTieneProblemas ? "Hay movimientos para revisar" : "Todo conciliado"}
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Registrados en ruta</p>
                    <p className="text-xl font-black text-slate-700 dark:text-slate-200">{formatMoney(totales.recaudos)}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">Entrada de caja</p>
                  </div>
                  <div className="p-4 bg-sky-50 dark:bg-sky-900/10 rounded-2xl">
                    <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-2">Aplicados a créditos</p>
                    <p className="text-xl font-black text-sky-600 dark:text-sky-400">{formatMoney(totales.recaudosAplicados)}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">Ventas de esta ruta</p>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">Conciliados</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatMoney(totales.recaudosConciliados)}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">Ruta y venta coinciden</p>
                  </div>
                  <div className={`p-4 rounded-2xl ${
                    conciliacionTieneProblemas
                      ? "bg-amber-50 dark:bg-amber-900/10"
                      : "bg-slate-50 dark:bg-slate-800/50"
                  }`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${conciliacionTieneProblemas ? "text-amber-600" : "text-slate-400"}`}>Por revisar</p>
                    <p className={`text-xl font-black ${conciliacionTieneProblemas ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-200"}`}>{formatMoney(totales.recaudosPorRevisar)}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">No es pérdida confirmada</p>
                  </div>
                </div>

                {conciliacionTieneProblemas ? (
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center justify-between gap-3 p-3 bg-amber-50/70 dark:bg-amber-900/10 rounded-xl text-amber-700 dark:text-amber-300">
                      <span>Venta de ruta fuera</span>
                      <span>{formatMoney(totales.recaudosFueraRuta)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3 bg-amber-50/70 dark:bg-amber-900/10 rounded-xl text-amber-700 dark:text-amber-300">
                      <span>Otra ruta aquí</span>
                      <span>{formatMoney(totales.recaudosDeOtrasRutas)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3 bg-rose-50/70 dark:bg-rose-900/10 rounded-xl text-rose-700 dark:text-rose-300">
                      <span>Ajustes negativos</span>
                      <span>{formatMoney(Math.abs(totales.recaudosNegativos))}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-600 dark:text-slate-300">
                      <span>Sin venta asociada</span>
                      <span>{formatMoney(totales.recaudosSinVenta)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 flex items-start gap-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-relaxed">
                    <FiCheckCircle className="mt-0.5 shrink-0" size={14} />
                    Los recaudos positivos de la ruta coinciden con ventas de la misma ruta y no hay ajustes negativos pendientes.
                  </p>
                )}
              </div>
            ) : (
              <div className="glass p-5 md:p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 mb-8 flex items-start gap-3">
                <FiInfo className="text-slate-400 mt-0.5 shrink-0" size={16} />
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
                  La conciliación no está disponible en el modo de respaldo del reporte. Vuelva a intentarlo para auditar los recaudos del período.
                </p>
              </div>
            )}

            {/* Advanced Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <div className="glass p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-white/60 dark:border-slate-800">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Promedio Diario</p>
                <p className={`text-lg md:text-xl font-black tracking-tight ${promedioDiario >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatMoney(promedioDiario)}
                </p>
                <p className="text-[9px] font-bold text-slate-400 mt-1">{periodoDias} días del período · {diasSinActividad} sin actividad</p>
              </div>
              {mejorDia && (
                <div className="glass p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-white/60 dark:border-slate-800">
                  <p className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Mejor Día</p>
                  <p className="text-lg md:text-xl font-black text-emerald-600 tracking-tight">{formatMoney(utilidadDeFila(mejorDia))}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">{mejorDia.fecha}</p>
                </div>
              )}
              {peorDia && (
                <div className="glass p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-white/60 dark:border-slate-800">
                  <p className="text-[9px] md:text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Peor Día</p>
                  <p className="text-lg md:text-xl font-black text-rose-600 tracking-tight">{formatMoney(utilidadDeFila(peorDia))}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">{peorDia.fecha}</p>
                </div>
              )}
              <div className="glass p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-white/60 dark:border-slate-800">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Balance de Días</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-lg md:text-xl font-black text-emerald-600">{diasPositivos}</span>
                  <span className="text-[10px] font-black text-slate-300 dark:text-slate-600">/</span>
                  <span className="text-lg md:text-xl font-black text-rose-600">{diasNegativos}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold text-emerald-500">Positivos</span>
                  <span className="text-[9px] font-bold text-slate-300">vs</span>
                  <span className="text-[9px] font-bold text-rose-500">Negativos</span>
                </div>
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Daily Breakdown */}
              <div className="glass rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl lg:col-span-2">
                <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                    <FiBarChart2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Desglose Cronológico</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{datosReporte.length} días con movimientos · {diasSinActividad} sin actividad · {periodoDias} días del período</p>
                  </div>
                </div>

                {/* Mobile card view */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {datosReporte.map((fila, idx) => (
                    <div key={idx} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{fila.fecha}</p>
                        <p className={`text-sm font-black tracking-tight ${utilidadDeFila(fila) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatMoney(utilidadDeFila(fila))}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-black uppercase tracking-widest">
                        <span className="text-sky-500">Capital rec.: {formatMoney(fila.capitalRecuperado)}</span>
                        <span className="text-amber-500">Interés cob.: {formatMoney(fila.interesesCobrados)}</span>
                        <span className="text-yellow-500">Interés est.: {formatMoney(fila.interesesGenerados)}</span>
                        <span className="text-rose-400">Gastos: {formatMoney(fila.gastos)}</span>
                        <span className="text-orange-500">Pérdida cap.: {formatMoney(incluyeDesglosePerdidas ? fila.perdidaCapital : fila.perdidas)}</span>
                        {incluyeDesglosePerdidas && (
                          <span className="text-orange-300">Interés no cob.: {formatMoney(fila.interesNoCobrado)}</span>
                        )}
                        {incluyeConciliacion && fila.recaudosPorRevisar > 0 && (
                          <span className="text-amber-600">Revisar recaudos: {formatMoney(fila.recaudosPorRevisar)}</span>
                        )}
                        {fila.cantidadVentas > 0 && (
                          <span className="text-slate-400">{fila.cantidadVentas} venta(s)</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Totales</p>
                      <p className="text-base font-black text-indigo-600 dark:text-indigo-400">{formatMoney(utilidadPrincipal)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-black uppercase tracking-widest">
                      <span className="text-sky-500">Capital rec.: {formatMoney(totales.capitalRecuperado)}</span>
                      <span className="text-amber-500">Interés cob.: {formatMoney(totales.interesesCobrados)}</span>
                      <span className="text-yellow-500">Interés est.: {formatMoney(totales.interesesGenerados)}</span>
                      <span className="text-rose-400">Gastos: {formatMoney(totales.gastos)}</span>
                      <span className="text-orange-500">Pérdida cap.: {formatMoney(perdidaCapitalPrincipal)}</span>
                      {incluyeDesglosePerdidas && (
                        <span className="text-orange-300">Interés no cob.: {formatMoney(totales.interesNoCobrado)}</span>
                      )}
                      {incluyeConciliacion && (
                        <span className="text-amber-600">Por revisar: {formatMoney(totales.recaudosPorRevisar)}</span>
                      )}
                      <span className="text-slate-500">{totales.cantidadVentas} venta(s)</span>
                    </div>
                  </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ventas</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Capital Col.</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Capital Rec.</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Interés Est.</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Interés Cob.</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gastos</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pérdida Cap.</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Int. No Cob.</th>
                        {incluyeConciliacion && (
                          <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Por Revisar</th>
                        )}
                        <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{incluyeUtilidadCobrada ? "Utilidad Cob." : "Utilidad Est."}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {datosReporte.map((fila, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter">{fila.fecha}</p>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black text-slate-600 dark:text-slate-400">
                              {fila.cantidadVentas}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{formatMoney(fila.totalVendido)}</p>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <p className="text-xs font-bold text-sky-600">{formatMoney(fila.capitalRecuperado)}</p>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <p className="text-xs font-bold text-amber-600">{formatMoney(fila.interesesGenerados)}</p>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <p className="text-xs font-bold text-yellow-600">{formatMoney(fila.interesesCobrados)}</p>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <p className="text-xs font-bold text-rose-500">{formatMoney(fila.gastos)}</p>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <p className="text-xs font-bold text-orange-500">{formatMoney(incluyeDesglosePerdidas ? fila.perdidaCapital : fila.perdidas)}</p>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <p className="text-xs font-bold text-orange-300">{formatMoney(fila.interesNoCobrado)}</p>
                          </td>
                          {incluyeConciliacion && (
                            <td className="px-6 py-5 text-right">
                              <p className={`text-xs font-black ${fila.recaudosPorRevisar > 0 ? "text-amber-600" : "text-emerald-600"}`}>{formatMoney(fila.recaudosPorRevisar)}</p>
                            </td>
                          )}
                          <td className="px-6 py-5 text-right">
                            <p className={`text-sm font-black tracking-tight ${utilidadDeFila(fila) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatMoney(utilidadDeFila(fila))}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-800">
                      <tr>
                        <td className="px-6 py-6 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Totales Período</td>
                        <td className="px-6 py-6 text-center text-sm font-black text-slate-800 dark:text-white">{totales.cantidadVentas}</td>
                        <td className="px-6 py-6 text-right text-sm font-black text-indigo-600 dark:text-indigo-400">{formatMoney(totales.totalVendido)}</td>
                        <td className="px-6 py-6 text-right text-sm font-black text-sky-600">{formatMoney(totales.capitalRecuperado)}</td>
                        <td className="px-6 py-6 text-right text-sm font-black text-amber-600">{formatMoney(totales.interesesGenerados)}</td>
                        <td className="px-6 py-6 text-right text-sm font-black text-yellow-600">{formatMoney(totales.interesesCobrados)}</td>
                        <td className="px-6 py-6 text-right text-sm font-black text-rose-500">{formatMoney(totales.gastos)}</td>
                        <td className="px-6 py-6 text-right text-sm font-black text-orange-500">{formatMoney(perdidaCapitalPrincipal)}</td>
                        <td className="px-6 py-6 text-right text-sm font-black text-orange-300">{formatMoney(totales.interesNoCobrado)}</td>
                        {incluyeConciliacion && (
                          <td className="px-6 py-6 text-right text-sm font-black text-amber-600">{formatMoney(totales.recaudosPorRevisar)}</td>
                        )}
                        <td className="px-6 py-6 text-right text-lg font-black text-indigo-600 dark:text-indigo-400">{formatMoney(utilidadPrincipal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Composición de Egresos */}
              <div className="glass p-8 md:p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl">
                <h4 className="text-lg md:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">Composición de Egresos</h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-5 md:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Gastos Operativos</p>
                      <p className="text-xl font-black text-rose-500 tracking-tight">{formatMoney(totales.gastos)}</p>
                    </div>
                    <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                      <FiTrendingDown size={24} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-5 md:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Pérdida de Capital</p>
                      <p className="text-xl font-black text-orange-500 tracking-tight">{formatMoney(perdidaCapitalPrincipal)}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
                      <FiAlertCircle size={24} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-5 md:p-6 bg-orange-50/50 dark:bg-orange-900/10 rounded-3xl border border-orange-100 dark:border-orange-900/20">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Interés No Cobrado</p>
                      <p className="text-xl font-black text-orange-300 tracking-tight">{formatMoney(totales.interesNoCobrado)}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 text-orange-300 rounded-2xl flex items-center justify-center shrink-0">
                      <FiPercent size={24} />
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Por categoría</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gastos registrados</p>
                    </div>
                    {categoriasGastosOrdenadas.length > 0 ? (
                      <div className="space-y-3">
                        {categoriasGastosOrdenadas.map(([nombre, valor]) => (
                          <div key={nombre} className="flex items-center justify-between gap-4 text-xs">
                            <span className="font-bold text-slate-500 dark:text-slate-400 truncate">{nombre}</span>
                            <span className="font-black text-slate-700 dark:text-slate-200 whitespace-nowrap">{formatMoney(valor)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sin gastos categorizados en el período</p>
                    )}
                  </div>
                </div>

                <div className="mt-8 px-4 flex items-start gap-4">
                  <FiInfo className="text-slate-300 mt-1 shrink-0" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    La utilidad cobrada reconoce solo el interés que queda después de recuperar capital. La pérdida de capital y el interés no cobrado se muestran separados; el segundo no se cuenta como pérdida de capital.
                  </p>
                </div>
              </div>

              {/* Performance & Yield */}
              <div className="glass p-8 md:p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl relative overflow-hidden">
                <h4 className="text-lg md:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">Performance & Yield</h4>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{incluyeUtilidadCobrada ? "Utilidad cobrada sobre interés cobrado" : "Utilidad estimada sobre interés"}</p>
                      <p className={`text-lg font-black ${utilidadPrincipal >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {interesPrincipal > 0 ? ((utilidadPrincipal / interesPrincipal) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${utilidadPrincipal >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${interesPrincipal > 0 ? Math.min(100, Math.max(0, (utilidadPrincipal / interesPrincipal) * 100)) : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:gap-6 pt-2">
                    <div className="p-5 md:p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">ROI {incluyeUtilidadCobrada ? "cobrado" : "estimado"} sobre capital</p>
                      <p className={`text-base font-black uppercase tracking-tight ${totales.totalVendido > 0 && (utilidadPrincipal / totales.totalVendido) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
                        {totales.totalVendido > 0 ? ((utilidadPrincipal / totales.totalVendido) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    <div className="p-5 md:p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Yield bruto estimado</p>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                        {totales.totalVendido > 0 ? ((totales.interesesGenerados / totales.totalVendido) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
                <FiTarget className="absolute -right-10 -bottom-10 text-slate-50 dark:text-white/5" size={200} />
              </div>
            </div>
          </>
        ) : (
          <div className="glass p-16 md:p-20 rounded-[3rem] text-center border-white/60 dark:border-slate-800">
            <div className="w-20 md:w-24 h-20 md:h-24 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
              <FiBarChart2 size={40} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-400 uppercase tracking-widest mb-2">
              {datosReporte ? "Sin movimientos en el período" : "Esperando Auditoría"}
            </h2>
            <p className="text-sm font-bold text-slate-400">
              {datosReporte
                ? "No hay ventas, gastos ni movimientos de caja registrados para las fechas seleccionadas."
                : "Seleccione un período y pulse &quot;Generar Reporte&quot; para visualizar la inteligencia de utilidad."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
