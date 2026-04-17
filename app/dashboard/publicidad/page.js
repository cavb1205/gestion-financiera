"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";
import { captureLocation } from "@/app/utils/geolocation";
import { FiMapPin, FiPlus, FiTrash2, FiRefreshCw, FiClock, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useRouter } from "next/navigation";

export default function PublicidadPage() {
  const { selectedStore, user, isAuthenticated, loading: authLoading } = useAuth();
  const isWorker = !(user?.is_staff || user?.is_superuser);
  const router = useRouter();

  const [gpsPermission, setGpsPermission] = useState(null);
  const [gpsBannerDismissed, setGpsBannerDismissed] = useState(false);
  const [puntos, setPuntos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [nota, setNota] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Verificar/solicitar permiso GPS
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsPermission("denied");
      return;
    }

    const checkPermission = () => {
      if (navigator.permissions) {
        navigator.permissions.query({ name: "geolocation" }).then((result) => {
          if (result.state === "granted") {
            setGpsPermission("granted");
          } else if (result.state === "denied") {
            setGpsPermission("denied");
          } else {
            navigator.geolocation.getCurrentPosition(
              () => setGpsPermission("granted"),
              (error) => setGpsPermission(error.code === error.PERMISSION_DENIED ? "denied" : "granted"),
              { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
            );
          }
        });
      } else {
        navigator.geolocation.getCurrentPosition(
          () => setGpsPermission("granted"),
          (error) => setGpsPermission(error.code === error.PERMISSION_DENIED ? "denied" : "granted"),
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      }
    };

    checkPermission();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkPermission();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  const fetchPuntos = useCallback(async () => {
    if (!selectedStore || !isAuthenticated) return;
    setLoading(true);
    try {
      const path = isWorker
        ? `/publicidad/worker/${today}/t/${selectedStore.tienda.id}/`
        : `/publicidad/list/${today}/t/${selectedStore.tienda.id}/`;
      const res = await apiFetch(path);
      const data = res.ok ? await res.json() : [];
      setPuntos(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error al cargar los puntos");
    } finally {
      setLoading(false);
    }
  }, [selectedStore, isAuthenticated, isWorker, today]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) fetchPuntos();
  }, [authLoading, isAuthenticated, fetchPuntos]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  const handleMarcar = async () => {
    if (gpsPermission === "denied") {
      toast.error("Activa el GPS para marcar un punto");
      return;
    }
    setMarking(true);
    try {
      const coords = await captureLocation();
      if (!coords) {
        toast.error("No se pudo obtener la ubicación. Verifica el GPS.");
        setMarking(false);
        return;
      }
      const createRes = await apiFetch(
        `/publicidad/create/t/${selectedStore.tienda.id}/`,
        {
          method: "POST",
          body: JSON.stringify({ ...coords, nota: nota.trim() || null }),
        }
      );
      if (!createRes.ok) throw new Error("create failed");
      toast.success("Punto marcado");
      setNota("");
      setShowModal(false);
      fetchPuntos();
    } catch {
      toast.error("Error al marcar el punto");
    } finally {
      setMarking(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/publicidad/${deleteTarget.id}/delete/`, { method: "DELETE" });
      toast.success("Punto eliminado");
      setDeleteTarget(null);
      fetchPuntos();
    } catch {
      toast.error("No se pudo eliminar el punto");
    }
  };

  const formatHora = (horaStr) => {
    if (!horaStr) return "—";
    const d = new Date(horaStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (authLoading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
            <FiMapPin className="text-indigo-600 dark:text-indigo-400" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
              Publicidad
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Marca donde dejas tarjetas/volantes
            </p>
          </div>
        </div>
        <button
          onClick={fetchPuntos}
          className="p-3 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
        >
          <FiRefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {/* Banner GPS denegado */}
      {!gpsBannerDismissed && gpsPermission === "denied" && (
        <div className="flex items-start gap-4 px-5 py-4 mb-6 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-[1.5rem]">
          <FiMapPin className="text-rose-500 shrink-0 mt-0.5" size={16} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest leading-none mb-1">
              Ubicación bloqueada
            </p>
            <p className="text-[9px] font-bold text-rose-400 uppercase tracking-tight leading-relaxed">
              Para activarla: abre la configuración de tu navegador → Permisos del sitio → Ubicación → permite esta página. Sin GPS no podrás marcar puntos.
            </p>
          </div>
          <button
            onClick={() => setGpsBannerDismissed(true)}
            className="text-rose-300 hover:text-rose-500 transition-colors shrink-0 text-lg leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Contador del día */}
      <div className="glass rounded-[1.5rem] p-5 mb-5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hoy has marcado</p>
        <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
          {puntos.length}
          <span className="text-sm font-bold text-slate-400 ml-2 normal-case tracking-normal">
            {puntos.length === 1 ? "punto" : "puntos"}
          </span>
        </p>
      </div>

      {/* Botón marcar (solo workers) */}
      {isWorker && (
        <button
          onClick={() => setShowModal(true)}
          disabled={gpsPermission === "denied"}
          className="w-full flex items-center justify-center gap-3 px-6 py-5 mb-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <FiPlus size={20} />
          Marcar punto aquí
        </button>
      )}

      {/* Lista de puntos */}
      {loading ? (
        <LoadingSpinner />
      ) : puntos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
          <div className="text-4xl">📍</div>
          <p className="text-[10px] font-black uppercase tracking-widest">Sin puntos registrados hoy</p>
          {isWorker && (
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">
              Usa el botón de arriba para marcar dónde dejas publicidad
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {puntos.map((p) => (
            <div
              key={p.id}
              className="glass rounded-[1.25rem] px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight truncate">
                    {p.nota || "Sin nota"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <FiClock size={10} className="text-slate-400" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {formatHora(p.hora)}
                    </p>
                    {!isWorker && p.trabajador_nombre && (
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest truncate">
                        · {p.trabajador_nombre}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* Workers solo pueden borrar puntos del día */}
              {(isWorker || !isWorker) && (
                <button
                  onClick={() => setDeleteTarget(p)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors shrink-0"
                >
                  <FiTrash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: marcar punto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
          <div className="glass w-full max-w-md rounded-[2rem] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                Marcar punto
              </h2>
              <button
                onClick={() => { setShowModal(false); setNota(""); }}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Nota opcional (ej: nombre del local)
            </p>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleMarcar()}
              placeholder="Panadería La Esquina..."
              maxLength={150}
              className="w-full px-4 py-3 mb-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowModal(false); setNota(""); }}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarcar}
                disabled={marking}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                {marking ? (
                  <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" />
                ) : (
                  <FiMapPin size={14} />
                )}
                Marcar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
          <div className="glass w-full max-w-sm rounded-[2rem] p-6">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-2">
              Eliminar punto
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
              {deleteTarget.nota || "Sin nota"} · {formatHora(deleteTarget.hora)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
