// app/dashboard/reportes/gastos/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";
import {
  FiDollarSign,
  FiTrendingDown,
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiBarChart2,
  FiCalendar,
  FiPieChart,
  FiHash,
  FiActivity,
} from "react-icons/fi";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney, parseMoney } from "../../../utils/format";
import { toast } from "react-toastify";

const CATEGORY_COLORS = [
  { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-600", bar: "bg-rose-500", border: "border-rose-100 dark:border-rose-900/30" },
  { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600", bar: "bg-amber-500", border: "border-amber-100 dark:border-amber-900/30" },
  { bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600", bar: "bg-violet-500", border: "border-violet-100 dark:border-violet-900/30" },
  { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600", bar: "bg-blue-500", border: "border-blue-100 dark:border-blue-900/30" },
  { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600", bar: "bg-emerald-500", border: "border-emerald-100 dark:border-emerald-900/30" },
  { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600", bar: "bg-orange-500", border: "border-orange-100 dark:border-orange-900/30" },
  { bg: "bg-teal-50 dark:bg-teal-900/20", text: "text-teal-600", bar: "bg-teal-500", border: "border-teal-100 dark:border-teal-900/30" },
  { bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-600", bar: "bg-pink-500", border: "border-pink-100 dark:border-pink-900/30" },
  { bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-600", bar: "bg-cyan-500", border: "border-cyan-100 dark:border-cyan-900/30" },
  { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600", bar: "bg-indigo-500", border: "border-indigo-100 dark:border-indigo-900/30" },
];

export default function ReporteGastosPage() {
  const { selectedStore, isAuthenticated, loading: authLoading } = useAuth();
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [gastos, setGastos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [fechasListas, setFechasListas] = useState(false);

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
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    setFechaInicio(ajustarFechaLocal(primerDiaMes));
    setFechaFin(ajustarFechaLocal(ultimoDiaMes));
    setFechasListas(true);
  }, []);

  const generarReporte = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!selectedStore || !fechaInicio || !fechaFin) return;

    setCargando(true);
    setError("");
    setGastos(null);

    try {
      if (new Date(fechaInicio) > new Date(fechaFin)) {
        throw new Error("La fecha de inicio no puede ser mayor que la fecha de fin");
      }

      const res = await apiFetch(
        `/gastos/list/${fechaInicio}/${fechaFin}/t/${selectedStore.tienda.id}/`
      );

      if (!res.ok) throw new Error("Error al consultar los gastos.");

      const data = await res.json();

      if (!Array.isArray(data)) {
        setGastos([]);
        return;
      }

      setGastos(data);
    } catch (err) {
      const msg = err.message || "Error al generar el reporte de gastos.";
      setError(msg);
      toast.error(msg);
    } finally {
      setCargando(false);
    }
  }, [selectedStore, fechaInicio, fechaFin]);

  // Auto-generate on mount after dates are set
  useEffect(() => {
    if (fechasListas && selectedStore) {
      generarReporte();
    }
  }, [fechasListas, selectedStore]);

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  // --- Computed Data ---
  const totalGastos = gastos
    ? gastos.reduce((sum, g) => sum + parseMoney(g.valor), 0)
    : 0;

  // Category breakdown
  const categoryMap = {};
  if (gastos) {
    gastos.forEach((g) => {
      const catName = g.tipo_gasto?.tipo_gasto || "Sin categoría";
      const catId = g.tipo_gasto?.id || 0;
      if (!categoryMap[catId]) {
        categoryMap[catId] = { id: catId, nombre: catName, total: 0, count: 0 };
      }
      categoryMap[catId].total += parseMoney(g.valor);
      categoryMap[catId].count += 1;
    });
  }
  const categories = Object.values(categoryMap).sort((a, b) => b.total - a.total);
  const maxCategoryTotal = categories.length > 0 ? categories[0].total : 0;
  const topCategory = categories.length > 0 ? categories[0] : null;

  // Unique dates for daily average
  const uniqueDates = gastos
    ? [...new Set(gastos.map((g) => g.fecha))].sort((a, b) => b.localeCompare(a))
    : [];
  const promedioDiario = uniqueDates.length > 0 ? totalGastos / uniqueDates.length : 0;

  // Group expenses by date
  const gastosPorFecha = {};
  if (gastos) {
    gastos.forEach((g) => {
      if (!gastosPorFecha[g.fecha]) {
        gastosPorFecha[g.fecha] = { fecha: g.fecha, items: [], total: 0 };
      }
      gastosPorFecha[g.fecha].items.push(g);
      gastosPorFecha[g.fecha].total += parseMoney(g.valor);
    });
  }
  const fechasAgrupadas = Object.values(gastosPorFecha).sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha)
  );

  // CSV export
  const exportarCSV = () => {
    if (!gastos || gastos.length === 0) return;
    const rows = [
      "Fecha,Categoría,Comentario,Valor",
      ...gastos.map((g) => {
        const cat = g.tipo_gasto?.tipo_gasto || "Sin categoría";
        const comentario = (g.comentario || "").replace(/,/g, ";").replace(/\n/g, " ");
        return `${g.fecha},"${cat}","${comentario}",${parseMoney(g.valor)}`;
      }),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gastos_${fechaInicio}_${fechaFin}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Análisis de Gastos</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Categorías • <span className="text-slate-400">{selectedStore.tienda.nombre}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={generarReporte}
              className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
            >
              <FiRefreshCw size={18} className={cargando ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
            </button>
            {gastos && gastos.length > 0 && (
              <button
                onClick={exportarCSV}
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                <FiDownload size={16} />
                <span className="hidden md:inline">Exportar</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Filter */}
        <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 mb-8 p-6 md:p-8 shadow-2xl">
          <form onSubmit={generarReporte} className="flex flex-col lg:flex-row items-end gap-6">
            <div className="grid grid-cols-2 gap-4 flex-1 w-full">
              <div className="space-y-2">
                <label htmlFor="fechaInicio" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Desde</label>
                <input
                  id="fechaInicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="block w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="fechaFin" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hasta</label>
                <input
                  id="fechaFin"
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
              {cargando ? "Analizando..." : "Generar Reporte"}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-[2rem] flex items-center gap-4 text-rose-600">
            <FiAlertCircle size={20} className="shrink-0" />
            <p className="text-[11px] font-black uppercase tracking-widest leading-none">{error}</p>
          </div>
        )}

        {gastos && gastos.length > 0 ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
              {/* Total Gastos */}
              <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="p-2.5 md:p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl md:rounded-2xl">
                    <FiDollarSign size={20} />
                  </div>
                  <FiTrendingDown className="text-rose-400" size={16} />
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 select-all">
                  {formatMoney(totalGastos)}
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Gastos</p>
              </div>

              {/* Categoría Mayor */}
              <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="p-2.5 md:p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl md:rounded-2xl">
                    <FiPieChart size={20} />
                  </div>
                  <span className="text-[9px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                    {topCategory && totalGastos > 0 ? ((topCategory.total / totalGastos) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                  {formatMoney(topCategory?.total || 0)}
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none truncate" title={topCategory?.nombre}>
                  {topCategory?.nombre || "---"}
                </p>
              </div>

              {/* Promedio Diario */}
              <div className="col-span-2 lg:col-span-1 glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="p-2.5 md:p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl md:rounded-2xl">
                    <FiActivity size={20} />
                  </div>
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                    {uniqueDates.length} días
                  </span>
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 select-all">
                  {formatMoney(promedioDiario)}
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Promedio Diario</p>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="glass rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl mb-8">
              <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                  <FiPieChart size={20} />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Desglose por Categoría</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{categories.length} categorías detectadas</p>
                </div>
              </div>

              <div className="p-6 md:p-10 space-y-5">
                {categories.map((cat, idx) => {
                  const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  const pct = totalGastos > 0 ? (cat.total / totalGastos) * 100 : 0;
                  const barWidth = maxCategoryTotal > 0 ? (cat.total / maxCategoryTotal) * 100 : 0;

                  return (
                    <div key={cat.id} className={`p-5 md:p-6 ${color.bg} rounded-3xl border ${color.border}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-3 h-3 rounded-full ${color.bar} shrink-0`} />
                          <p className={`text-sm md:text-base font-black ${color.text} uppercase tracking-tight truncate`}>
                            {cat.nombre}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {cat.count} gasto{cat.count !== 1 ? "s" : ""}
                          </span>
                          <span className={`text-[10px] font-black ${color.text} bg-white/60 dark:bg-slate-900/40 px-2.5 py-1 rounded-lg`}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-3 bg-white/60 dark:bg-slate-900/30 rounded-full overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full ${color.bar} transition-all duration-1000`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <p className={`text-sm md:text-base font-black ${color.text} tracking-tighter shrink-0 select-all`}>
                          {formatMoney(cat.total)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chronological Table */}
            <div className="glass rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl">
              <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                  <FiCalendar size={20} />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Detalle Cronológico</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{gastos.length} registros en {uniqueDates.length} fechas</p>
                </div>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {fechasAgrupadas.map((grupo) => (
                  <div key={grupo.fecha}>
                    {/* Date header */}
                    <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/30 flex items-center justify-between">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{grupo.fecha}</p>
                      <p className="text-xs font-black text-rose-500">{formatMoney(grupo.total)}</p>
                    </div>
                    {/* Items */}
                    {grupo.items.map((gasto) => (
                      <div key={gasto.id} className="px-5 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-black text-slate-800 dark:text-white truncate mr-3">
                            {gasto.tipo_gasto?.tipo_gasto || "Sin categoría"}
                          </p>
                          <p className="text-sm font-black text-rose-500 tracking-tight shrink-0">
                            {formatMoney(parseMoney(gasto.valor))}
                          </p>
                        </div>
                        {gasto.comentario && (
                          <p className="text-[10px] font-bold text-slate-400 truncate">{gasto.comentario}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                {/* Mobile footer */}
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Período</p>
                    <p className="text-base font-black text-rose-600">{formatMoney(totalGastos)}</p>
                  </div>
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Categoría</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Comentario</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {fechasAgrupadas.map((grupo) => (
                      grupo.items.map((gasto, gIdx) => (
                        <tr key={gasto.id} className="group hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all">
                          <td className="px-8 py-5 whitespace-nowrap">
                            {gIdx === 0 ? (
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter">{gasto.fecha}</p>
                                <span className="text-[9px] font-black text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg">
                                  {formatMoney(grupo.total)}
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-300 dark:text-slate-600">&mdash;</p>
                            )}
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                              {gasto.tipo_gasto?.tipo_gasto || "Sin categoría"}
                            </p>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-xs text-slate-400 truncate max-w-xs">
                              {gasto.comentario || "---"}
                            </p>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <p className="text-sm font-black text-rose-500 tracking-tight">
                              {formatMoney(parseMoney(gasto.valor))}
                            </p>
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-800">
                    <tr>
                      <td className="px-8 py-6 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Total Período</td>
                      <td className="px-8 py-6" />
                      <td className="px-8 py-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{gastos.length} registros</p>
                      </td>
                      <td className="px-8 py-6 text-right text-lg font-black text-rose-600">{formatMoney(totalGastos)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        ) : gastos && gastos.length === 0 ? (
          <div className="glass p-16 md:p-20 rounded-[3rem] text-center border-white/60 dark:border-slate-800">
            <div className="w-20 md:w-24 h-20 md:h-24 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
              <FiBarChart2 size={40} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-400 uppercase tracking-widest mb-2">Sin Gastos</h2>
            <p className="text-sm font-bold text-slate-400">No se encontraron gastos en el período seleccionado.</p>
          </div>
        ) : !cargando ? (
          <div className="glass p-16 md:p-20 rounded-[3rem] text-center border-white/60 dark:border-slate-800">
            <div className="w-20 md:w-24 h-20 md:h-24 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
              <FiBarChart2 size={40} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-400 uppercase tracking-widest mb-2">Esperando Análisis</h2>
            <p className="text-sm font-bold text-slate-400">Seleccione un período y pulse &quot;Generar Reporte&quot; para analizar los gastos por categoría.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
