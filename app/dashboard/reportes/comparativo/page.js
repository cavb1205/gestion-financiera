// app/dashboard/reportes/comparativo/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";
import {
   FiTrendingUp,
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

function getNextMonth(year, month) {
   if (month === 11) return { year: year + 1, month: 0 };
   return { year, month: month + 1 };
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
         perdidas += parseMoney(v.perdida);
      }
   });

   gastos.forEach((g) => {
      const val = parseMoney(g.valor);
      totalGastos += val;
      const cat = g.categoria || "Sin categoría";
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

function calcVariacion(actual, anterior) {
   if (anterior === 0 && actual === 0) return 0;
   if (anterior === 0) return actual > 0 ? 100 : -100;
   return ((actual - anterior) / Math.abs(anterior)) * 100;
}

function VariacionBadge({ valor, invertir = false }) {
   if (valor === 0) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg text-[10px] font-black">
         <FiMinus size={10} /> 0%
      </span>
   );
   const positivo = invertir ? valor < 0 : valor > 0;
   return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black ${positivo
         ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
         : "bg-rose-50 dark:bg-rose-900/20 text-rose-600"
         }`}>
         {positivo ? <FiArrowUp size={10} /> : <FiArrowDown size={10} />}
         {Math.abs(valor).toFixed(1)}%
      </span>
   );
}

export default function ReporteComparativoPage() {
   const { selectedStore, isAuthenticated, loading: authLoading } = useAuth();
   const hoy = new Date();
   const prev = getPrevMonth(hoy.getFullYear(), hoy.getMonth());
   const [mesA, setMesA] = useState({ year: prev.year, month: prev.month }); // "base" (left)
   const [mesB, setMesB] = useState({ year: hoy.getFullYear(), month: hoy.getMonth() }); // "comparar" (right)
   const [datos, setDatos] = useState(null);
   const [cargando, setCargando] = useState(false);
   const [error, setError] = useState("");

   const fetchMes = async (year, month) => {
      const { inicio, fin } = getMonthRange(year, month);
      const tiendaId = selectedStore.tienda.id;

      const fetchJson = async (path) => {
         const res = await apiFetch(path);
         if (!res.ok) return [];
         const data = await res.json();
         return Array.isArray(data) ? data : [];
      };

      const [ventas, gastos, aportes] = await Promise.all([
         fetchJson(`/ventas/list/${inicio}/${fin}/t/${tiendaId}/`),
         fetchJson(`/gastos/list/${inicio}/${fin}/t/${tiendaId}/`),
         fetchJson(`/aportes/list/${inicio}/${fin}/t/${tiendaId}/`),
      ]);

      return procesarMes(ventas, gastos, aportes);
   };

   const generarComparativo = async () => {
      if (!selectedStore) return;
      setCargando(true);
      setError("");
      setDatos(null);

      try {
         const [anterior, actual] = await Promise.all([
            fetchMes(mesA.year, mesA.month),
            fetchMes(mesB.year, mesB.month),
         ]);
         setDatos({ actual, anterior });
      } catch (err) {
         setError(err.message || "Error al generar el comparativo.");
      } finally {
         setCargando(false);
      }
   };

   useEffect(() => {
      if (selectedStore) {
         generarComparativo();
      }
   }, [selectedStore, mesA, mesB]);

   const exportarCSV = () => {
      if (!datos) return;
      const { actual: a, anterior: p } = datos;
      const rows = [
         "Métrica,Mes Anterior,Mes Actual,Variación %",
         `Ventas (cantidad),${p.cantidadVentas},${a.cantidadVentas},${calcVariacion(a.cantidadVentas, p.cantidadVentas).toFixed(1)}%`,
         `Capital Colocado,${p.totalVendido},${a.totalVendido},${calcVariacion(a.totalVendido, p.totalVendido).toFixed(1)}%`,
         `Intereses,${p.intereses},${a.intereses},${calcVariacion(a.intereses, p.intereses).toFixed(1)}%`,
         `Gastos,${p.totalGastos},${a.totalGastos},${calcVariacion(a.totalGastos, p.totalGastos).toFixed(1)}%`,
         `Pérdidas,${p.perdidas},${a.perdidas},${calcVariacion(a.perdidas, p.perdidas).toFixed(1)}%`,
         `Aportes,${p.totalAportes},${a.totalAportes},${calcVariacion(a.totalAportes, p.totalAportes).toFixed(1)}%`,
         `Utilidad Neta,${p.utilidad},${a.utilidad},${calcVariacion(a.utilidad, p.utilidad).toFixed(1)}%`,
      ];
      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `comparativo_${MESES[mesA.month]}_${mesA.year}_vs_${MESES[mesB.month]}_${mesB.year}.csv`;
      link.click();
   };

   if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

   const { actual, anterior } = datos || {};

   // All categories from both months
   const todasCategorias = datos
      ? [...new Set([...Object.keys(actual.categorias), ...Object.keys(anterior.categorias)])]
         .sort((a, b) => (actual.categorias[b] || 0) - (actual.categorias[a] || 0))
      : [];

   const maxCategoria = datos
      ? Math.max(...todasCategorias.map(c => Math.max(actual.categorias[c] || 0, anterior.categorias[c] || 0)), 1)
      : 1;

   return (
      <div className="min-h-screen bg-transparent pb-12">
         <div className="w-full">

            {/* Header */}
            <div className="flex items-center justify-between mb-8 gap-4">
               <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Comparativo Mensual</h1>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
                     Evolución • <span className="text-slate-400">{selectedStore.tienda.nombre}</span>
                  </p>
               </div>
               <div className="flex items-center gap-3 shrink-0">
                  <button
                     onClick={generarComparativo}
                     className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
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
                           {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
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
                           {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                              <option key={y} value={y}>{y}</option>
                           ))}
                        </select>
                     </div>
                  </div>
               </div>
            </div>

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
                        <p className="text-[9px] font-bold text-slate-400 mb-2">Ant: {formatMoney(anterior.totalVendido)}</p>
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
                        <p className="text-[9px] font-bold text-slate-400 mb-2">Ant: {formatMoney(anterior.intereses)}</p>
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
                        <p className="text-[9px] font-bold text-slate-400 mb-2">Ant: {formatMoney(anterior.totalGastos + anterior.perdidas)}</p>
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
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-white/20`}>
                                 {calcVariacion(actual.utilidad, anterior.utilidad) > 0 ? <FiArrowUp size={10} /> : calcVariacion(actual.utilidad, anterior.utilidad) < 0 ? <FiArrowDown size={10} /> : <FiMinus size={10} />}
                                 {Math.abs(calcVariacion(actual.utilidad, anterior.utilidad)).toFixed(1)}%
                              </span>
                           </div>
                           <p className="text-lg md:text-2xl font-black tracking-tighter mb-0.5">
                              {formatMoney(actual.utilidad)}
                           </p>
                           <p className="text-[9px] font-bold text-white/60 mb-2">Ant: {formatMoney(anterior.utilidad)}</p>
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
                        <p className="text-[9px] font-bold text-slate-400 mt-1">Ant: {anterior.cantidadVentas}</p>
                     </div>

                     <div className="glass p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-white/60 dark:border-slate-800">
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Aportes Capital</p>
                        <div className="flex items-baseline gap-2">
                           <p className="text-lg md:text-xl font-black text-slate-800 dark:text-white">{formatMoney(actual.totalAportes)}</p>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mt-1">Ant: {formatMoney(anterior.totalAportes)}</p>
                     </div>

                     <div className="glass p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-white/60 dark:border-slate-800">
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Margen Neto</p>
                        <div className="flex items-baseline gap-2">
                           <p className={`text-lg md:text-xl font-black ${actual.margen >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {actual.margen.toFixed(1)}%
                           </p>
                           <VariacionBadge valor={actual.margen - anterior.margen} />
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mt-1">Ant: {anterior.margen.toFixed(1)}%</p>
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
                              {MESES[mesA.month]} vs {MESES[mesB.month]} {mesB.year}
                           </p>
                        </div>
                     </div>

                     {/* Desktop */}
                     <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border-collapse">
                           <thead>
                              <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                                 <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Métrica</th>
                                 <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{MESES[mesA.month]}</th>
                                 <th className="px-6 py-5 text-right text-[10px] font-black text-indigo-500 uppercase tracking-[0.15em]">{MESES[mesB.month]}</th>
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
                              <div className="flex items-baseline justify-between">
                                 <p className="text-[10px] font-bold text-slate-400">{formatMoney(row.ant)}</p>
                                 <p className={`text-base font-black tracking-tight ${row.highlight
                                    ? (row.act >= 0 ? "text-emerald-600" : "text-rose-600")
                                    : "text-slate-800 dark:text-white"
                                    }`}>
                                    {formatMoney(row.act)}
                                 </p>
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
                              <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Gastos por Categoría</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Distribución comparativa</p>
                           </div>
                        </div>

                        <div className="p-6 md:p-8 space-y-5">
                           {/* Legend */}
                           <div className="flex items-center gap-6 mb-2">
                              <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-sm" />
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{MESES[mesA.month]}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 bg-indigo-500 rounded-sm" />
                                 <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{MESES[mesB.month]}</span>
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
                                       <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{cat}</p>
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
