// app/dashboard/reportes/utilidad/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiBarChart2,
  FiPercent,
  FiActivity,
  FiInfo,
  FiTarget,
} from "react-icons/fi";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function ReportesPage() {
  const { selectedStore, token, isAuthenticated, loading: authLoading } = useAuth();
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [datosReporte, setDatosReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

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
  }, []);

  const generarReporte = async (e) => {
    if (e) e.preventDefault();
    setCargando(true);
    setError("");
    setDatosReporte(null);

    try {
      if (new Date(fechaInicio) > new Date(fechaFin)) {
        throw new Error("La fecha de inicio no puede ser mayor que la fecha de fin");
      }

      const [ventasRes, gastosRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/ventas/list/${fechaInicio}/${fechaFin}/t/${selectedStore.tienda.id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/gastos/list/${fechaInicio}/${fechaFin}/t/${selectedStore.tienda.id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!ventasRes.ok || !gastosRes.ok) throw new Error("Error al consultar fuentes de datos.");

      const ventasData = await ventasRes.json();
      const gastosData = await gastosRes.json();

      const processed = procesarDatosReporte(Array.isArray(ventasData) ? ventasData : [], Array.isArray(gastosData) ? gastosData : []);
      setDatosReporte(processed);
    } catch (err) {
      setError(err.message || "Fallo en la sincronización de auditoría.");
    } finally {
      setCargando(false);
    }
  };

  const procesarDatosReporte = (ventas, gastos) => {
    const datosPorFecha = {};
    ventas.forEach((venta) => {
      const fecha = venta.fecha_venta;
      if (!datosPorFecha[fecha]) {
        datosPorFecha[fecha] = { fecha, cantidadVentas: 0, totalVendido: 0, interesesGenerados: 0, gastos: 0, perdidas: 0, utilidad: 0 };
      }
      datosPorFecha[fecha].cantidadVentas += 1;
      datosPorFecha[fecha].totalVendido += parseFloat(venta.valor_venta);
      datosPorFecha[fecha].interesesGenerados += (parseFloat(venta.total_a_pagar) - parseFloat(venta.valor_venta));
      if (venta.estado_venta === "Perdida") {
        datosPorFecha[fecha].perdidas += parseFloat(venta.perdida);
      }
    });

    gastos.forEach((gasto) => {
      const fecha = gasto.fecha;
      if (!datosPorFecha[fecha]) {
        datosPorFecha[fecha] = { fecha, cantidadVentas: 0, totalVendido: 0, interesesGenerados: 0, gastos: 0, perdidas: 0, utilidad: 0 };
      }
      datosPorFecha[fecha].gastos += parseFloat(gasto.valor);
    });

    Object.values(datosPorFecha).forEach((datos) => {
      datos.utilidad = datos.interesesGenerados - datos.gastos - datos.perdidas;
    });

    return Object.values(datosPorFecha)
      .filter(f => f.fecha >= fechaInicio && f.fecha <= fechaFin)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  };

  const formatMoney = (amount) => {
    return "$" + new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  const totales = datosReporte ? datosReporte.reduce((acc, curr) => ({
    cantidadVentas: acc.cantidadVentas + curr.cantidadVentas,
    totalVendido: acc.totalVendido + curr.totalVendido,
    interesesGenerados: acc.interesesGenerados + curr.interesesGenerados,
    gastos: acc.gastos + curr.gastos,
    perdidas: acc.perdidas + curr.perdidas,
    utilidad: acc.utilidad + curr.utilidad,
  }), { cantidadVentas: 0, totalVendido: 0, interesesGenerados: 0, gastos: 0, perdidas: 0, utilidad: 0 }) : null;

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full">

        {/* Compact Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Inteligencia de Utilidad</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Rentabilidad • <span className="text-slate-400">{selectedStore.tienda.nombre}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={generarReporte}
              className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
            >
              <FiRefreshCw size={18} className={cargando ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
            </button>
            {datosReporte && (
              <button
                onClick={() => {
                  const csv = ["Fecha,Ventas,Capital,Intereses,Gastos,Perdidas,Utilidad", ...datosReporte.map(r => `${r.fecha},${r.cantidadVentas},${r.totalVendido},${r.interesesGenerados},${r.gastos},${r.perdidas},${r.utilidad}`)].join("\n");
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `utilidad_${fechaInicio}_${fechaFin}.csv`;
                  a.click();
                }}
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                <FiDownload size={16} />
                <span className="hidden md:inline">Exportar</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 mb-8 p-6 md:p-8 shadow-2xl">
          <form onSubmit={generarReporte} className="flex flex-col lg:flex-row items-end gap-6">
            <div className="grid grid-cols-2 gap-4 flex-1 w-full">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Desde</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="block w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hasta</label>
                <input
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
              {cargando ? "Auditando..." : "Generar Reporte"}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-[2rem] flex items-center gap-4 text-rose-600">
            <FiAlertCircle size={20} className="shrink-0" />
            <p className="text-[11px] font-black uppercase tracking-widest leading-none">{error}</p>
          </div>
        )}

        {datosReporte && totales ? (
          <>
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="p-2.5 md:p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl md:rounded-2xl">
                    <FiDollarSign size={20} />
                  </div>
                  <FiTrendingUp className="text-emerald-500" size={16} />
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 select-all">
                  {formatMoney(totales.totalVendido)}
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Capital Colocado</p>
              </div>

              <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="p-2.5 md:p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl md:rounded-2xl">
                    <FiPercent size={20} />
                  </div>
                  <span className="text-[9px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                    {totales.totalVendido > 0 ? ((totales.interesesGenerados / totales.totalVendido) * 100).toFixed(1) : 0}% Yield
                  </span>
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                  {formatMoney(totales.interesesGenerados)}
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Utilidad Bruta</p>
              </div>

              <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="p-2.5 md:p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl md:rounded-2xl">
                    <FiTrendingDown size={20} />
                  </div>
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Egresos</span>
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                  {formatMoney(totales.gastos + totales.perdidas)}
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Carga Ops + Pérdidas</p>
              </div>

              <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border relative overflow-hidden shadow-2xl ${totales.utilidad >= 0 ? 'bg-emerald-600 border-emerald-500 shadow-emerald-200 dark:shadow-none' : 'bg-rose-600 border-rose-500 shadow-rose-200 dark:shadow-none'}`}>
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="p-2.5 md:p-3 bg-white/20 rounded-xl md:rounded-2xl">
                      <FiTarget size={20} />
                    </div>
                    <FiCheckCircle className="opacity-50" size={16} />
                  </div>
                  <p className="text-xl md:text-3xl font-black tracking-tighter mb-1 select-all">
                    {formatMoney(totales.utilidad)}
                  </p>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none opacity-80">Rendimiento Neto</p>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Daily Breakdown */}
              <div className="glass rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl lg:col-span-2">
                <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                    <FiBarChart2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Desglose Cronológico</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Auditando {datosReporte.length} Unidades de Tiempo</p>
                  </div>
                </div>

                {/* Mobile card view */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {datosReporte.map((fila, idx) => (
                    <div key={idx} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{fila.fecha}</p>
                        <p className={`text-sm font-black tracking-tight ${fila.utilidad >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatMoney(fila.utilidad)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                        <span className="text-amber-500">{formatMoney(fila.interesesGenerados)}</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-rose-400">{formatMoney(fila.gastos + fila.perdidas)}</span>
                        {fila.cantidadVentas > 0 && (
                          <span className="ml-auto text-slate-400">{fila.cantidadVentas} mov.</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Totales</p>
                      <p className="text-base font-black text-indigo-600 dark:text-indigo-400">{formatMoney(totales.utilidad)}</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                      <span className="text-amber-500">{formatMoney(totales.interesesGenerados)}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-rose-400">{formatMoney(totales.gastos + totales.perdidas)}</span>
                      <span className="ml-auto text-slate-500">{totales.cantidadVentas} mov.</span>
                    </div>
                  </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Movimientos</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Int. Bruto</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Carga Ops</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Margen Neto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {datosReporte.map((fila, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all">
                          <td className="px-8 py-5 whitespace-nowrap">
                            <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter">{fila.fecha}</p>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black text-slate-600 dark:text-slate-400">
                              {fila.cantidadVentas}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <p className="text-xs font-bold text-amber-600">{formatMoney(fila.interesesGenerados)}</p>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <p className="text-xs font-bold text-rose-500">{formatMoney(fila.gastos + fila.perdidas)}</p>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <p className={`text-sm font-black tracking-tight ${fila.utilidad >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatMoney(fila.utilidad)}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-800">
                      <tr>
                        <td className="px-8 py-6 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Totales Período</td>
                        <td className="px-8 py-6 text-center text-sm font-black text-slate-800 dark:text-white">{totales.cantidadVentas}</td>
                        <td className="px-8 py-6 text-right text-sm font-black text-amber-600">{formatMoney(totales.interesesGenerados)}</td>
                        <td className="px-8 py-6 text-right text-sm font-black text-rose-500">{formatMoney(totales.gastos + totales.perdidas)}</td>
                        <td className="px-8 py-6 text-right text-lg font-black text-indigo-600 dark:text-indigo-400">{formatMoney(totales.utilidad)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Composición de Egresos */}
              <div className="glass p-8 md:p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl">
                <h4 className="text-lg md:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">Composición de Egresos</h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-5 md:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Gastos Operativos</p>
                      <p className="text-xl font-black text-rose-500 tracking-tight">{formatMoney(totales.gastos)}</p>
                    </div>
                    <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                      <FiTrendingDown size={24} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-5 md:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Pérdidas de Cartera</p>
                      <p className="text-xl font-black text-orange-500 tracking-tight">{formatMoney(totales.perdidas)}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
                      <FiAlertCircle size={24} />
                    </div>
                  </div>
                </div>

                <div className="mt-8 px-4 flex items-start gap-4">
                  <FiInfo className="text-slate-300 mt-1 shrink-0" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Los datos son consolidados de la base de auditoría central. Toda inconsistencia debe ser reportada al administrador.
                  </p>
                </div>
              </div>

              {/* Performance & Yield */}
              <div className="glass p-8 md:p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl relative overflow-hidden">
                <h4 className="text-lg md:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">Performance & Yield</h4>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margen Neto sobre Interés</p>
                      <p className={`text-lg font-black ${totales.utilidad >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {totales.interesesGenerados > 0 ? ((totales.utilidad / totales.interesesGenerados) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${totales.utilidad >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(100, Math.max(0, (totales.utilidad / totales.interesesGenerados) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:gap-6 pt-2">
                    <div className="p-5 md:p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">ROI sobre Capital</p>
                      <p className={`text-base font-black uppercase tracking-tight ${totales.totalVendido > 0 && (totales.utilidad / totales.totalVendido) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
                        {totales.totalVendido > 0 ? ((totales.utilidad / totales.totalVendido) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                    <div className="p-5 md:p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Yield Bruto</p>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                        {totales.totalVendido > 0 ? ((totales.interesesGenerados / totales.totalVendido) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
                <FiTarget className="absolute -right-10 -bottom-10 text-slate-50 dark:text-white/5" size={200} />
              </div>
            </div>
          </>
        ) : (
          <div className="glass p-16 md:p-20 rounded-[3rem] text-center border-white/60 dark:border-slate-800">
            <div className="w-20 md:w-24 h-20 md:h-24 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
              <FiBarChart2 size={40} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-400 uppercase tracking-widest mb-2">Esperando Auditoría</h2>
            <p className="text-sm font-bold text-slate-400">Seleccione un período y pulse &quot;Generar Reporte&quot; para visualizar la inteligencia de utilidad.</p>
          </div>
        )}
      </div>
    </div>
  );
}
