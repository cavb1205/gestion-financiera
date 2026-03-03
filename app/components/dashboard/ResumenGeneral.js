import { useState } from "react";
import {
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiInfo,
  FiPieChart,
  FiTrendingDown,
  FiUsers,
} from "react-icons/fi";

export default function ResumenGeneral({ tienda }) {
  const [showTooltip, setShowTooltip] = useState(null);
  // Calcular porcentajes en relación a los ingresos por ventas
  const ingresosVentas = tienda.tienda.ingresos_ventas_finalizadas || 0;

  // Función para calcular porcentajes con manejo de ceros
  const calcularPorcentaje = (valor) => {
    if (ingresosVentas === 0) return 0;
    return (valor / ingresosVentas) * 100;
  };

  const porcentajePerdidas = calcularPorcentaje(tienda.tienda.perdidas);
  const porcentajeRetiros = calcularPorcentaje(tienda.tienda.utilidades);
  const porcentajeGastos = calcularPorcentaje(tienda.tienda.gastos);
  const porcentajeAportes = calcularPorcentaje(tienda.tienda.inversion);
  const porcentajePorCobrar = calcularPorcentaje(tienda.tienda.dinero_x_cobrar);

  // Cálculos financieros correctos
  const utilidadNeta =
    ingresosVentas - tienda.tienda.gastos - tienda.tienda.perdidas;
  const balanceNeto = utilidadNeta - tienda.tienda.utilidades;
  const margenNeto =
    ingresosVentas > 0 ? (utilidadNeta / ingresosVentas) * 100 : 0;
  const margenBalance =
    ingresosVentas > 0 ? (balanceNeto / ingresosVentas) * 100 : 0;

  // Función para determinar si mostrar el porcentaje de cambio
  const mostrarCambio = (valor) => {
    return valor !== 0;
  };

  // Estos son valores de ejemplo - en una implementación real deberían calcularse
  const cambioPerdidas = mostrarCambio(tienda.tienda.perdidas) ? -3.7 : null;
  const cambioRetiros = mostrarCambio(tienda.tienda.utilidades) ? 4.2 : null;
  const cambioGastos = mostrarCambio(tienda.tienda.gastos) ? -1.1 : null;
  const cambioAportes = mostrarCambio(tienda.tienda.inversion) ? 2.3 : null;
  const cambioPorCobrar = mostrarCambio(tienda.tienda.dinero_x_cobrar)
    ? 3.7
    : null;

  return (
    <div className="glass rounded-[2.5rem] p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 border-indigo-500/10 group mb-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-2xl">
              <FiPieChart className="text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform" />
            </div>
            Balance Consolidado
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 ml-1">Vista Histórica General</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/50">
          Total Store
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Ingresos por Ventas Finalizadas */}
        <div className="relative overflow-hidden p-6 rounded-[2rem] bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/50 group/card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
              <FiCheckCircle className="text-emerald-500 text-2xl" />
            </div>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-100/50 dark:bg-emerald-900/40 px-3 py-1 rounded-full">
              {ingresosVentas > 0 ? "Activo" : "N/A"}
            </span>
          </div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ingresos x Ventas</h3>
          <p className="text-3xl font-black text-slate-800 dark:text-white mb-4">
            ${ingresosVentas.toLocaleString()}
          </p>
          <div className="h-1.5 w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-full"></div>
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 uppercase">Referencia Base 100%</p>
        </div>

        {/* Pérdidas */}
        <div className="relative overflow-hidden p-6 rounded-[2rem] bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800/50 group/card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
              <FiTrendingDown className="text-rose-500 text-2xl" />
            </div>
            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase bg-rose-100/50 dark:bg-rose-900/40 px-3 py-1 rounded-full">
               Descuento
            </span>
          </div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pérdidas Totales</h3>
          <p className="text-3xl font-black text-slate-800 dark:text-white mb-4">
            ${tienda.tienda.perdidas.toLocaleString()}
          </p>
          <div className="h-1.5 w-full bg-rose-100 dark:bg-rose-900/30 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${Math.min(100, porcentajePerdidas)}%` }}></div>
          </div>
          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-2 uppercase">{porcentajePerdidas.toFixed(1)}% del Ingreso</p>
        </div>

        {/* Retiros de Socios */}
        <div className="relative overflow-hidden p-6 rounded-[2rem] bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-800/50 group/card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
              <FiUsers className="text-purple-500 text-2xl" />
            </div>
            <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase bg-purple-100/50 dark:bg-purple-900/40 px-3 py-1 rounded-full">
              Payout
            </span>
          </div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Retiros Socios</h3>
          <p className="text-3xl font-black text-slate-800 dark:text-white mb-4">
            ${tienda.tienda.utilidades.toLocaleString()}
          </p>
          <div className="h-1.5 w-full bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${Math.min(100, porcentajeRetiros)}%` }}></div>
          </div>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-2 uppercase">{porcentajeRetiros.toFixed(1)}% del Ingreso</p>
        </div>

        {/* Gastos */}
        <div className="relative overflow-hidden p-6 rounded-[2rem] bg-orange-50/40 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-800/50 group/card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
              <FiCreditCard className="text-orange-500 text-2xl" />
            </div>
            <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase bg-orange-100/50 dark:bg-orange-900/40 px-3 py-1 rounded-full">
              OpEx
            </span>
          </div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gastos Operativos</h3>
          <p className="text-3xl font-black text-slate-800 dark:text-white mb-4">
            ${tienda.tienda.gastos.toLocaleString()}
          </p>
          <div className="h-1.5 w-full bg-orange-100 dark:bg-orange-900/30 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${Math.min(100, porcentajeGastos)}%` }}></div>
          </div>
          <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold mt-2 uppercase">{porcentajeGastos.toFixed(1)}% Costo Operativo</p>
        </div>

        {/* Aportes */}
        <div className="relative overflow-hidden p-6 rounded-[2rem] bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/50 group/card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
              <FiDollarSign className="text-amber-500 text-2xl" />
            </div>
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase bg-amber-100/50 dark:bg-amber-900/40 px-3 py-1 rounded-full">
              Capital
            </span>
          </div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aportes / Inversión</h3>
          <p className="text-3xl font-black text-slate-800 dark:text-white mb-4">
            ${tienda.tienda.inversion.toLocaleString()}
          </p>
          <div className="h-1.5 w-full bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${Math.min(100, porcentajeAportes)}%` }}></div>
          </div>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-2 uppercase">Inyección de Capital</p>
        </div>

        {/* Dinero por cobrar */}
        <div className="relative overflow-hidden p-6 rounded-[2rem] bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/50 group/card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
              <FiClock className="text-blue-500 text-2xl" />
            </div>
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase bg-blue-100/50 dark:bg-blue-900/40 px-3 py-1 rounded-full">
              Pendiente
            </span>
          </div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Por Cobrar Total</h3>
          <p className="text-3xl font-black text-slate-800 dark:text-white mb-4">
            ${tienda.tienda.dinero_x_cobrar.toLocaleString()}
          </p>
          <div className="h-1.5 w-full bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min(100, porcentajePorCobrar)}%` }}></div>
          </div>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-2 uppercase">Cartera Activa</p>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800/50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="flex items-center gap-5 p-6 rounded-[2rem] bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 transition-transform hover:scale-[1.02]">
            <div className="p-4 bg-indigo-500/10 rounded-2xl">
              <FiBarChart2 className="text-indigo-600 dark:text-indigo-400 text-2xl" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilidad Neta</p>
              <p className={`text-2xl font-black ${utilidadNeta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                ${utilidadNeta.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{margenNeto.toFixed(1)}% Margen Operativo</p>
            </div>
          </div>

          <div className="flex items-center gap-5 p-6 rounded-[2rem] bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/10 transition-transform hover:scale-[1.02]">
            <div className="p-4 bg-purple-500/10 rounded-2xl">
              <FiUsers className="text-purple-600 dark:text-purple-400 text-2xl" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Retirado</p>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-400">
                ${tienda.tienda.utilidades.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Distribución Acumulada</p>
            </div>
          </div>

          <div className="flex items-center gap-5 p-6 rounded-[2rem] bg-slate-800/5 dark:bg-slate-100/10 border border-slate-200 dark:border-slate-800/50 transition-transform hover:scale-[1.02]">
            <div className="p-4 bg-slate-800/10 dark:bg-slate-100/10 rounded-2xl">
              <FiPieChart className="text-slate-600 dark:text-slate-400 text-2xl" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance Neto</p>
              <p className={`text-2xl font-black ${balanceNeto >= 0 ? "text-slate-800 dark:text-white" : "text-rose-600"}`}>
                ${balanceNeto.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{margenBalance.toFixed(1)}% Spread Final</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center sm:justify-start">
          <div className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${
            balanceNeto >= 0
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800"
          }`}>
            Status del Negocio: {balanceNeto >= 0 ? "Operativo Rentable" : "En Déficit"}
          </div>
        </div>
      </div>
    </div>
  );
}
