// app/dashboard/reportes/comparativo/page.js
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";
import {
   FiTrendingDown,
   FiRefreshCw,
   FiDownload,
   FiAlertCircle,
   FiBarChart2,
   FiDollarSign,
   FiPercent,
   FiTarget,
   FiArrowUp,
   FiArrowDown,
   FiMinus,
} from "react-icons/fi";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney, parseMoney } from "../../../utils/format";

const MESES = [
   "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
   "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function getMonthRange(year, month) {
   const inicio = `${year}-${String(month + 1).padStart(2, "0")}-01`;
   const lastDay = new Date(year, month + 1, 0).getDate();
   const fin = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
   return { inicio, fin };
}

function getPrevMonth(year, month) {
   if (month === 0) return { year: year - 1, month: 11 };
   return { year, month: month - 1 };
}

function procesarMes(ventas, gastos, aportes) {
   let cantidadVentas = 0, totalVendido = 0, intereses = 0, perdidas = 0;
   let totalGastos = 0, totalAportes = 0;
   const categorias = {};

   ventas.forEach((v) => {
      cantidadVentas += 1;
      totalVendido += parseMoney(v.valor_venta);
      intereses += parseMoney(v.total_a_pagar) - parseMoney(v.valor_venta);
      if (v.estado_venta === "Perdida") {
         perdidas += parseMoney(v.perdida ?? v.saldo_actual);
      }
   });

   gastos.forEach((g) => {
      const val = parseMoney(g.valor);
      totalGastos += val;
      const cat = g.tipo_gasto?.tipo_gasto || g.categoria || "Sin categoría";
      categorias[cat] = (categorias[cat] || 0) + val;
   });

   aportes.forEach((a) => {
      totalAportes += parseMoney(a.valor);
   });

   const utilidad = intereses - totalGastos - perdidas;

   return {
      cantidadVentas,
      totalVendido,
      intereses,
      totalGastos,
      perdidas,
      totalAportes,
      utilidad,
      categorias,
      margen: intereses > 0 ? (utilidad / intereses) * 100 : 0,
   };
}

function normalizarMes(mes) {
   return {
      ...mes,
      cantidadVentas: Number(mes?.cantidadVentas || 0),
      totalVendido: parseMoney(mes?.totalVendido),
      intereses: parseMoney(mes?.intereses),
      totalGastos: parseMoney(mes?.totalGastos),
      perdidas: parseMoney(mes?.perdidas),
      totalAportes: parseMoney(mes?.totalAportes),
      utilidad: parseMoney(mes?.utilidad),
      margen: Number(mes?.margen || 0),
      categorias: Object.fromEntries(
         Object.entries(mes?.categorias || {}).map(([nombre, valor]) => [nombre, parseMoney(valor)])
      ),
   };
}

function calcVariacion(actual, anterior) {
   if (anterior === 0) return actual === 0 ? 0 : null;
   return ((actual - anterior) / Math.abs(anterior)) * 100;
}

function VariacionBadge({ valor, invertir = false, unidad = "%" }) {
   if (valor === null) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg text-[10px] font-black">
         — Sin base
      </span>
   );
   if (valor === 0) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg text-[10px] font-black">
         <FiMinus size={10} /> 0{unidad}
      </span>
   );
   const positivo = invertir ? valor < 0 : valor > 0;
   return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black ${positivo
         ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
         : "bg-rose-50 dark:bg-rose-900/20 text-rose-600"
         }`}>
         {positivo ? <FiArrowUp size={10} /> : <FiArrowDown size={10} />}
         {Math.abs(valor).toFixed(1)}{unidad}
      </span>
   );
}

const escaparCsv = (valor) => `"${String(valor ?? "").replace(/"/g, '""')}"`;
const etiquetaMes = ({ year, month }) => `${MESES[month]} ${year}`;
const formatearVariacionCsv = (valor) => valor === null ? "N/D" : `${valor.toFixed(1)}%`;

