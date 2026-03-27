// app/dashboard/reportes/visitas/page.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";
import { useRouter } from "next/navigation";
import {
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiPercent,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiActivity,
  FiEye,
  FiMessageCircle,
  FiArrowRight,
  FiHome,
  FiDollarSign,
  FiMapPin,
  FiHelpCircle,
  FiUserX,
  FiTruck,
  FiThermometer,
  FiTarget,
  FiInfo,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney, parseMoney } from "../../../utils/format";

// Color map for failure reasons
const FALLA_CONFIG = {
  "Casa o Local Cerrado": { color: "slate", icon: FiHome, bg: "bg-slate-50 dark:bg-slate-800/50", text: "text-slate-600 dark:text-slate-300", bar: "bg-slate-500", badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" },
  "Cliente no Tiene Dinero": { color: "rose", icon: FiDollarSign, bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-600 dark:text-rose-400", bar: "bg-rose-500", badge: "bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400" },
  "Cliente de Viaje": { color: "blue", icon: FiTruck, bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", bar: "bg-blue-500", badge: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
  "Cliente no Aparece": { color: "amber", icon: FiUserX, bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500", badge: "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" },
  "Cliente Enfermo": { color: "violet", icon: FiThermometer, bg: "bg-violet-50 dark:bg-violet-900/20", text: "text-violet-600 dark:text-violet-400", bar: "bg-violet-500", badge: "bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400" },
  "Dirección Errónea": { color: "orange", icon: FiMapPin, bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400", bar: "bg-orange-500", badge: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" },
  "Otro Motivo": { color: "slate", icon: FiHelpCircle, bg: "bg-slate-50 dark:bg-slate-800/50", text: "text-slate-500 dark:text-slate-400", bar: "bg-slate-400", badge: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400" },
};

const getFallaConfig = (tipo) => FALLA_CONFIG[tipo] || FALLA_CONFIG["Otro Motivo"];

export default function VisitasReportePage() {
  const { selectedStore, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [fecha, setFecha] = useState("");
  const [recaudos, setRecaudos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  // Initialize date to today
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    setFecha(`${year}-${month}-${day}`);
  }, []);

  // Auto-fetch on mount when fecha and auth are ready
  useEffect(() => {
    if (fecha && selectedStore && !fetched) {
      fetchRecaudos(fecha);
    }
  }, [fecha, selectedStore]);

  const fetchRecaudos = async (fechaConsulta) => {
    if (!selectedStore || !fechaConsulta) return;

    setLoading(true);
    try {
      const response = await apiFetch(
        `/recaudos/list/${fechaConsulta}/t/${selectedStore.tienda.id}/`
      );

      if (!response.ok) throw new Error("Error al consultar recaudos");

      const data = await response.json();
      // API may return {message: "..."} when empty
      setRecaudos(Array.isArray(data) ? data : []);
      setFetched(true);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Error al sincronizar datos de visitas");
      setRecaudos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConsultar = (e) => {
    if (e) e.preventDefault();
    fetchRecaudos(fecha);
  };

  const navigateDate = (offset) => {
    const d = new Date(fecha + "T12:00:00");
    d.setDate(d.getDate() + offset);
    const newFecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setFecha(newFecha);
    fetchRecaudos(newFecha);
  };

  const goToToday = () => {
    const today = new Date();
    const newFecha = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setFecha(newFecha);
    fetchRecaudos(newFecha);
  };

  const goToYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const newFecha = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    setFecha(newFecha);
    fetchRecaudos(newFecha);
  };

  // Computed data
  const visitasFallidas = useMemo(
    () => recaudos.filter((r) => parseFloat(r.valor_recaudo) === 0),
    [recaudos]
  );

  const visitasExitosas = useMemo(
    () => recaudos.filter((r) => parseFloat(r.valor_recaudo) > 0),
    [recaudos]
  );

  const totalRecaudado = useMemo(
    () => visitasExitosas.reduce((acc, r) => acc + parseMoney(r.valor_recaudo), 0),
    [visitasExitosas]
  );

  const promedioRecaudo = useMemo(
    () => (visitasExitosas.length > 0 ? Math.round(totalRecaudado / visitasExitosas.length) : 0),
    [totalRecaudado, visitasExitosas]
  );

  const tasaFallo = useMemo(
    () => (recaudos.length > 0 ? ((visitasFallidas.length / recaudos.length) * 100).toFixed(1) : "0.0"),
    [recaudos, visitasFallidas]
  );

  // Distribution by failure reason
  const distribucionFallas = useMemo(() => {
    const counts = {};
    visitasFallidas.forEach((r) => {
      const tipo = r.visita_blanco?.tipo_falla || "Otro Motivo";
      counts[tipo] = (counts[tipo] || 0) + 1;
    });

    const total = visitasFallidas.length;
    return Object.entries(counts)
      .map(([tipo, count]) => ({
        tipo,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0.0",
        config: getFallaConfig(tipo),
      }))
      .sort((a, b) => b.count - a.count);
  }, [visitasFallidas]);

  const maxFallaCount = useMemo(
    () => (distribucionFallas.length > 0 ? Math.max(...distribucionFallas.map((d) => d.count)) : 0),
    [distribucionFallas]
  );

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">
              Análisis de Visitas
            </h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Visitas Fallidas • <span className="text-slate-400">{selectedStore.tienda.nombre}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchRecaudos(fecha)}
              className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
            >
              <FiRefreshCw size={18} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
            </button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="glass rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 mb-8 p-6 md:p-8 shadow-2xl">
          <form onSubmit={handleConsultar} className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="space-y-2 flex-1 w-full">
                <label htmlFor="fecha" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Fecha de Consulta
                </label>
                <input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="block w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-10 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? "Consultando..." : "Consultar"}
              </button>
            </div>

            {/* Quick navigation */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => navigateDate(-1)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all"
              >
                <FiChevronLeft size={14} />
                Anterior
              </button>
              <button
                type="button"
                onClick={goToYesterday}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all"
              >
                Ayer
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => navigateDate(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all"
              >
                Siguiente
                <FiChevronRight size={14} />
              </button>
            </div>
          </form>
        </div>

        {/* Loading */}
        {loading && <LoadingSpinner />}

        {/* Results */}
        {!loading && fetched && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-4 md:gap-6 mb-8">
              {/* Total Visitas */}
              <div className="glass p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="p-2 md:p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl md:rounded-2xl">
                    <FiEye size={18} className="md:w-5 md:h-5" />
                  </div>
                  <FiActivity className="text-indigo-400" size={14} />
                </div>
                <p className="text-lg md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                  {recaudos.length}
                </p>
                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Total Visitas
                </p>
              </div>

              {/* Visitas Fallidas */}
              <div className="glass p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="p-2 md:p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl md:rounded-2xl">
                    <FiAlertCircle size={18} className="md:w-5 md:h-5" />
                  </div>
                  <span className="text-[8px] md:text-[9px] font-black text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg">
                    {visitasFallidas.length > 0 ? "Atención" : "OK"}
                  </span>
                </div>
                <p className="text-lg md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                  {visitasFallidas.length}
                </p>
                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Visitas Fallidas
                </p>
              </div>

              {/* Tasa de Fallo */}
              <div className={`p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border relative overflow-hidden shadow-2xl ${parseFloat(tasaFallo) > 30
                  ? "bg-rose-600 border-rose-500 shadow-rose-200 dark:shadow-none"
                  : parseFloat(tasaFallo) > 15
                    ? "bg-amber-600 border-amber-500 shadow-amber-200 dark:shadow-none"
                    : "bg-emerald-600 border-emerald-500 shadow-emerald-200 dark:shadow-none"
                }`}>
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="p-2 md:p-3 bg-white/20 rounded-xl md:rounded-2xl">
                      <FiPercent size={18} className="md:w-5 md:h-5" />
                    </div>
                    <FiTarget className="opacity-50" size={14} />
                  </div>
                  <p className="text-lg md:text-3xl font-black tracking-tighter mb-1">
                    {tasaFallo}%
                  </p>
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest leading-none opacity-80">
                    Tasa de Fallo
                  </p>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              </div>
            </div>

            {/* Distribution by Failure Reason */}
            {visitasFallidas.length > 0 && (
              <div className="glass rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl mb-8">
                <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                    <FiActivity size={20} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
                      Distribución por Motivo
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {visitasFallidas.length} visitas fallidas analizadas
                    </p>
                  </div>
                </div>

                <div className="p-6 md:p-10 space-y-5">
                  {distribucionFallas.map((item) => {
                    const Icon = item.config.icon;
                    return (
                      <div key={item.tipo} className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 ${item.config.bg} ${item.config.text} rounded-xl`}>
                              <Icon size={16} />
                            </div>
                            <p className="text-xs md:text-sm font-black text-slate-800 dark:text-white tracking-tight">
                              {item.tipo}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${item.config.badge}`}>
                              {item.count}
                            </span>
                            <span className="text-xs font-black text-slate-400 w-12 text-right">
                              {item.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${item.config.bar}`}
                            style={{ width: `${maxFallaCount > 0 ? (item.count / maxFallaCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Failed Visits Detail List */}
            <div className="glass rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl mb-8">
              <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                  <FiAlertCircle size={20} />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
                    Detalle de Visitas Fallidas
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Registro individual de cada falla
                  </p>
                </div>
              </div>

              {visitasFallidas.length === 0 ? (
                <div className="p-12 md:p-16 text-center">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiCheckCircle size={28} />
                  </div>
                  <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-1">
                    Sin Fallas
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    No se registraron visitas fallidas en esta fecha
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                          <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Cliente
                          </th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Tipo de Falla
                          </th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Comentario
                          </th>
                          <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">

                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {visitasFallidas.map((recaudo) => {
                          const tipo = recaudo.visita_blanco?.tipo_falla || "Otro Motivo";
                          const comentario = recaudo.visita_blanco?.comentario || "";
                          const config = getFallaConfig(tipo);
                          const ventaId = recaudo.venta?.id || recaudo.venta;

                          const clienteNombre = recaudo.venta?.cliente
                            ? `${recaudo.venta.cliente.nombres} ${recaudo.venta.cliente.apellidos}`
                            : `Venta #${ventaId}`;

                          return (
                            <tr key={recaudo.id} className="group hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all cursor-pointer" onClick={() => router.push(`/dashboard/ventas/${ventaId}`)}>
                              <td className="px-8 py-5 whitespace-nowrap">
                                <p className="text-xs font-black text-slate-800 dark:text-white tracking-tight capitalize">{clienteNombre}</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">Ref. #{ventaId}</p>
                              </td>
                              <td className="px-8 py-5">
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${config.badge}`}>
                                  {tipo}
                                </span>
                              </td>
                              <td className="px-8 py-5">
                                {comentario ? (
                                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 max-w-xs truncate">
                                    {comentario}
                                  </p>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 italic">
                                    Sin comentario
                                  </span>
                                )}
                              </td>
                              <td className="px-8 py-5 text-center">
                                <FiArrowRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors mx-auto" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {visitasFallidas.map((recaudo) => {
                      const tipo = recaudo.visita_blanco?.tipo_falla || "Otro Motivo";
                      const comentario = recaudo.visita_blanco?.comentario || "";
                      const config = getFallaConfig(tipo);
                      const Icon = config.icon;
                      const ventaId = recaudo.venta?.id || recaudo.venta;
                      const clienteNombreMobile = recaudo.venta?.cliente
                        ? `${recaudo.venta.cliente.nombres} ${recaudo.venta.cliente.apellidos}`
                        : `Venta #${ventaId}`;

                      return (
                        <div key={recaudo.id} className="px-5 py-4 space-y-3 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors" onClick={() => router.push(`/dashboard/ventas/${ventaId}`)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`p-1.5 ${config.bg} ${config.text} rounded-lg shrink-0`}>
                                <Icon size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-800 dark:text-white tracking-tight truncate">{clienteNombreMobile}</p>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${config.text}`}>
                                  {tipo}
                                </span>
                              </div>
                            </div>
                            <FiArrowRight size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                          </div>
                          {comentario && (
                            <div className="flex items-start gap-2 pl-1">
                              <FiMessageCircle className="text-slate-300 dark:text-slate-600 mt-0.5 shrink-0" size={12} />
                              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                                {comentario}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Successful Collections Summary */}
            <div className="glass p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl relative overflow-hidden">
              <h4 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6 md:mb-8">
                Resumen de Recaudo Exitoso
              </h4>

              <div className="grid grid-cols-3 gap-4 md:gap-6">
                <div className="p-4 md:p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl md:rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                  <p className="text-[8px] md:text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">
                    Pagos Exitosos
                  </p>
                  <p className="text-base md:text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {visitasExitosas.length}
                  </p>
                </div>
                <div className="p-4 md:p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl md:rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
                  <p className="text-[8px] md:text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">
                    Total Recaudado
                  </p>
                  <p className="text-base md:text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                    {formatMoney(totalRecaudado)}
                  </p>
                </div>
                <div className="p-4 md:p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl md:rounded-3xl border border-amber-100 dark:border-amber-900/20">
                  <p className="text-[8px] md:text-[9px] font-black text-amber-400 uppercase tracking-widest mb-2">
                    Promedio Pago
                  </p>
                  <p className="text-base md:text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                    {formatMoney(promedioRecaudo)}
                  </p>
                </div>
              </div>

              <div className="mt-6 md:mt-8 px-4 flex items-start gap-4">
                <FiInfo className="text-slate-300 mt-1 shrink-0" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Datos consolidados de la jornada seleccionada. Para análisis histórico, navegue entre fechas usando los controles anteriores.
                </p>
              </div>

              <FiCheckCircle className="absolute -right-10 -bottom-10 text-slate-50 dark:text-white/5" size={200} />
            </div>
          </>
        )}

        {/* Empty state before first fetch */}
        {!loading && !fetched && (
          <div className="glass p-16 md:p-20 rounded-[3rem] text-center border-white/60 dark:border-slate-800">
            <div className="w-20 md:w-24 h-20 md:h-24 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
              <FiCalendar size={40} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-400 uppercase tracking-widest mb-2">
              Esperando Consulta
            </h2>
            <p className="text-sm font-bold text-slate-400">
              Seleccione una fecha y pulse &quot;Consultar&quot; para analizar las visitas del día.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
