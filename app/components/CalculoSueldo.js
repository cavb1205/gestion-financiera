// app/components/CalculoSueldo.js
"use client";

import { useState, useEffect } from "react";
import { 
  FiDollarSign, 
  FiCalendar, 
  FiPercent, 
  FiRefreshCw,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiTarget,
  FiUserCheck,
  FiPieChart,
  FiArrowUpRight
} from "react-icons/fi";

const CalculoSueldo = ({ tienda, token }) => {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [porcentaje, setPorcentaje] = useState(3.0);
  const [resultados, setResultados] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMondayOfCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  };

  useEffect(() => {
    const lunes = getMondayOfCurrentWeek();
    const sabado = new Date(lunes);
    sabado.setDate(lunes.getDate() + 5);
    setFechaInicio(getLocalDateString(lunes));
    setFechaFin(getLocalDateString(sabado));
  }, []);

  const resetearFormulario = () => {
    setResultados(null);
    setError("");
    const lunes = getMondayOfCurrentWeek();
    const sabado = new Date(lunes);
    sabado.setDate(lunes.getDate() + 5);
    setFechaInicio(getLocalDateString(lunes));
    setFechaFin(getLocalDateString(sabado));
    setPorcentaje(3.0);
  };

  const calcularSueldo = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recaudos/sueldo/${fechaInicio}/${fechaFin}/${porcentaje}/t/${tienda.tienda.id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Error al calcular el sueldo");
      const data = await response.json();
      setResultados(data);
    } catch (err) {
      setError("Fallo en la sincronización de recaudos. Verifique el periodo.");
    } finally {
      setCargando(false);
    }
  };

  const formatDisplayDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMoney = (amount) => {
    return "$" + new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
  };

  return (
    <div className="space-y-8">
      {/* Input Form Card */}
      <div className="glass p-8 md:p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                   <FiTarget size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Parámetros de Liquidación</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración del Ciclo Laboral</p>
                </div>
             </div>
             <button
              onClick={resetearFormulario}
              className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-indigo-600 transition-all shadow-sm"
              title="Reiniciar Filtros"
            >
              <FiRefreshCw size={18} />
            </button>
          </div>

          <form onSubmit={calcularSueldo} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Apertura (Lunes)</label>
                  <div className="relative group">
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full px-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                      required
                    />
                  </div>
               </div>
               
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Cierre (Sábado)</label>
                  <div className="relative group">
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full px-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                      required
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tasa de Comisión (%)</label>
                  <div className="relative group">
                    <FiPercent className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={porcentaje}
                      onChange={(e) => setPorcentaje(parseFloat(e.target.value))}
                      className="w-full pl-14 pr-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner"
                      required
                    />
                  </div>
               </div>
            </div>

            <button 
              type="submit" 
              disabled={cargando}
              className="w-full flex items-center justify-center gap-4 px-10 py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {cargando ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiTrendingUp size={20} />
                  Ejecutar Liquidación Semanal
                </>
              )}
            </button>
          </form>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px]"></div>
      </div>

      {error && (
        <div className="p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-[2rem] flex items-center gap-4 text-rose-600">
           <FiAlertCircle size={24} />
           <p className="text-sm font-black uppercase tracking-widest leading-none">{error}</p>
        </div>
      )}

      {/* Results Display */}
      {resultados && (
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 flex items-center justify-between group overflow-hidden relative">
                <div className="relative z-10">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">Total Recaudado</p>
                   <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter shadow-indigo-100">
                      {formatMoney(resultados.total_recaudado)}
                   </h3>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl relative z-10">
                   <FiDollarSign size={32} />
                </div>
                <div className="absolute -right-5 -bottom-5 text-slate-50 dark:text-white/5 opacity-50 group-hover:scale-110 transition-transform">
                   <FiPieChart size={120} />
                </div>
             </div>

             <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 flex items-center justify-between group overflow-hidden relative">
                <div className="relative z-10">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">Sueldo Calculado</p>
                   <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                      {formatMoney(resultados.sueldo_calculado)}
                   </h3>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl relative z-10">
                   <FiUserCheck size={32} />
                </div>
                <div className="absolute -right-5 -bottom-5 text-slate-50 dark:text-white/5 opacity-50 group-hover:scale-110 transition-transform">
                   <FiTrendingUp size={120} />
                </div>
             </div>
          </div>

          <div className="glass rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl">
             <div className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] leading-none">Certificación de Liquidación</h4>
                <div className="flex items-center gap-2">
                   <FiCheckCircle className="text-emerald-500" />
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verificado</span>
                </div>
             </div>
             
             <div className="p-10 divide-y divide-slate-100 dark:divide-slate-800">
                <div className="pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rango de Auditoría</span>
                   <span className="text-xs font-black text-slate-800 dark:text-white uppercase text-right tracking-tight">
                      {formatDisplayDate(resultados.fecha_inicio)} — {formatDisplayDate(resultados.fecha_fin)}
                   </span>
                </div>
                
                <div className="py-6 flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base de Comisión</span>
                   <span className="text-xs font-black text-slate-800 dark:text-white px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      {resultados.porcentaje_aplicado}% sobre recaudos
                   </span>
                </div>
                
                <div className="py-6 flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volumen Transaccional</span>
                   <span className="text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl">
                      {resultados.cantidad_recaudos} Registros Sincronizados
                   </span>
                </div>
                
                <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
                   <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Monto Neto a Pagar</p>
                      <h4 className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                         {formatMoney(resultados.sueldo_calculado)}
                      </h4>
                   </div>
                   <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-3 px-8 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                   >
                      <FiInfo size={16} />
                      Exportar Resumen
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculoSueldo;