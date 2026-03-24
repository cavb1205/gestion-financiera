// app/components/dashboard/ResumenDia.js
"use client";

import {
  FiCalendar,
  FiDollarSign,
  FiTrendingDown,
  FiTrendingUp,
  FiInfo,
  FiCreditCard,
  FiUsers,
  FiActivity,
} from "react-icons/fi";
import { useState } from "react";
import { formatMoney } from "../../utils/format";

export default function ResumenDia({ tienda, loading = false }) {
  const [showTooltip, setShowTooltip] = useState(null);

  // Calcular utilidad del día (20% de las ventas netas menos gastos)
  const utilidadDia = tienda
    ? tienda.tienda.utilidad_estimada_dia - tienda.tienda.gastos_dia
    : 0;

  // Ganancias retiradas por socios (utilidades registradas)
  const gananciasRetiradas = tienda ? tienda.tienda.utilidades_dia : 0;

  // Calcular margen de utilidad
  const margenUtilidad =
    tienda && tienda.tienda.ventas_netas_dia > 0
      ? (utilidadDia / tienda.tienda.ventas_netas_dia) * 100
      : 0;

  // Diferencia entre ganancias retiradas y utilidad del día
  const diferencia = utilidadDia - gananciasRetiradas;
  const porcentajeDiferencia =
    utilidadDia !== 0 ? (diferencia / utilidadDia) * 100 : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-green-500">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex justify-between items-center">
              <div className="w-2/3">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
              <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-[2rem] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 border-emerald-500/10 group">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FiCalendar className="text-emerald-500 group-hover:scale-110 transition-transform" />
            Flujo del Día
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control de Caja</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter">
          {new Date().toLocaleDateString("es-ES", { day: '2-digit', month: 'short' })}
        </div>
      </div>

      <div className="space-y-6">
        {/* Recaudos del día - Main KPI */}
        <div className="relative p-6 rounded-[2rem] bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/20 dark:to-teal-500/10 border border-emerald-500/20 group/item overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover/item:scale-150 transition-transform duration-700"></div>
          <div className="relative flex justify-between items-start mb-2">
            <h3 className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
              Recaudos en Caja
              <FiInfo className="text-[10px] opacity-50 cursor-help" />
            </h3>
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <FiDollarSign className="text-emerald-600 dark:text-emerald-400 text-lg" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white relative">
            {formatMoney(tienda.tienda.recaudos_dia ?? 0)}
          </p>
          <div className="absolute bottom-4 right-6 opacity-20 group-hover/item:opacity-40 transition-opacity">
            <FiTrendingUp size={48} className="text-emerald-500" />
          </div>
        </div>

        {/* Financial Flow Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-[1.75rem] bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/50 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <FiTrendingUp className="text-blue-600 dark:text-blue-400 text-xs" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas</span>
            </div>
            <p className="text-xl font-black text-slate-800 dark:text-slate-100">
              {formatMoney(tienda.tienda.ventas_netas_dia ?? 0)}
            </p>
          </div>

          <div className="p-5 rounded-[1.75rem] bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-slate-800/50 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <FiTrendingDown className="text-rose-600 dark:text-rose-400 text-xs" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gastos</span>
            </div>
            <p className="text-xl font-black text-slate-800 dark:text-slate-100">
              {formatMoney(tienda.tienda.gastos_dia ?? 0)}
            </p>
          </div>
        </div>

        {/* Profit Highlights */}
        <div className="pt-8 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Spread Diario</h3>
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-black ${utilidadDia >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                  {formatMoney(utilidadDia)}
                </p>
                {margenUtilidad !== 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${margenUtilidad >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                    {margenUtilidad >= 0 ? '+' : ''}{margenUtilidad.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className={`p-4 rounded-[1.5rem] ${utilidadDia >= 0 ? "bg-emerald-500" : "bg-rose-500"} shadow-xl ${utilidadDia >= 0 ? "shadow-emerald-500/30" : "shadow-rose-500/30"} scale-110`}>
              <FiActivity className="text-white text-xl" />
            </div>
          </div>
        </div>

        {/* Secondary Operations */}
        {(gananciasRetiradas > 0 || tienda.tienda.aportes_dia > 0) && (
          <div className="flex flex-col gap-3 mt-6">
            {gananciasRetiradas > 0 && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-900/20 border border-purple-500/10">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-purple-500/20 rounded-lg">
                    <FiUsers className="text-purple-600 dark:text-purple-400 text-sm" />
                  </div>
                  <span className="text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest">Payout Socios</span>
                </div>
                <span className="text-sm font-black text-purple-600 dark:text-purple-300">-{formatMoney(gananciasRetiradas)}</span>
              </div>
            )}
            {tienda.tienda.aportes_dia > 0 && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-900/20 border border-indigo-500/10">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                    <FiCreditCard className="text-indigo-600 dark:text-indigo-400 text-sm" />
                  </div>
                  <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">Inyección K</span>
                </div>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-300">+{formatMoney(tienda.tienda.aportes_dia)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
