// app/components/dashboard/ResumenAnual.js
"use client";

import {
  FiPieChart,
  FiDollarSign,
  FiTrendingDown,
  FiTrendingUp,
  FiInfo,
  FiCreditCard,
  FiUsers,
  FiCalculator,
  FiAward,
  FiCalendar,
  FiAlertTriangle,
} from "react-icons/fi";
import { useState } from "react";

const formatMoney = (amount) => "$" + new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount ?? 0);

export default function ResumenAnual({ tienda, loading = false }) {
  const [showTooltip, setShowTooltip] = useState(null);

  // Calcular utilidad del año (20% de las ventas netas menos gastos y pérdidas)
  const utilidadBruta = tienda ? tienda.tienda.utilidad_estimada_ano : 0;
  const utilidadAnual = tienda
    ? utilidadBruta - tienda.tienda.gastos_ano - (tienda.tienda.perdidas_ano || 0)
    : 0;

  // Ganancias retiradas por socios (utilidades registradas)
  const gananciasRetiradas = tienda ? tienda.tienda.utilidades_ano : 0;

  // Calcular margen de utilidad anual
  const margenUtilidadAnual =
    tienda && tienda.tienda.ventas_netas_ano > 0
      ? (utilidadAnual / tienda.tienda.ventas_netas_ano) * 100
      : 0;

  // Diferencia entre ganancias retiradas y utilidad del año
  const diferencia = utilidadAnual - gananciasRetiradas;
  const porcentajeDiferencia =
    utilidadAnual !== 0 ? (diferencia / utilidadAnual) * 100 : 0;

  // Calcular proporciones para la barra de distribución
  const totalDistribucion = Math.abs(tienda?.tienda.gastos_ano || 0) + 
                           Math.abs(utilidadAnual) + 
                           Math.abs(tienda?.tienda.perdidas_ano || 0);
  
  const porcentajeGastos = totalDistribucion > 0 
    ? (Math.abs(tienda?.tienda.gastos_ano || 0) / totalDistribucion) * 100 
    : 0;
    
  const porcentajeUtilidad = totalDistribucion > 0 
    ? (Math.abs(utilidadAnual) / totalDistribucion) * 100 
    : 0;
    
  const porcentajePerdidas = totalDistribucion > 0 
    ? (Math.abs(tienda?.tienda.perdidas_ano || 0) / totalDistribucion) * 100 
    : 0;

  // Obtener el año actual
  const añoActual = new Date().getFullYear();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-purple-500">
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
    <div className="glass rounded-[2rem] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 border-purple-500/10 group h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FiPieChart className="text-purple-500 group-hover:scale-110 transition-transform" />
            Balance Anual
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Visión de Largo Plazo</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter">
          Año {añoActual}
        </div>
      </div>

      <div className="space-y-6">
        {/* Main Annual Sales KPI */}
        <div className="relative p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800/50">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
              Ventas Consolidadas
            </h3>
            <FiAward className="text-purple-500 text-lg" />
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white">
            {formatMoney(tienda.tienda.ventas_netas_ano ?? 0)}
          </p>
        </div>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Egresos Año</span>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400">
              {formatMoney(tienda.tienda.gastos_ano ?? 0)}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">U. Bruta</span>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {formatMoney(utilidadBruta)}
            </p>
          </div>
        </div>

        {/* Net Profit Core Area */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-100 dark:border-purple-800/40">
            <div>
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest block mb-1">Utilidad Neta Anual</span>
              <p className={`text-2xl font-black ${utilidadAnual >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {formatMoney(utilidadAnual)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Margen Anual</span>
              <span className={`text-sm font-black px-2 py-1 rounded-lg ${utilidadAnual >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {Math.abs(margenUtilidadAnual).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Financial Distribution Bar */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <span>Performance Anual</span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
          </div>
          {totalDistribucion > 0 ? (
            <div className="space-y-4">
              <div className="h-6 w-full bg-slate-100/30 dark:bg-slate-800/50 rounded-2xl flex overflow-hidden p-1.5 border border-white/40 dark:border-slate-700/50 backdrop-blur-md">
                <div className="bg-rose-500 rounded-lg h-full transition-all duration-1000 shadow-[0_0_20px_rgba(239,68,68,0.4)]" style={{ width: `${porcentajeGastos}%` }}></div>
                <div className="bg-orange-400 rounded-lg h-full transition-all duration-1000 mx-1 shadow-[0_0_20px_rgba(251,146,60,0.4)]" style={{ width: `${porcentajePerdidas}%` }}></div>
                <div className="bg-emerald-500 rounded-lg h-full transition-all duration-1000 shadow-[0_0_20px_rgba(16,185,129,0.4)]" style={{ width: `${porcentajeUtilidad}%` }}></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/60 dark:border-slate-800/50 text-center">
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Gastos</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{porcentajeGastos.toFixed(0)}%</p>
                </div>
                <div className="p-3 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/60 dark:border-slate-800/50 text-center">
                  <p className="text-[9px] font-black text-orange-400 uppercase tracking-tighter">Pérdidas</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{porcentajePerdidas.toFixed(0)}%</p>
                </div>
                <div className="p-3 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/60 dark:border-slate-800/50 text-center">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Utilidad</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{porcentajeUtilidad.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-white/20 dark:bg-slate-900/40 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 backdrop-blur-sm">
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Datos Insuficientes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}