// app/dashboard/membresias/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  FiRefreshCw,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiZap,
  FiStar,
  FiShield,
  FiInfo,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney } from "../../utils/format";
import { apiFetch } from "../../utils/api";

const PLAN_PERIODS = { Prueba: 7, Mensual: 30, Anual: 365 };

const STATUS_CONFIG = {
  Activa: { label: "Activa", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600", border: "border-emerald-100 dark:border-emerald-800/30" },
  "Pendiente Pago": { label: "Pendiente", bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600", border: "border-amber-100 dark:border-amber-800/30" },
  Vencida: { label: "Vencida", bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-600", border: "border-rose-100 dark:border-rose-800/30" },
};

export default function MembresiasPage() {
  const { selectedStore, isAuthenticated, loading: authLoading } = useAuth();
  const [membresia, setMembresia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activating, setActivating] = useState(null); // 'mensual' | 'anual'

  const fetchMembresia = async () => {
    if (!selectedStore) return;
    try {
      setIsLoading(true);
      const response = await apiFetch(
        `/tiendas/detail/admin/${selectedStore.tienda.id}/`
      );
      if (!response.ok) throw new Error("No se pudo cargar la membresía.");
      const data = await response.json();
      setMembresia(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembresia();
  }, [selectedStore]);

  const activarPlan = async (tipo) => {
    if (!membresia) return;
    setActivating(tipo);
    try {
      const endpoint = tipo === "mensual"
        ? `/tiendas/activate/mounth/${membresia.id}/`
        : `/tiendas/activate/year/${membresia.id}/`;

      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error("Error al activar el plan.");
      toast.success(`Plan ${tipo === "mensual" ? "mensual" : "anual"} activado correctamente.`);
      // Recargar para actualizar selectedStore en el contexto (fecha_vencimiento)
      setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActivating(null);
    }
  };

  const getDaysRemaining = () => {
    if (!membresia) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(membresia.fecha_vencimiento);
    exp.setHours(0, 0, 0, 0);
    return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  };

  const getPeriodProgress = () => {
    if (!membresia) return 0;
    const inicio = new Date(membresia.fecha_activacion);
    const fin = new Date(membresia.fecha_vencimiento);
    const hoy = new Date();
    const total = fin - inicio;
    const elapsed = hoy - inicio;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      day: "numeric", month: "short", year: "numeric",
    });
  };


  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Verificando Membresía</p>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();
  const periodProgress = getPeriodProgress();
  const statusCfg = STATUS_CONFIG[membresia?.estado] || STATUS_CONFIG["Activa"];
  const planNombre = membresia?.membresia?.nombre || "—";

  const daysColor = daysRemaining > 15
    ? { bar: "bg-emerald-500", text: "text-emerald-600" }
    : daysRemaining > 5
      ? { bar: "bg-amber-500", text: "text-amber-600" }
      : { bar: "bg-rose-500", text: "text-rose-600" };

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="max-w-3xl mx-auto px-4 md:px-0">

        {/* Compact Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Membresía</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Suscripción • <span className="text-slate-400">{selectedStore.tienda.nombre}</span>
            </p>
          </div>
          <button
            onClick={fetchMembresia}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>

        {/* Status Card */}
        <div className="glass rounded-[2rem] border-white/60 dark:border-slate-800 shadow-2xl overflow-hidden mb-6">
          <div className="p-7 md:p-10">
            {/* Plan + Status badges */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                  <FiShield className="text-white" size={22} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Plan Activo</p>
                  <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{planNombre}</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                {statusCfg.label}
              </span>
            </div>

            {/* Days remaining + bar */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vigencia del Plan</p>
                <p className={`text-[11px] font-black uppercase tracking-widest ${daysColor.text}`}>
                  {daysRemaining > 0 ? `${daysRemaining} días restantes` : "Vencida"}
                </p>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${daysColor.bar} rounded-full transition-all duration-1000`}
                  style={{ width: `${Math.max(0, 100 - periodProgress)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                <span>{formatDate(membresia?.fecha_activacion)}</span>
                <span>{formatDate(membresia?.fecha_vencimiento)}</span>
              </div>
            </div>

            {/* Date info row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1.5">
                  <FiCalendar className="text-slate-400" size={13} />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Activación</p>
                </div>
                <p className="text-[13px] font-black text-slate-700 dark:text-slate-200">{formatDate(membresia?.fecha_activacion)}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1.5">
                  <FiClock className={daysColor.text + " "} size={13} />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vencimiento</p>
                </div>
                <p className={`text-[13px] font-black ${daysRemaining <= 5 ? daysColor.text : "text-slate-700 dark:text-slate-200"}`}>
                  {formatDate(membresia?.fecha_vencimiento)}
                </p>
              </div>
            </div>
          </div>

          {/* Warning banners */}
          {membresia?.estado === "Pendiente Pago" && (
            <div className="mx-6 mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl flex items-start gap-3">
              <FiAlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
              <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-tight leading-relaxed">
                Tu suscripción está pendiente de renovación. Activa un plan para continuar accediendo a todas las funciones.
              </p>
            </div>
          )}
          {membresia?.estado === "Vencida" && (
            <div className="mx-6 mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-3">
              <FiAlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
              <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-tight leading-relaxed">
                Tu membresía ha vencido. El acceso al sistema está restringido hasta que actives un nuevo plan.
              </p>
            </div>
          )}
        </div>

        {/* Renewal Plans */}
        <div className="mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Planes Disponibles</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Mensual */}
            <div className="glass p-7 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-xl relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <FiZap size={22} />
                  </div>
                  <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest">
                    30 Días
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">Plan Mensual</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Acceso completo por 30 días</p>

                {membresia?.membresia?.nombre === "Mensual" && (
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter mb-5">
                    {formatMoney(membresia.membresia.precio)}
                    <span className="text-[11px] font-black text-slate-400 ml-1">/ mes</span>
                  </p>
                )}

                <button
                  // onClick={() => activarPlan("mensual")}
                  disabled={true}
                  className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50"
                >
                  {activating === "mensual" ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><FiCheckCircle size={15} /> Activar Mensual</>
                  )}
                </button>
              </div>
            </div>

            {/* Anual */}
            <div className="bg-slate-900 dark:bg-indigo-600 p-7 rounded-[2rem] shadow-2xl shadow-slate-300/30 dark:shadow-none relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <FiStar size={22} />
                  </div>
                  <span className="px-3 py-1.5 bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
                    365 Días
                  </span>
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">Plan Anual</h3>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-5">Acceso completo por un año</p>

                {membresia?.membresia?.nombre === "Anual" && (
                  <p className="text-2xl font-black text-white tracking-tighter mb-5">
                    {formatMoney(membresia.membresia.precio)}
                    <span className="text-[11px] font-black text-white/50 ml-1">/ año</span>
                  </p>
                )}

                <button
                  // onClick={() => activarPlan("anual")}
                  disabled={true}
                  className="w-full py-3.5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-white/90 disabled:opacity-50"
                >
                  {activating === "anual" ? (
                    <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <><FiStar size={15} /> Activar Anual</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-4 px-5 py-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/60 dark:border-slate-800/50">
          <FiInfo className="text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" size={16} />
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Al activar un plan, la fecha de vencimiento se extiende desde la fecha actual. Contacte al administrador del sistema para gestionar pagos y facturación.
          </p>
        </div>

      </div>
    </div>
  );
}
