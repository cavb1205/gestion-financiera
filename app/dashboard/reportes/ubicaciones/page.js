// app/dashboard/reportes/ubicaciones/page.js
"use client";

import { useState, useEffect } from "react";
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
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney } from "@/app/utils/format";

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
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  });

  // Cargar recaudos cuando cambia fecha o tienda
  useEffect(() => {
    if (!selectedStore || !selectedDate) return;
    setLoading(true);
    apiFetch(`/recaudos/list/${selectedDate}/t/${selectedStore.tienda.id}/`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setRecaudos(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Error al cargar recaudos"))
      .finally(() => setLoading(false));
  }, [selectedStore, selectedDate]);

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;
  if (!isAdmin) return null;

  const conGPS = recaudos.filter((r) => r.latitud && r.longitud);
  const sinGPS = recaudos.filter((r) => !r.latitud || !r.longitud);
  const abonos = conGPS.filter((r) => !r.visita_blanco);
  const fallas = conGPS.filter((r) => !!r.visita_blanco);

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
                <span className="text-indigo-500">{selectedStore.tienda.nombre}</span> · Ubicaciones GPS
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              apiFetch(`/recaudos/list/${selectedDate}/t/${selectedStore.tienda.id}/`)
                .then((r) => r.ok ? r.json() : [])
                .then((data) => setRecaudos(Array.isArray(data) ? data : []))
                .catch(() => {})
                .finally(() => setLoading(false));
            }}
            className="p-3 md:p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
          >
            <FiRefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>

        {/* Filtros */}
        <div className="glass p-5 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-xl">
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

          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="glass p-5 rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                <FiActivity size={14} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">{recaudos.length}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total cobros</p>
          </div>

          <div className="glass p-5 rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                <FiMapPin size={14} />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{conGPS.length}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Con GPS</p>
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
        </div>

        {/* Mapa */}
        <div className="glass rounded-[2rem] border-white/60 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
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
          <div style={{ height: "480px" }}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : (
              <MapaRecaudos recaudos={recaudos} />
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
                  <div key={r.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${esFalla ? "bg-rose-500" : "bg-emerald-500"}`} />
                      <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase">{nombre}</p>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
