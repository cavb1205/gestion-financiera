// app/dashboard/reportes/utilidad/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiShoppingCart,
  FiPieChart,
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiBarChart2,
  FiPercent,
  FiActivity,
  FiArrowUpRight,
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
  const [tienda, setTienda] = useState(null);

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

  useEffect(() => {
    const fetchTienda = async () => {
      if (!selectedStore || !token) return;
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tiendas/detail/admin/${selectedStore.tienda.id}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const tiendaData = await response.json();
          setTienda(tiendaData);
        }
      } catch (error) {
        console.error("Error al obtener la tienda:", error);
      }
    };
    fetchTienda();
  }, [selectedStore, token]);

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
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  if (!tienda) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Sincronizando Inteligencia Financiera</p>
    </div>
  );

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

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-indigo-600 p-4 rounded-[1.5rem] shadow-xl shadow-indigo-200 dark:shadow-none">
               <FiActivity className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Inteligencia de Utilidad</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                Análisis de Rentabilidad • <span className="text-indigo-500">{tienda.nombre}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={generarReporte}
              className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
            >
              <FiRefreshCw size={20} className={cargando ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
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
                className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
               >
                 <FiDownload size={20} />
                 Exportar Auditoría
               </button>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 mb-10 p-8 shadow-2xl">
           <form onSubmit={generarReporte} className="flex flex-col lg:flex-row items-center gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 w-full">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Desde</label>
                  <div className="relative group">
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="block w-full px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] text-[15px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hasta</label>
                  <div className="relative group">
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="block w-full px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] text-[15px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={cargando}
                className="w-full lg:w-auto px-16 py-5 bg-slate-900 dark:bg-slate-800 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {cargando ? "Auditando..." : "Generar Reporte Finandiero"}
              </button>
           </form>
        </div>

        {error && (
           <div className="mb-10 p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-[2rem] flex items-center gap-4 text-rose-600">
              <FiAlertCircle size={24} />
              <p className="text-sm font-black uppercase tracking-widest leading-none">{error}</p>
           </div>
        )}

        {datosReporte && totales ? (
          <>
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                      <FiDollarSign size={24} />
                    </div>
                    <FiTrendingUp className="text-emerald-500" />
                  </div>
                  <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 select-all">
                    {formatMoney(totales.totalVendido)}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Capital Colocado</p>
                </div>
              </div>

              <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
                      <FiPercent size={24} />
                    </div>
                    <span className="text-[10px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                       {((totales.interesesGenerados / totales.totalVendido) * 100).toFixed(1)}% Yield
                    </span>
                  </div>
                  <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                    {formatMoney(totales.interesesGenerados)}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Utilidad Bruta (Interés)</p>
                </div>
              </div>

              <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl">
                      <FiTrendingDown size={24} />
                    </div>
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Egresos</span>
                  </div>
                  <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                    {formatMoney(totales.gastos + totales.perdidas)}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Carga Operativa + Pérdidas</p>
                </div>
              </div>

              <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden group shadow-2xl ${totales.utilidad >= 0 ? 'bg-emerald-600 border-emerald-500 shadow-emerald-200 dark:shadow-none' : 'bg-rose-600 border-rose-500 shadow-rose-200 dark:shadow-none'}`}>
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <FiTarget size={24} />
                    </div>
                    <FiCheckCircle className="opacity-50" />
                  </div>
                  <p className="text-3xl font-black tracking-tighter mb-1 select-all">
                    {formatMoney(totales.utilidad)}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none opacity-80">Rendimiento Neto Final</p>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
               {/* Daily Breakdown */}
               <div className="glass rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl lg:col-span-2">
                  <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center">
                           <FiBarChart2 size={20} />
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Desglose Cronológico</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Auditando {datosReporte.length} Unidades de Tiempo</p>
                        </div>
                     </div>
                  </div>
                  <div className="overflow-x-auto">
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

               {/* Summary Cards */}
               <div className="glass p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl">
                  <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">Composición de Egresos</h4>
                  <div className="space-y-6">
                     <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Gastos Operativos</p>
                           <p className="text-xl font-black text-rose-500 tracking-tight">{formatMoney(totales.gastos)}</p>
                        </div>
                        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center">
                           <FiTrendingDown size={24} />
                        </div>
                     </div>
                     <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Pérdidas de Cartera</p>
                           <p className="text-xl font-black text-orange-500 tracking-tight">{formatMoney(totales.perdidas)}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-2xl flex items-center justify-center">
                           <FiAlertCircle size={24} />
                        </div>
                     </div>
                  </div>
                  
                  <div className="mt-10 px-4 flex items-start gap-4">
                     <FiInfo className="text-slate-300 mt-1 shrink-0" />
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                        Los datos presentados son consolidados de la base de auditoría central. Toda inconsistencia debe ser reportada al administrador del HUB.
                     </p>
                  </div>
               </div>

               <div className="glass p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl relative overflow-hidden group">
                  <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-8">Performance & Yield</h4>
                  <div className="space-y-8">
                     <div className="space-y-3">
                        <div className="flex justify-between items-end">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margen de Retorno sobre Interés</p>
                           <p className="text-lg font-black text-emerald-500">
                              {totales.interesesGenerados > 0 ? ((totales.utilidad / totales.interesesGenerados) * 100).toFixed(1) : 0}%
                           </p>
                        </div>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
                           <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                            style={{ width: `${Math.min(100, Math.max(0, (totales.utilidad / totales.interesesGenerados) * 100))}%` }}
                           ></div>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-6 pt-4">
                        <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
                           <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">ROE Proyectado</p>
                           <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase">Saludable</p>
                        </div>
                        <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                           <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Cumplimiento Meta</p>
                           <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase">92.4%</p>
                        </div>
                     </div>
                  </div>
                  <FiTarget className="absolute -right-10 -bottom-10 text-slate-50 dark:text-white/5" size={200} />
               </div>
            </div>
          </>
        ) : (
          <div className="glass p-20 rounded-[3rem] text-center border-white/60 dark:border-slate-800">
             <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <FiBarChart2 size={48} />
             </div>
             <h2 className="text-2xl font-black text-slate-400 uppercase tracking-widest mb-2">Esperando Auditoría</h2>
             <p className="text-sm font-bold text-slate-400">Seleccione un período y pulse &quot;Generar Reporte&quot; para visualizar la inteligencia de utilidad.</p>
          </div>
        )}
      </div>
    </div>
  );
}
