import { useState, useEffect } from "react";
import {
  FiPieChart,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiCreditCard,
} from "react-icons/fi";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function GraficoDona({ data }) {
  const [activeTab, setActiveTab] = useState("mes");
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!data || !data.tienda) return;

    // Calcular datos según la pestaña activa
    let utilidad, gastos, perdidas, ventasNetas, aportes, retiros;

    switch (activeTab) {
      case "mes":
        aportes = data.tienda.aportes_mes || 0;
        gastos = data.tienda.gastos_mes || 0;
        retiros = data.tienda.utilidades_mes || 0;
        perdidas = 0;
        utilidad = data.tienda.utilidad_estimada_mes || 0;
        ventasNetas = data.tienda.ventas_netas_mes || 0;
        break;
      case "ano":
        aportes = data.tienda.aportes_ano || 0;
        gastos = data.tienda.gastos_ano || 0;
        utilidad = data.tienda.utilidad_estimada_ano || 0;
        perdidas = data.tienda.perdidas_ano || 0;
        retiros = data.tienda.utilidades_ano || 0;
        ventasNetas = data.tienda.ventas_netas_ano || 0;
        break;
      default:
        // En general, usamos utilidad real (ingresos por ventas finalizadas)
        utilidad = data.tienda.ingresos_ventas_finalizadas || 0;
        aportes = data.tienda.inversion || 0;
        gastos = data.tienda.gastos || 0;
        retiros = data.tienda.utilidades || 0;
        perdidas = data.tienda.perdidas || 0;
        ventasNetas = data.tienda.ventas_netas || 0;
    }

    // Calcular beneficio neto
    const beneficioNeto = utilidad - gastos - perdidas;

    // Colores profesionales para el gráfico
    const colors = {
      utilidad: "rgba(16, 185, 129, 0.9)", // Verde para utilidades
      gastos: "rgba(239, 68, 68, 0.9)", // Rojo para gastos
      retiros: "rgba(139, 92, 246, 0.9)", // Morado para retiros
      perdidas: "rgba(220, 38, 38, 0.9)", // Rojo oscuro para pérdidas
      aportes: "rgba(59, 130, 246, 0.9)", // Azul para aportes
    };

    // Determinar la etiqueta de utilidad según la pestaña
    const utilidadLabel =
      activeTab === "general" ? "Utilidad Real" : "Utilidad Estimada";

    // Datos para el gráfico de dona
    const chartDataConfig = {
      labels: [
        utilidadLabel,
        "Gastos",
        "Retiros Socios",
        "Pérdidas",
        "Aportes",
      ],
      datasets: [
        {
          data: [utilidad, gastos, retiros, perdidas, aportes],
          backgroundColor: [
            colors.utilidad,
            colors.gastos,
            colors.retiros,
            colors.perdidas,
            colors.aportes,
          ],
          borderColor: [
            "rgba(16, 185, 129, 1)",
            "rgba(239, 68, 68, 1)",
            "rgba(139, 92, 246, 1)",
            "rgba(220, 38, 38, 1)",
            "rgba(59, 130, 246, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };

    setChartData({
      chartData: chartDataConfig,
      utilidad,
      gastos,
      retiros,
      perdidas,
      beneficioNeto,
      ventasNetas,
      margen: utilidad > 0 ? (beneficioNeto / utilidad) * 100 : 0,
      utilidadLabel,
    });
  }, [data, activeTab]);

  if (!chartData) {
    return (
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="ml-4 text-gray-600 mt-3">Cargando gráfico...</p>
        </div>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.label || "";
            if (label) {
              label += ": ";
            }
            label += "$" + new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(context.raw);
            return label;
          },
        },
      },
    },
  };

  // Función para formatear números en millones o miles
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "$0";

    const numValue = parseFloat(value);
    if (numValue >= 1000000) {
      return "$" + (numValue / 1000000).toFixed(1) + "M";
    } else if (numValue >= 1000) {
      return "$" + (numValue / 1000).toFixed(1) + "K";
    }
    return "$" + numValue.toFixed(0);
  };

  return (
    <div className="lg:col-span-2 glass rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] border-indigo-500/10 group">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-2xl">
              <FiPieChart className="text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform" />
            </div>
            Inteligencia Financiera
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 ml-1">Análisis de Rendimiento</p>
        </div>
        
        <div className="flex p-1.5 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md rounded-[1.25rem] border border-slate-200/50 dark:border-slate-700/50 self-end sm:self-auto">
          {["mes", "ano", "general"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                activeTab === tab
                  ? "bg-white dark:bg-slate-700 shadow-xl shadow-indigo-500/10 text-indigo-600 dark:text-indigo-300 scale-105"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tab === "ano" ? "Año" : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Chart Viewport */}
        <div className="lg:col-span-2 relative min-h-[300px] flex items-center justify-center">
          <div className="w-full h-full absolute inset-0 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="relative w-full h-[320px]">
            <Doughnut 
              data={chartData.chartData} 
              options={{
                ...options,
                cutout: '75%',
                plugins: {
                  ...options.plugins,
                  legend: { display: false }
                }
              }} 
            />
            {/* Center Summary */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Utilidad</span>
              <span className={`text-2xl font-black ${chartData.beneficioNeto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {formatCurrency(chartData.beneficioNeto)}
              </span>
              <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 mt-1">
                {chartData.margen.toFixed(1)}% Margen
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Panel */}
        <div className="lg:col-span-3 space-y-3">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Desglose de Operación</p>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50 hover:border-indigo-500/20 transition-colors">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Input Total</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
               </div>
               <p className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(chartData.utilidad)}</p>
               <span className="text-[9px] font-bold text-slate-400 uppercase">{chartData.utilidadLabel}</span>
             </div>

             <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Egresos</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
               </div>
               <p className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(chartData.gastos)}</p>
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Costos Operativos</span>
             </div>

             <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Retiros</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
               </div>
               <p className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(chartData.retiros)}</p>
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Distribución Socios</span>
             </div>

             <div className={`p-4 rounded-2xl border transition-all ${
               chartData.beneficioNeto >= 0 
                 ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-500/20' 
                 : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-500/20'
             }`}>
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Spread</span>
                 <FiTrendingUp className={chartData.beneficioNeto >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
               </div>
               <p className={`text-xl font-black ${chartData.beneficioNeto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                 {formatCurrency(chartData.beneficioNeto)}
               </p>
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Beneficio Neto Real</span>
             </div>
           </div>

           {/* Inversion Highlights */}
           <div className="mt-6 flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/50">
              <div className="flex items-center gap-3">
                <FiDollarSign className="text-indigo-600" />
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">Inversión / Aportes</span>
              </div>
              <p className="text-lg font-black text-slate-800 dark:text-white">{formatCurrency(chartData.aportes)}</p>
           </div>
        </div>
      </div>

      {/* Liquidity Grid Header */}
      <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800/50">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 text-center sm:text-left">Gestión de Liquidez Instantánea</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative overflow-hidden p-6 rounded-[2rem] bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-800/20 group/card">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/card:scale-125 transition-transform duration-700">
              <FiDollarSign className="text-8xl text-emerald-600" />
            </div>
            <div className="relative">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">Efectivo en Caja</span>
              <p className="text-4xl font-black text-slate-800 dark:text-white mb-2">{"$" + new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.tienda.caja ?? 0)}</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-[9px] font-black text-emerald-700 dark:text-emerald-300 uppercase">Status: Operativo</span>
                <span className="text-[10px] font-bold text-slate-400 italic">Fondos disponibles</span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden p-6 rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-800/20 group/card">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/card:scale-125 transition-transform duration-700">
              <FiCreditCard className="text-8xl text-indigo-600" />
            </div>
            <div className="relative">
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-2">Cartera x Cobrar</span>
              <p className="text-4xl font-black text-slate-800 dark:text-white mb-2">{"$" + new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.tienda.dinero_x_cobrar ?? 0)}</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-[9px] font-black text-indigo-700 dark:text-indigo-300 uppercase">Flujo Pendiente</span>
                <span className="text-[10px] font-bold text-slate-400 italic">Créditos en curso</span>
              </div>
            </div>
          </div>
        </div>

        {/* Liquidity Ratio Analysis */}
        <div className="mt-8 p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Índice de Liquidez Inmediata</span>
              <p className="text-xs text-slate-400">Proporción de efectivo frente a activos totales de corto plazo</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {((data.tienda.caja / (data.tienda.caja + data.tienda.dinero_x_cobrar)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-1 border border-slate-300 dark:border-slate-700">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-1000" 
              style={{ width: `${Math.min(100, (data.tienda.caja / (data.tienda.caja + data.tienda.dinero_x_cobrar)) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
