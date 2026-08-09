// app/dashboard/reportes/ubicaciones/page.js
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";
import {
  FiMapPin,
  FiCalendar,
  FiRefreshCw,
  FiActivity,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiFilter,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney, parseMoney } from "@/app/utils/format";
import { getAppDateString, shiftAppDate } from "@/app/utils/datetime";

function fechaLocal(desplazamiento = 0) {
  return getAppDateString(desplazamiento);
}

function formatearFecha(valor) {
  if (!valor) return "—";
  const [anio, mes, dia] = valor.split("-");
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : valor;
}

function tieneCoordenadas(recaudo) {
  const latitud = Number(recaudo?.latitud);
  const longitud = Number(recaudo?.longitud);
  return Number.isFinite(latitud) && Number.isFinite(longitud)
    && latitud >= -90 && latitud <= 90
    && longitud >= -180 && longitud <= 180;
}

// Leaflet no puede correr en SSR
const MapaRecaudos = dynamic(() => import("@/app/components/maps/MapaRecaudos"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] text-slate-400">
      <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  ),
});

export default function UbicacionesPage() {
  const { selectedStore, user, isAuthenticated, loading: authLoading } = useAuth();
  const isAdmin = user?.is_staff || user?.is_superuser;

  const [recaudos, setRecaudos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [renovacionesExcluidas, setRenovacionesExcluidas] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => fechaLocal(-1));
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const requestRef = useRef(0);

  const fetchRecaudos = useCallback(async () => {
    if (!selectedStore || !selectedDate) return;

    const requestId = ++requestRef.current;
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(
        `/recaudos/list/${selectedDate}/t/${selectedStore.tienda.id}/?vista=lista`
      );
      if (!response.ok) throw new Error("No se pudieron consultar los cobros");

      const data = await response.json();
      const registros = Array.isArray(data) ? data : [];
      const renovaciones = registros.filter((recaudo) => recaudo.es_renovacion);
      if (requestId === requestRef.current) {
        setRenovacionesExcluidas(renovaciones.length);
        setRecaudos(registros.filter((recaudo) => !recaudo.es_renovacion));
      }
    } catch (requestError) {
      console.error("Error al cargar recaudos:", requestError);
      const message = requestError.message || "Error al cargar los cobros";
      if (requestId === requestRef.current) {
        setError(message);
        setRecaudos([]);
        setRenovacionesExcluidas(0);
        toast.error(message);
      }
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [selectedDate, selectedStore]);

  useEffect(() => {
    if (selectedStore) fetchRecaudos();
  }, [fetchRecaudos, selectedStore]);

  const navigateDate = (offset) => {
    setSelectedDate(shiftAppDate(selectedDate, offset));
  };

  const goToToday = () => setSelectedDate(fechaLocal());
  const goToYesterday = () => setSelectedDate(fechaLocal(-1));

  const recaudosFiltrados = useMemo(() => {
    if (filtroTipo === "abonos") return recaudos.filter((recaudo) => !recaudo.visita_blanco);
    if (filtroTipo === "fallas") return recaudos.filter((recaudo) => !!recaudo.visita_blanco);
    return recaudos;
  }, [filtroTipo, recaudos]);

  const conGPS = useMemo(
    () => recaudosFiltrados.filter(tieneCoordenadas),
    [recaudosFiltrados]
  );

  const sinGPS = useMemo(
    () => recaudosFiltrados.filter((recaudo) => !tieneCoordenadas(recaudo)),
    [recaudosFiltrados]
  );

  const abonos = useMemo(
    () => recaudosFiltrados.filter((recaudo) => !recaudo.visita_blanco),
    [recaudosFiltrados]
  );

  const fallas = useMemo(
    () => recaudosFiltrados.filter((recaudo) => !!recaudo.visita_blanco),
    [recaudosFiltrados]
  );

  const totalRecaudado = useMemo(
    () => abonos.reduce((total, recaudo) => total + parseMoney(recaudo.valor_recaudo), 0),
    [abonos]
  );

  const coberturaGPS = recaudosFiltrados.length > 0
    ? Math.round((conGPS.length / recaudosFiltrados.length) * 100)
    : 0;

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-5 min-w-0">
            <div className="bg-indigo-600 p-3 md:p-4 rounded-[1.25rem] md:rounded-[1.5rem] shadow-xl shadow-indigo-200 dark:shadow-none shrink-0">
              <FiMapPin className="text-white text-xl md:text-3xl" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase truncate">
                Mapa de Cobros
              </h1>
              <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">
                Jornada cerrada · {formatearFecha(selectedDate)} · <span className="text-indigo-500">{selectedStore.tienda.nombre}</span>
              </p>
            </div>
          </div>
          <button
            onClick={fetchRecaudos}
            disabled={loading}
            aria-label="Actualizar cobros"
            className="p-3 md:p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>

        {/* Filtros */}
        <div className="glass p-5 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-xl">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
            {/* Fecha */}
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
              <div className="relative">
                <FiCalendar className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" size={15} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
            </div>

              <div className="flex-1 space-y-2">
                <label htmlFor="filtro-tipo" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mostrar</label>
                <div className="relative">
                  <FiFilter className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" size={15} />
                  <select
                    id="filtro-tipo"
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="w-full appearance-none pl-12 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                  >
                    <option value="todos">Todos los movimientos</option>
                    <option value="abonos">Solo abonos</option>
                    <option value="fallas">Solo fallas</option>
                  </select>
                </div>
              </div>
            </div>

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

          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-600 dark:border-rose-900/30 dark:bg-rose-900/20">
            <FiAlertTriangle size={17} className="shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
          </div>
        )}

        {renovacionesExcluidas > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300">
            <FiActivity size={16} className="mt-0.5 shrink-0" />
            <p className="text-[10px] font-bold leading-relaxed">
              Se excluyeron <strong>{renovacionesExcluidas}</strong> renovación{renovacionesExcluidas !== 1 ? "es" : ""} automática{renovacionesExcluidas !== 1 ? "s" : ""}; no representan cobros físicos de la jornada.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <div className="glass p-5 rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                <FiActivity size={14} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">{recaudosFiltrados.length}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Movimientos</p>
          </div>

          <div className="glass p-5 rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                <FiMapPin size={14} />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{conGPS.length}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Con GPS · {coberturaGPS}%</p>
          </div>

          <div className="glass p-5 rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                <FiCheck size={14} />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{abonos.length}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Abonos</p>
          </div>

          <div className="glass p-5 rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl">
                <FiX size={14} />
              </div>
            </div>
            <p className="text-2xl font-black text-rose-500 tracking-tighter">{fallas.length}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Fallas</p>
          </div>

          <div className="glass p-5 rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                <FiDollarSign size={14} />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{formatMoney(totalRecaudado)}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Monto abonado</p>
          </div>
        </div>

        {/* Mapa */}
        <div className="glass rounded-[2rem] border-white/60 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapa de ruta</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Abono
                </span>
                <span className="flex items-center gap-1.5 text-[9px] font-black text-rose-500 uppercase tracking-widest">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Falla
                </span>
                <span className="flex items-center gap-1.5 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                  <span className="w-8 border-t-2 border-dashed border-indigo-400 inline-block"></span> Ruta
                </span>
              </div>
            </div>
            {sinGPS.length > 0 && (
              <span className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-widest">
                <FiAlertTriangle size={11} /> {sinGPS.length} sin GPS
              </span>
            )}
          </div>
          <div className="h-[420px] md:h-[520px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : (
              <MapaRecaudos recaudos={recaudosFiltrados} />
            )}
          </div>
        </div>

        {/* Lista de cobros sin GPS */}
        {sinGPS.length > 0 && (
          <div className="glass p-6 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-xl">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FiAlertTriangle className="text-amber-500" size={13} />
              Cobros sin ubicación ({sinGPS.length})
            </h4>
            <div className="space-y-2">
              {sinGPS.map((r) => {
                const cliente = r.venta?.cliente;
                const nombre = cliente ? `${cliente.nombres} ${cliente.apellidos}` : "—";
                const esFalla = !!r.visita_blanco;
                return (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${esFalla ? "bg-rose-500" : "bg-emerald-500"}`} />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-black uppercase text-slate-800 dark:text-white">{nombre}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Venta #{r.venta?.id || "—"}</p>
                      </div>
                    </div>
                    <p className="shrink-0 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {esFalla ? r.visita_blanco?.tipo_falla : formatMoney(r.valor_recaudo)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
