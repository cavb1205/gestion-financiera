"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";
import {
  FiActivity,
  FiAlertTriangle,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiMapPin,
  FiRefreshCw,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatAppTime, getAppDateString, shiftAppDate } from "@/app/utils/datetime";

function fechaLocal(desplazamiento = 0) {
  return getAppDateString(desplazamiento);
}

function formatearFecha(valor) {
  if (!valor) return "—";
  const [anio, mes, dia] = valor.split("-");
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : valor;
}

function obtenerOrden(punto) {
  const timestamp = Date.parse(punto?.hora || "");
  return Number.isFinite(timestamp) ? timestamp : Number(punto?.id) || 0;
}

function tieneCoordenadas(punto) {
  const latitud = Number(punto?.latitud);
  const longitud = Number(punto?.longitud);
  return Number.isFinite(latitud) && Number.isFinite(longitud)
    && latitud >= -90 && latitud <= 90
    && longitud >= -180 && longitud <= 180;
}

function formatHora(horaStr) {
  return formatAppTime(horaStr);
}

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => fechaLocal(-1));
  const requestRef = useRef(0);

  const fetchTrabajadores = useCallback(async () => {
    if (!selectedStore) return;

    try {
      const response = await apiFetch(`/trabajadores/t/${selectedStore.tienda.id}/`);
      if (!response.ok) throw new Error("No se pudieron cargar los trabajadores");
      const data = await response.json();
      setTrabajadores(Array.isArray(data) ? data : []);
    } catch (requestError) {
      console.error("Error al cargar trabajadores:", requestError);
      toast.error("Error al cargar trabajadores");
      setTrabajadores([]);
    }
  }, [selectedStore]);

  useEffect(() => {
    if (selectedStore) fetchTrabajadores();
  }, [fetchTrabajadores, selectedStore]);

  const fetchPuntos = useCallback(async () => {
    if (!selectedStore || !selectedDate) return;

    const requestId = ++requestRef.current;
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(
        `/publicidad/list/${selectedDate}/t/${selectedStore.tienda.id}/`
      );
      if (!response.ok) throw new Error("No se pudieron consultar los puntos de publicidad");

      const data = await response.json();
      if (requestId === requestRef.current) {
        setPuntos(Array.isArray(data) ? data : []);
      }
    } catch (requestError) {
      console.error("Error al cargar puntos de publicidad:", requestError);
      const message = requestError.message || "Error al cargar los puntos de publicidad";
      if (requestId === requestRef.current) {
        setError(message);
        setPuntos([]);
        toast.error(message);
      }
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [selectedDate, selectedStore]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && selectedStore) fetchPuntos();
  }, [authLoading, isAuthenticated, selectedStore, fetchPuntos]);

  const navigateDate = (offset) => {
    setSelectedDate(shiftAppDate(selectedDate, offset));
  };

  const puntosOrdenados = useMemo(
    () => [...puntos].sort((a, b) => obtenerOrden(a) - obtenerOrden(b)),
    [puntos]
  );

  const puntosFiltrados = useMemo(
    () => selectedWorker
      ? puntosOrdenados.filter((punto) => String(punto.trabajador) === selectedWorker)
      : puntosOrdenados,
    [puntosOrdenados, selectedWorker]
  );

  const conGPS = useMemo(
    () => puntosFiltrados.filter(tieneCoordenadas),
    [puntosFiltrados]
  );

  const sinGPS = useMemo(
    () => puntosFiltrados.filter((punto) => !tieneCoordenadas(punto)),
    [puntosFiltrados]
  );

  const trabajadoresActivos = useMemo(
    () => new Set(
      puntosFiltrados
        .map((punto) => punto.trabajador)
        .filter((trabajador) => trabajador !== null && trabajador !== undefined)
        .map(String)
    ).size,
    [puntosFiltrados]
  );

  const puntosSinNota = useMemo(
    () => puntosFiltrados.filter((punto) => !String(punto.nota || "").trim()).length,
    [puntosFiltrados]
  );

  const coberturaGPS = puntosFiltrados.length > 0
    ? Math.round((conGPS.length / puntosFiltrados.length) * 100)
    : 0;

  const primerPunto = formatHora(puntosFiltrados[0]?.hora);
  const ultimoPunto = formatHora(puntosFiltrados[puntosFiltrados.length - 1]?.hora);

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full space-y-6">
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
                Jornada cerrada · {formatearFecha(selectedDate)} · <span className="text-indigo-500">{selectedStore.tienda.nombre}</span>
              </p>
            </div>
          </div>
          <button
            onClick={fetchPuntos}
            disabled={loading}
            aria-label="Actualizar puntos de publicidad"
            className="p-3 md:p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>

        <div className="glass p-5 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-xl">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label htmlFor="fecha-publicidad" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                <div className="relative">
                  <FiCalendar className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" size={15} />
                  <input
                    id="fecha-publicidad"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <label htmlFor="trabajador-publicidad" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trabajador</label>
                <div className="relative">
                  <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" size={15} />
                  <select
                    id="trabajador-publicidad"
                    value={selectedWorker}
                    onChange={(event) => setSelectedWorker(event.target.value)}
                    className="w-full pl-12 pr-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none"
                  >
                    <option value="">Todos los trabajadores</option>
                    {trabajadores.map((trabajador) => (
                      <option key={trabajador.id} value={String(trabajador.id)}>
                        {trabajador.trabajador}
                      </option>
                    ))}
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
                onClick={() => setSelectedDate(fechaLocal(-1))}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all"
              >
                Ayer
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(fechaLocal())}
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

        {sinGPS.length > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300">
            <FiAlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p className="text-[10px] font-bold leading-relaxed">
              <strong>{sinGPS.length}</strong> punto{sinGPS.length !== 1 ? "s" : ""} no tiene{sinGPS.length !== 1 ? "n" : ""} una ubicación GPS válida y no aparece{sinGPS.length !== 1 ? "n" : ""} en el mapa.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <div className="glass p-5 rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl"><FiActivity size={14} /></div>
            </div>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{puntosFiltrados.length}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Puntos marcados</p>
          </div>

          <div className="glass p-5 rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl"><FiUsers size={14} /></div>
            </div>
            <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">{trabajadoresActivos}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Trabajadores</p>
          </div>

          <div className="glass p-5 rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl"><FiMapPin size={14} /></div>
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{conGPS.length}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Con GPS · {coberturaGPS}%</p>
          </div>

          <div className="glass p-5 rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl"><FiX size={14} /></div>
            </div>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tighter">{puntosSinNota}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Sin nota</p>
          </div>

          <div className="glass p-5 rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl"><FiClock size={14} /></div>
            </div>
            <p className="text-lg font-black text-slate-700 dark:text-slate-200 tracking-tighter">{primerPunto} — {ultimoPunto}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Horario registrado</p>
          </div>
        </div>

        <div className="glass rounded-[2rem] border-white/60 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapa de distribución</span>
            <span className="flex items-center gap-1.5 text-[9px] font-black text-indigo-500 uppercase tracking-widest">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Punto
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
              <span className="w-8 border-t-2 border-dashed border-indigo-400 inline-block" /> Secuencia
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-auto">
              {conGPS.length} ubicable{conGPS.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="h-[420px] md:h-[520px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : (
              <MapaPublicidad puntos={puntosFiltrados} />
            )}
          </div>
        </div>

        {puntosFiltrados.length > 0 && (
          <div className="glass p-6 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Detalle de puntos ({puntosFiltrados.length})
              </h4>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Orden cronológico</span>
            </div>
            <div className="space-y-2">
              {puntosFiltrados.map((punto, index) => (
                <div key={punto.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest shrink-0">#{index + 1}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase truncate">
                        {punto.nota || "Sin nota"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {punto.trabajador_nombre && (
                          <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest truncate">
                            {punto.trabajador_nombre}
                          </p>
                        )}
                        <p className={`text-[9px] font-black uppercase tracking-widest ${tieneCoordenadas(punto) ? "text-emerald-500" : "text-amber-500"}`}>
                          {tieneCoordenadas(punto) ? "GPS" : "Sin GPS"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                    {formatHora(punto.hora)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {sinGPS.length > 0 && (
          <div className="glass p-6 rounded-[2rem] border-amber-200/70 dark:border-amber-900/40 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl"><FiAlertTriangle size={14} /></div>
              <div>
                <h4 className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest">Puntos fuera del mapa</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Revisar registro de ubicación</p>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {sinGPS.map((punto) => (
                <div key={punto.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50/60 dark:bg-amber-900/10 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase truncate">{punto.nota || "Sin nota"}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {punto.trabajador_nombre && <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest hidden sm:inline">{punto.trabajador_nombre}</span>}
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formatHora(punto.hora)}</span>
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
