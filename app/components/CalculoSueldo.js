// app/components/CalculoSueldo.js
"use client";

import { useState, useEffect } from "react";
import {
  FiDollarSign,
  FiPercent,
  FiRefreshCw,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiUserCheck,
  FiCalendar,
  FiHash,
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
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
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
    setResultados(null);

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
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatMoney = (amount) =>
    "$" + new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);

  const comisionRatio = resultados && resultados.total_recaudado > 0
    ? (resultados.sueldo_calculado / resultados.total_recaudado) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <div className="glass p-6 md:p-8 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Parámetros</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ciclo Laboral</p>
            </div>
            <button
              onClick={resetearFormulario}
              className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:text-indigo-600 transition-all active:scale-95"
              title="Reiniciar"
            >
              <FiRefreshCw size={16} />
            </button>
          </div>

          <form onSubmit={calcularSueldo} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desde</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasta</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tasa de Comisión</label>
              <div className="relative">
                <FiPercent className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={porcentaje}
                  onChange={(e) => setPorcentaje(parseFloat(e.target.value))}
                  onWheel={(e) => e.target.blur()}
                  className="w-full pl-12 pr-16 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[15px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                  required
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[11px] font-black text-slate-400 uppercase tracking-widest">% comis.</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
            >
              {cargando ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><FiTrendingUp size={18} /> Calcular Sueldo</>
              )}
            </button>
          </form>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      {error && (
        <div className="p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center gap-3 text-rose-600">
          <FiAlertCircle size={20} className="shrink-0" />
          <p className="text-[11px] font-black uppercase tracking-widest leading-none">{error}</p>
        </div>
      )}

      {/* Results */}
      {resultados && (
        <div className="space-y-5">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass p-6 rounded-[2rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">Total Recaudado</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">
                {formatMoney(resultados.total_recaudado)}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <FiHash size={11} />
                {resultados.cantidad_recaudos} recaudos
              </div>
              <FiDollarSign className="absolute -right-3 -bottom-3 text-slate-100 dark:text-white/5" size={80} />
            </div>

            <div className="glass p-6 rounded-[2rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">Sueldo a Pagar</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                {formatMoney(resultados.sueldo_calculado)}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                <FiPercent size={11} />
                {resultados.porcentaje_aplicado}% aplicado
              </div>
              <FiUserCheck className="absolute -right-3 -bottom-3 text-slate-100 dark:text-white/5" size={80} />
            </div>
          </div>

          {/* Detail card */}
          <div className="glass rounded-[2rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-xl">
            <div className="px-7 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-emerald-500" size={16} />
                <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Liquidación Verificada</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {formatDisplayDate(resultados.fecha_inicio)} — {formatDisplayDate(resultados.fecha_fin)}
              </span>
            </div>

            <div className="p-7 space-y-5">
              {/* Commission formula */}
              <div className="p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Fórmula Aplicada</p>
                <p className="text-sm font-black text-indigo-700 dark:text-indigo-300 tracking-tight">
                  {formatMoney(resultados.total_recaudado)}
                  <span className="text-indigo-400 mx-2">×</span>
                  {resultados.porcentaje_aplicado}%
                  <span className="text-indigo-400 mx-2">=</span>
                  <span className="text-indigo-600">{formatMoney(resultados.sueldo_calculado)}</span>
                </p>
              </div>

              {/* Ratio bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comisión sobre Total</p>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{comisionRatio.toFixed(1)}%</p>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(comisionRatio, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-black text-slate-300 uppercase tracking-widest">
                  <span>$0</span>
                  <span>{formatMoney(resultados.total_recaudado)}</span>
                </div>
              </div>

              {/* Final amount */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Neto a Pagar</p>
                  <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                    {formatMoney(resultados.sueldo_calculado)}
                  </p>
                </div>
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <FiUserCheck size={28} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculoSueldo;
