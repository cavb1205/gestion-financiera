"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";
import {
  FiMapPin,
  FiCalendar,
  FiRefreshCw,
  FiActivity,
  FiClock,
  FiUser,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";

const MapaPublicidad = dynamic(() => import("@/app/components/maps/MapaPublicidad"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] text-slate-400">
      <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  ),
});

export default function PublicidadReportePage() {
  const { selectedStore, user, isAuthenticated, loading: authLoading } = useAuth();
  const isAdmin = user?.is_staff || user?.is_superuser;

  const [puntos, setPuntos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  });

  useEffect(() => {
    if (!selectedStore) return;
    apiFetch(`/trabajadores/t/${selectedStore.tienda.id}/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTrabajadores(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [selectedStore]);

  const fetchPuntos = useCallback(async () => {
    if (!selectedStore || !selectedDate) return;
    setLoading(true);
    try {
      const res = await apiFetch(
        `/publicidad/list/${selectedDate}/t/${selectedStore.tienda.id}/`
      );
      const data = res.ok ? await res.json() : [];
      setPuntos(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar los puntos");
    } finally {
      setLoading(false);
    }
  }, [selectedStore, selectedDate]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && selectedStore) fetchPuntos();
  }, [authLoading, isAuthenticated, selectedStore, fetchPuntos]);

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;
  if (!isAdmin) return null;

  // Filtrar por trabajador seleccionado
  const puntosFiltrados = selectedWorker
    ? puntos.filter((p) => String(p.trabajador) === selectedWorker)
    : puntos;

  const formatHora = (horaStr) => {
    if (!horaStr) return "—";
    const d = new Date(horaStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const primerPunto = puntosFiltrados.length > 0
    ? formatHora(puntosFiltrados[puntosFiltrados.length - 1]?.hora)
    : "—";
  const ultimoPunto = puntosFiltrados.length > 0
    ? formatHora(puntosFiltrados[0]?.hora)
    : "—";

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
                Mapa de Publicidad
              </h1>
              <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">
                <span className="text-indigo-500">{selectedStore.tienda.nombre}</span> · Puntos de distribución
              </p>
            </div>
          </div>
          <button
            onClick={fetchPuntos}
            className="p-3 md:p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
          >
            <FiRefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>

        {/* Filtros */}
        <div className="glass p-5 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-4">
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trabajador</label>
              <div className="relative">
                <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" size={15} />
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none"
                >
                  <option value="">Todos</option>
                  {trabajadores.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.trabajador?.first_name} {t.trabajador?.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="glass p-5 rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                <FiActivity size={14} />
              </div>
            </div>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{puntosFiltrados.length}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total puntos</p>
          </div>
          <div className="glass p-5 rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl">
                <FiClock size={14} />
              </div>
            </div>
            <p className="text-lg font-black text-slate-700 dark:text-slate-200 tracking-tighter">{primerPunto}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Primer punto</p>
          </div>
          <div className="glass p-5 rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl">
                <FiClock size={14} />
              </div>
            </div>
            <p className="text-lg font-black text-slate-700 dark:text-slate-200 tracking-tighter">{ultimoPunto}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Último punto</p>
          </div>
        </div>

        {/* Mapa */}
        <div className="glass rounded-[2rem] border-white/60 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapa de ruta</span>
            <span className="flex items-center gap-1.5 text-[9px] font-black text-indigo-500 uppercase tracking-widest">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Punto
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
              <span className="w-8 border-t-2 border-dashed border-indigo-400 inline-block" /> Ruta
            </span>
          </div>
          <div style={{ height: "480px" }}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : (
              <MapaPublicidad puntos={puntosFiltrados} />
            )}
          </div>
        </div>

        {/* Lista de puntos */}
        {puntosFiltrados.length > 0 && (
          <div className="glass p-6 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-xl">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Detalle de puntos ({puntosFiltrados.length})
            </h4>
            <div className="space-y-2">
              {puntosFiltrados.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest shrink-0">#{i + 1}</span>
                    <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase truncate">
                      {p.nota || "Sin nota"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {p.trabajador_nombre && (
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest hidden sm:block">
                        {p.trabajador_nombre}
                      </p>
                    )}
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {formatHora(p.hora)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
