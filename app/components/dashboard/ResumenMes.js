// app/components/dashboard/ResumenMes.js
"use client";

import {
  FiBarChart2,
  FiCreditCard,
  FiTrendingDown,
  FiTrendingUp,
  FiInfo,
  FiDollarSign,
  FiCalculator,
  FiUsers,
  FiCalendar,
  FiAlertTriangle
} from "react-icons/fi";
import { useState } from "react";
import { formatMoney } from "../../utils/format";

export default function ResumenMes({ tienda, loading = false }) {
  const [showTooltip, setShowTooltip] = useState(null);
  
  // Calcular utilidad bruta (20% de ventas netas)
  const utilidadBruta = tienda ? tienda.tienda.utilidad_estimada_mes : 0;
  
  // Calcular utilidad del período (20% de ventas netas menos gastos y pérdidas)
  const utilidadPeriodo = tienda 
    ? utilidadBruta - tienda.tienda.gastos_mes - (tienda.tienda.perdidas_mes || 0)
    : 0;
  
  // Ganancias retiradas por socios (utilidades registradas)
  const gananciasRetiradas = tienda ? tienda.tienda.utilidades_mes : 0;
  
  // Calcular margen de utilidad
  const margenUtilidad = tienda && tienda.tienda.ventas_netas_mes > 0 
    ? (utilidadPeriodo / tienda.tienda.ventas_netas_mes) * 100 
    : 0;

  // Diferencia entre ganancias retiradas y utilidad del período
  const diferencia = utilidadPeriodo - gananciasRetiradas;
  const porcentajeDiferencia = utilidadPeriodo !== 0 
    ? (diferencia / utilidadPeriodo) * 100 
    : 0;

  // Calcular proporciones para la barra de distribución
  const totalDistribucion = Math.abs(tienda?.tienda.gastos_mes || 0) + 
                           Math.abs(utilidadPeriodo) + 
                           Math.abs(tienda?.tienda.perdidas_mes || 0);
  
  const porcentajeGastos = totalDistribucion > 0 
    ? (Math.abs(tienda?.tienda.gastos_mes || 0) / totalDistribucion) * 100 
    : 0;
    
  const porcentajeUtilidad = totalDistribucion > 0 
    ? (Math.abs(utilidadPeriodo) / totalDistribucion) * 100 
    : 0;
    
  const porcentajePerdidas = totalDistribucion > 0 
    ? (Math.abs(tienda?.tienda.perdidas_mes || 0) / totalDistribucion) * 100 
    : 0;

  // Obtener el nombre del mes actual
  const obtenerNombreMes = () => {
    return new Date().toLocaleDateString('es-ES', { month: 'long' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-blue-500">
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
    <div className="glass rounded-[2rem] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 border-blue-500/10 group h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FiBarChart2 className="text-blue-500 group-hover:scale-110 transition-transform" />
            Ventas del Mes
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Rendimiento Mensual</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter">
          {obtenerNombreMes()}
        </div>
      </div>

      <div className="space-y-6">
        {/* Main Monthly Sales KPI */}
        <div className="relative p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/50">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Ventas Netas Totales
            </h3>
            <FiTrendingUp className="text-blue-500 text-lg" />
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white">
            {formatMoney(tienda.tienda.ventas_netas_mes ?? 0)}
          </p>
        </div>

        {/* Secondary Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Egresos</span>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400">
              {formatMoney(tienda.tienda.gastos_mes ?? 0)}
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
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-indigo-950/20 dark:to-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40">
            <div>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">Utilidad Neta</span>
              <p className={`text-2xl font-black ${utilidadPeriodo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {formatMoney(utilidadPeriodo)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Margen</span>
              <span className={`text-sm font-black px-2 py-1 rounded-lg ${utilidadPeriodo >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {Math.abs(margenUtilidad).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Financial Distribution Bar */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <span>Distribución Mensual</span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
          </div>
          {totalDistribucion > 0 ? (
            <div className="space-y-4">
              <div className="h-6 w-full bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl flex overflow-hidden p-1.5 border border-white/50 dark:border-slate-700/50 backdrop-blur-sm">
                <div className="bg-rose-500 rounded-lg h-full transition-all duration-1000 shadow-[0_0_15px_rgba(239,68,68,0.3)]" style={{ width: `${porcentajeGastos}%` }}></div>
                <div className="bg-orange-400 rounded-lg h-full transition-all duration-1000 mx-1 shadow-[0_0_15px_rgba(251,146,60,0.3)]" style={{ width: `${porcentajePerdidas}%` }}></div>
                <div className="bg-emerald-500 rounded-lg h-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.3)]" style={{ width: `${porcentajeUtilidad}%` }}></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/60 dark:border-slate-800/50">
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Gastos</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{porcentajeGastos.toFixed(0)}%</p>
                </div>
                <div className="p-3 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/60 dark:border-slate-800/50">
                  <p className="text-[9px] font-black text-orange-400 uppercase tracking-tighter">Pérdidas</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{porcentajePerdidas.toFixed(0)}%</p>
                </div>
                <div className="p-3 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/60 dark:border-slate-800/50">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Utilidad</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white">{porcentajeUtilidad.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-white/20 dark:bg-slate-900/40 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800 backdrop-blur-md">
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Análisis Pendiente</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}