export default function ReporteComparativoPage() {
   const { selectedStore, isAuthenticated, loading: authLoading } = useAuth();
   const hoy = new Date();
   const prev = getPrevMonth(hoy.getFullYear(), hoy.getMonth());
   const [mesA, setMesA] = useState({ year: prev.year, month: prev.month }); // "base" (left)
   const [mesB, setMesB] = useState({ year: hoy.getFullYear(), month: hoy.getMonth() }); // "comparar" (right)
   const [datos, setDatos] = useState(null);
   const [cargando, setCargando] = useState(false);
   const [error, setError] = useState("");
   const solicitudRef = useRef(0);

   const fetchMesLegacy = useCallback(async (year, month) => {
      const { inicio, fin } = getMonthRange(year, month);
      const tiendaId = selectedStore.tienda.id;

      const fetchJson = async (path) => {
         const res = await apiFetch(path);
         if (!res.ok) {
            throw new Error(`No se pudo consultar ${path.split("/")[1] || "los datos"}`);
         }
         const data = await res.json();
         return Array.isArray(data) ? data : [];
      };

      const [ventas, gastos, aportes] = await Promise.all([
         fetchJson(`/ventas/list/${inicio}/${fin}/t/${tiendaId}/?vista=reporte`),
         fetchJson(`/gastos/list/${inicio}/${fin}/t/${tiendaId}/`),
         fetchJson(`/aportes/list/${inicio}/${fin}/t/${tiendaId}/`),
      ]);

      return procesarMes(ventas, gastos, aportes);
   }, [selectedStore]);

   const generarComparativo = useCallback(async () => {
      if (!selectedStore) return;
      const solicitud = ++solicitudRef.current;

      if (mesA.year === mesB.year && mesA.month === mesB.month) {
         setCargando(false);
         setDatos(null);
         setError("Seleccione dos meses diferentes para comparar.");
         return;
      }

      setCargando(true);
      setError("");
      setDatos(null);

      try {
         const rangoA = getMonthRange(mesA.year, mesA.month);
         const rangoB = getMonthRange(mesB.year, mesB.month);
         const response = await apiFetch(
            `/tiendas/reportes/comparativo/${rangoA.inicio}/${rangoA.fin}/${rangoB.inicio}/${rangoB.fin}/t/${selectedStore.tienda.id}/`
         );
         if (!response.ok) throw new Error("Error al consultar el comparativo consolidado");
         const data = await response.json();
         if (!data?.mes_a || !data?.mes_b) throw new Error("Respuesta incompleta del comparativo consolidado");
         if (solicitud === solicitudRef.current) {
            setDatos({
               actual: normalizarMes(data.mes_b),
               anterior: normalizarMes(data.mes_a),
            });
         }
      } catch (consolidatedError) {
         // Respaldo reversible si el endpoint consolidado no está disponible.
         console.warn("Se usará el respaldo del comparativo:", consolidatedError);
         try {
            const [anterior, actual] = await Promise.all([
               fetchMesLegacy(mesA.year, mesA.month),
               fetchMesLegacy(mesB.year, mesB.month),
            ]);
            if (solicitud === solicitudRef.current) {
               setDatos({ actual, anterior });
            }
         } catch (err) {
            if (solicitud === solicitudRef.current) {
               setError(err.message || "Error al generar el comparativo.");
            }
         }
      } finally {
         if (solicitud === solicitudRef.current) {
            setCargando(false);
         }
      }
   }, [fetchMesLegacy, mesA, mesB, selectedStore]);

   useEffect(() => {
      if (selectedStore) {
         generarComparativo();
      }
   }, [selectedStore, generarComparativo]);

   const exportarCSV = () => {
      if (!datos) return;
      const { actual: a, anterior: p } = datos;
      const rows = [
         ["Métrica", etiquetaMes(mesA), etiquetaMes(mesB), "Diferencia", "Variación"],
         ["Ventas (cantidad)", p.cantidadVentas, a.cantidadVentas, a.cantidadVentas - p.cantidadVentas, formatearVariacionCsv(calcVariacion(a.cantidadVentas, p.cantidadVentas))],
         ["Capital colocado", p.totalVendido, a.totalVendido, a.totalVendido - p.totalVendido, formatearVariacionCsv(calcVariacion(a.totalVendido, p.totalVendido))],
         ["Intereses brutos", p.intereses, a.intereses, a.intereses - p.intereses, formatearVariacionCsv(calcVariacion(a.intereses, p.intereses))],
         ["Gastos operativos", p.totalGastos, a.totalGastos, a.totalGastos - p.totalGastos, formatearVariacionCsv(calcVariacion(a.totalGastos, p.totalGastos))],
         ["Pérdidas de cartera", p.perdidas, a.perdidas, a.perdidas - p.perdidas, formatearVariacionCsv(calcVariacion(a.perdidas, p.perdidas))],
         ["Aportes de capital", p.totalAportes, a.totalAportes, a.totalAportes - p.totalAportes, formatearVariacionCsv(calcVariacion(a.totalAportes, p.totalAportes))],
         ["Utilidad neta", p.utilidad, a.utilidad, a.utilidad - p.utilidad, formatearVariacionCsv(calcVariacion(a.utilidad, p.utilidad))],
         ["Margen neto", `${p.margen.toFixed(1)}%`, `${a.margen.toFixed(1)}%`, `${(a.margen - p.margen).toFixed(1)} pp`, "N/D"],
      ].map((row) => row.map(escaparCsv).join(","));
      const blob = new Blob([`\uFEFF${rows.join("\n")}`], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `comparativo_${mesA.year}-${String(mesA.month + 1).padStart(2, "0")}_vs_${mesB.year}-${String(mesB.month + 1).padStart(2, "0")}.csv`;
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
   };

   if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

   const { actual, anterior } = datos || {};
   const mismaComparacion = mesA.year === mesB.year && mesA.month === mesB.month;
   const mesComparadoEnCurso = mesB.year === hoy.getFullYear() && mesB.month === hoy.getMonth();
   const mesBaseEnCurso = mesA.year === hoy.getFullYear() && mesA.month === hoy.getMonth();
   const variacionUtilidad = datos ? calcVariacion(actual.utilidad, anterior.utilidad) : null;

   // All categories from both months
   const todasCategorias = datos
      ? [...new Set([...Object.keys(actual.categorias), ...Object.keys(anterior.categorias)])]
         .sort((a, b) => (actual.categorias[b] || 0) - (actual.categorias[a] || 0))
      : [];

   const maxCategoria = datos
      ? Math.max(...todasCategorias.map(c => Math.max(actual.categorias[c] || 0, anterior.categorias[c] || 0)), 1)
      : 1;
   const tieneCategoriasReales = todasCategorias.some((categoria) => categoria !== "Sin categoría");

   return (
      <div className="min-h-screen bg-transparent pb-12">
         <div className="w-full">

            {/* Header */}
            <div className="flex items-center justify-between mb-8 gap-4">
               <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Comparativo Mensual</h1>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
                     {etiquetaMes(mesA)} vs {etiquetaMes(mesB)} • <span className="text-slate-400">{selectedStore.tienda.nombre}</span>
                  </p>
               </div>
               <div className="flex items-center gap-3 shrink-0">
                  <button
                     onClick={generarComparativo}
                     disabled={cargando}
                     aria-label="Actualizar comparativo"
                     className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group disabled:cursor-not-allowed disabled:opacity-50"
                  >
                     <FiRefreshCw size={18} className={cargando ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                  </button>
                  {datos && (
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

            {/* Month Selector */}
            <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 mb-8 p-6 md:p-8 shadow-2xl">
               <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                  {/* Mes Base (A) */}
                  <div className="flex-1 w-full space-y-2">
                     <label htmlFor="mes-base" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Mes Base</label>
                     <div className="flex gap-2">
                        <select
                           id="mes-base"
                           value={mesA.month}
                           onChange={(e) => setMesA(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                           className="flex-1 px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                        >
                           {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <select
                           value={mesA.year}
                           onChange={(e) => setMesA(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                           className="w-24 px-3 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                        >
                           {Array.from({ length: 7 }, (_, i) => hoy.getFullYear() - i).map(y => (
                              <option key={y} value={y}>{y}</option>
                           ))}
                        </select>
                     </div>
                  </div>

                  {/* VS badge */}
                  <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl shrink-0 mt-4 md:mt-6">
                     <span className="text-[10px] font-black uppercase tracking-widest">vs</span>
                  </div>

                  {/* Mes Comparar (B) */}
                  <div className="flex-1 w-full space-y-2">
                     <label htmlFor="mes-comparar" className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-2">Comparar Con</label>
                     <div className="flex gap-2">
                        <select
                           id="mes-comparar"
                           value={mesB.month}
                           onChange={(e) => setMesB(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                           className="flex-1 px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl text-[13px] font-black text-indigo-600 dark:text-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                        >
                           {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <select
                           value={mesB.year}
                           onChange={(e) => setMesB(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                           className="w-24 px-3 py-4 bg-slate-50 dark:bg-slate-800/50 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl text-[13px] font-black text-indigo-600 dark:text-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                        >
                           {Array.from({ length: 7 }, (_, i) => hoy.getFullYear() - i).map(y => (
                              <option key={y} value={y}>{y}</option>
                           ))}
                        </select>
                     </div>
                  </div>
               </div>
            </div>

            {(mesComparadoEnCurso || mesBaseEnCurso) && !mismaComparacion ? (
               <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300">
                  <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p className="text-[10px] font-bold leading-relaxed">
                     {mesComparadoEnCurso && mesBaseEnCurso
                        ? "Ambos períodos corresponden al mes en curso y sus cifras todavía pueden cambiar."
                        : `El período ${mesComparadoEnCurso ? etiquetaMes(mesB) : etiquetaMes(mesA)} está en curso; sus cifras todavía pueden aumentar y no representan un cierre mensual.`}
                  </p>
               </div>
            ) : null}

            {error && (
               <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-[2rem] flex items-center gap-4 text-rose-600">
                  <FiAlertCircle size={20} className="shrink-0" />
                  <p className="text-[11px] font-black uppercase tracking-widest leading-none">{error}</p>
               </div>
            )}

            {cargando && (
               <div className="flex flex-col items-center justify-center py-24">
                  <LoadingSpinner />
                  <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Calculando comparativo</p>
               </div>
            )}

            {datos && actual && anterior && !cargando && (
               <>
                  {/* KPI Comparison Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                     {/* Capital Colocado */}
                     <div className="glass p-5 md:p-7 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                           <div className="p-2 md:p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                              <FiDollarSign size={18} />
                           </div>
                           <VariacionBadge valor={calcVariacion(actual.totalVendido, anterior.totalVendido)} />
                        </div>
                        <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-white tracking-tighter mb-0.5">
                           {formatMoney(actual.totalVendido)}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 mb-2">Base: {formatMoney(anterior.totalVendido)}</p>
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Capital Colocado</p>
                     </div>

                     {/* Intereses */}
                     <div className="glass p-5 md:p-7 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                           <div className="p-2 md:p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                              <FiPercent size={18} />
                           </div>
                           <VariacionBadge valor={calcVariacion(actual.intereses, anterior.intereses)} />
                        </div>
                        <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-white tracking-tighter mb-0.5">
                           {formatMoney(actual.intereses)}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 mb-2">Base: {formatMoney(anterior.intereses)}</p>
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Intereses Brutos</p>
                     </div>

                     {/* Gastos + Pérdidas */}
                     <div className="glass p-5 md:p-7 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                           <div className="p-2 md:p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl">
                              <FiTrendingDown size={18} />
                           </div>
                           <VariacionBadge valor={calcVariacion(actual.totalGastos + actual.perdidas, anterior.totalGastos + anterior.perdidas)} invertir />
                        </div>
                        <p className="text-lg md:text-2xl font-black text-slate-800 dark:text-white tracking-tighter mb-0.5">
                           {formatMoney(actual.totalGastos + actual.perdidas)}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 mb-2">Base: {formatMoney(anterior.totalGastos + anterior.perdidas)}</p>
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Gastos + Pérdidas</p>
                     </div>

                     {/* Utilidad Neta */}
                     <div className={`p-5 md:p-7 rounded-[2rem] md:rounded-[2.5rem] border relative overflow-hidden shadow-2xl ${actual.utilidad >= 0
                        ? "bg-emerald-600 border-emerald-500 shadow-emerald-200 dark:shadow-none"
                        : "bg-rose-600 border-rose-500 shadow-rose-200 dark:shadow-none"
                        }`}>
                        <div className="relative z-10 text-white">
                           <div className="flex items-center justify-between mb-3">
                              <div className="p-2 md:p-2.5 bg-white/20 rounded-xl">
                                 <FiTarget size={18} />
                              </div>
                              {variacionUtilidad === null ? (
                                 <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2 py-0.5 text-[10px] font-black">
                                    — Sin base
                                 </span>
                              ) : (
                                 <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2 py-0.5 text-[10px] font-black">
                                    {variacionUtilidad > 0 ? <FiArrowUp size={10} /> : variacionUtilidad < 0 ? <FiArrowDown size={10} /> : <FiMinus size={10} />}
                                    {Math.abs(variacionUtilidad).toFixed(1)}%
                                 </span>
                              )}
                           </div>
                           <p className="text-lg md:text-2xl font-black tracking-tighter mb-0.5">
                              {formatMoney(actual.utilidad)}
                           </p>
                           <p className="text-[9px] font-bold text-white/60 mb-2">Base: {formatMoney(anterior.utilidad)}</p>
                           <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none opacity-80">Utilidad Neta</p>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                     </div>
                  </div>

                  {/* Secondary Metrics */}
                  <div className="grid grid-cols-3 gap-4 md:gap-6 mb-8">
                     <div className="glass p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-white/60 dark:border-slate-800">
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ventas Realizadas</p>
                        <div className="flex items-baseline gap-2">
                           <p className="text-lg md:text-xl font-black text-slate-800 dark:text-white">{actual.cantidadVentas}</p>
                           <VariacionBadge valor={calcVariacion(actual.cantidadVentas, anterior.cantidadVentas)} />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mt-1">Base: {anterior.cantidadVentas}</p>
                     </div>

                     <div className="glass p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-white/60 dark:border-slate-800">
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Aportes Capital</p>
                        <div className="flex items-baseline gap-2">
                           <p className="text-lg md:text-xl font-black text-slate-800 dark:text-white">{formatMoney(actual.totalAportes)}</p>
                           <VariacionBadge valor={calcVariacion(actual.totalAportes, anterior.totalAportes)} />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mt-1">Base: {formatMoney(anterior.totalAportes)}</p>
                     </div>

                     <div className="glass p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-white/60 dark:border-slate-800">
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Margen Neto</p>
                        <div className="flex items-baseline gap-2">
                           <p className={`text-lg md:text-xl font-black ${actual.margen >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {actual.margen.toFixed(1)}%
                           </p>
                           <VariacionBadge valor={actual.margen - anterior.margen} unidad=" pp" />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mt-1">Base: {anterior.margen.toFixed(1)}%</p>
                     </div>
                  </div>

                  {/* Detailed Comparison Table */}
                  <div className="glass rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl mb-8">
                     <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                           <FiBarChart2 size={20} />
                        </div>
                        <div>
                           <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Detalle Comparativo</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              Base: {etiquetaMes(mesA)} · Comparado: {etiquetaMes(mesB)}
                           </p>
                        </div>
                     </div>

                     {/* Desktop */}
                     <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border-collapse">
                           <thead>
                              <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                                 <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Métrica</th>
                                 <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{etiquetaMes(mesA)}</th>
                                 <th className="px-6 py-5 text-right text-[10px] font-black text-indigo-500 uppercase tracking-[0.15em]">{etiquetaMes(mesB)}</th>
                                 <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Diferencia</th>
                                 <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Variación</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {[
                                 { label: "Ventas (cantidad)", ant: anterior.cantidadVentas, act: actual.cantidadVentas, isMoney: false },
                                 { label: "Capital Colocado", ant: anterior.totalVendido, act: actual.totalVendido, isMoney: true },
                                 { label: "Intereses Brutos", ant: anterior.intereses, act: actual.intereses, isMoney: true },
                                 { label: "Gastos Operativos", ant: anterior.totalGastos, act: actual.totalGastos, isMoney: true, invertir: true },
                                 { label: "Pérdidas de Cartera", ant: anterior.perdidas, act: actual.perdidas, isMoney: true, invertir: true },
                                 { label: "Aportes de Capital", ant: anterior.totalAportes, act: actual.totalAportes, isMoney: true },
                                 { label: "Utilidad Neta", ant: anterior.utilidad, act: actual.utilidad, isMoney: true, highlight: true },
                              ].map((row) => (
                                 <tr key={row.label} className={`group transition-all ${row.highlight ? "bg-slate-50/50 dark:bg-indigo-500/5" : "hover:bg-slate-50/30 dark:hover:bg-slate-800/20"}`}>
                                    <td className="px-8 py-5">
                                       <p className={`text-xs font-black uppercase tracking-tight ${row.highlight ? "text-indigo-600 dark:text-indigo-400" : "text-slate-800 dark:text-white"}`}>
                                          {row.label}
                                       </p>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                       <p className="text-xs font-bold text-slate-500">
                                          {row.isMoney ? formatMoney(row.ant) : row.ant}
                                       </p>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                       <p className={`text-sm font-black tracking-tight ${row.highlight
                                          ? (row.act >= 0 ? "text-emerald-600" : "text-rose-600")
                                          : "text-slate-800 dark:text-white"
                                          }`}>
                                          {row.isMoney ? formatMoney(row.act) : row.act}
                                       </p>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                       <p className={`text-xs font-black ${(row.act - row.ant) >= 0
                                          ? (row.invertir ? "text-rose-500" : "text-emerald-600")
                                          : (row.invertir ? "text-emerald-600" : "text-rose-500")
                                          }`}>
                                          {(row.act - row.ant) >= 0 ? "+" : ""}{row.isMoney ? formatMoney(row.act - row.ant) : (row.act - row.ant)}
                                       </p>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                       <VariacionBadge valor={calcVariacion(row.act, row.ant)} invertir={row.invertir} />
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>

                     {/* Mobile */}
                     <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {[
                           { label: "Capital Colocado", ant: anterior.totalVendido, act: actual.totalVendido },
                           { label: "Intereses", ant: anterior.intereses, act: actual.intereses },
                           { label: "Gastos + Pérdidas", ant: anterior.totalGastos + anterior.perdidas, act: actual.totalGastos + actual.perdidas, invertir: true },
                           { label: "Utilidad Neta", ant: anterior.utilidad, act: actual.utilidad, highlight: true },
                        ].map((row) => (
                           <div key={row.label} className={`px-5 py-4 ${row.highlight ? "bg-slate-50/50 dark:bg-indigo-500/5" : ""}`}>
                              <div className="flex items-center justify-between mb-2">
                                 <p className={`text-[10px] font-black uppercase tracking-widest ${row.highlight ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}>
                                    {row.label}
                                 </p>
                                 <VariacionBadge valor={calcVariacion(row.act, row.ant)} invertir={row.invertir} />
                              </div>
                              <div className="flex items-end justify-between gap-4">
                                 <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Base</p>
                                    <p className="text-[10px] font-bold text-slate-400">{formatMoney(row.ant)}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Comparado</p>
                                    <p className={`text-base font-black tracking-tight ${row.highlight
                                       ? (row.act >= 0 ? "text-emerald-600" : "text-rose-600")
                                       : "text-slate-800 dark:text-white"
                                       }`}>
                                       {formatMoney(row.act)}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Category Comparison */}
                  {todasCategorias.length > 0 && (
                     <div className="glass rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl">
                        <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                           <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                              <FiTrendingDown size={20} />
                           </div>
                           <div>
                              <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
                                 {tieneCategoriasReales ? "Gastos por Categoría" : "Gastos Operativos"}
                              </h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                 {tieneCategoriasReales ? "Distribución comparativa" : "Total comparado por período"}
                              </p>
                           </div>
                        </div>

                        <div className="p-6 md:p-8 space-y-5">
                           {/* Legend */}
                           <div className="flex items-center gap-6 mb-2">
                              <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-sm" />
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{etiquetaMes(mesA)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 bg-indigo-500 rounded-sm" />
                                 <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{etiquetaMes(mesB)}</span>
                              </div>
                           </div>

                           {todasCategorias.map((cat) => {
                              const valAnt = anterior.categorias[cat] || 0;
                              const valAct = actual.categorias[cat] || 0;
                              const pctAnt = (valAnt / maxCategoria) * 100;
                              const pctAct = (valAct / maxCategoria) * 100;
                              return (
                                 <div key={cat}>
                                    <div className="flex items-center justify-between mb-2">
                                       <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                          {cat === "Sin categoría" && !tieneCategoriasReales ? "Total gastos operativos" : cat}
                                       </p>
                                       <VariacionBadge valor={calcVariacion(valAct, valAnt)} invertir />
                                    </div>
                                    <div className="space-y-1.5">
                                       <div className="flex items-center gap-3">
                                          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full flex-1 overflow-hidden">
                                             <div className="h-full bg-slate-300 dark:bg-slate-600 rounded-full transition-all duration-700" style={{ width: `${pctAnt}%` }} />
                                          </div>
                                          <span className="text-[10px] font-bold text-slate-400 w-20 text-right shrink-0">{formatMoney(valAnt)}</span>
                                       </div>
                                       <div className="flex items-center gap-3">
                                          <div className="h-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex-1 overflow-hidden">
                                             <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${pctAct}%` }} />
                                          </div>
                                          <span className="text-[10px] font-bold text-indigo-500 w-20 text-right shrink-0">{formatMoney(valAct)}</span>
                                       </div>
                                    </div>
                                 </div>
                              );
                           })}

                           {todasCategorias.length === 0 && (
                              <div className="py-10 text-center">
                                 <p className="text-xs font-bold text-slate-400">Sin gastos registrados en ambos períodos.</p>
                              </div>
                           )}
                        </div>
                     </div>
                  )}
               </>
            )}

            {!datos && !cargando && !error && (
               <div className="glass p-16 md:p-20 rounded-[3rem] text-center border-white/60 dark:border-slate-800">
                  <div className="w-20 md:w-24 h-20 md:h-24 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
                     <FiBarChart2 size={40} />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-400 uppercase tracking-widest mb-2">Esperando Datos</h2>
                  <p className="text-sm font-bold text-slate-400">Seleccione un período para generar el análisis comparativo.</p>
               </div>
            )}

         </div>
      </div>
   );
}
