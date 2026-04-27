// app/dashboard/membresias/page.js
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  FiMessageCircle,
  FiCopy,
  FiCheck,
  FiX,
  FiLoader,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney } from "../../utils/format";
import { apiFetch } from "../../utils/api";

const STATUS_CONFIG = {
  Activa: { label: "Activa", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600", border: "border-emerald-100 dark:border-emerald-800/30" },
  "Pre-activada": { label: "Pre-activada", bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600", border: "border-amber-100 dark:border-amber-800/30" },
  "Pendiente Pago": { label: "Pendiente", bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600", border: "border-amber-100 dark:border-amber-800/30" },
  Vencida: { label: "Vencida", bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-600", border: "border-rose-100 dark:border-rose-800/30" },
};

function CopyButton({ value, small }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("No se pudo copiar");
    }
  };
  return (
    <button
      onClick={handleCopy}
      className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${small ? "text-[9px]" : "text-[10px]"} font-black uppercase tracking-widest ${copied ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600"}`}
    >
      {copied ? <FiCheck size={10} /> : <FiCopy size={10} />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

function Countdown({ expira, onExpired }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expira) - new Date();
      if (diff <= 0) {
        setRemaining("Expirado");
        onExpired?.();
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expira, onExpired]);

  return <span className="font-mono">{remaining}</span>;
}

export default function MembresiasPage() {
  const router = useRouter();
  const { selectedStore, isAuthenticated, loading: authLoading, refreshSelectedStore } = useAuth();
  const [membresia, setMembresia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requesting, setRequesting] = useState(null); // 'Mensual' | 'Anual'
  const [solicitud, setSolicitud] = useState(null); // active payment request
  const pollingRef = useRef(null);

  const fetchMembresia = useCallback(async () => {
    if (!selectedStore) return;
    try {
      setIsLoading(true);
      const response = await apiFetch(`/tiendas/detail/admin/${selectedStore.tienda.id}/`);
      if (!response.ok) throw new Error("No se pudo cargar la membresía.");
      const data = await response.json();
      setMembresia(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStore]);

  useEffect(() => {
    fetchMembresia();
  }, [fetchMembresia]);

  // Polling: check solicitud state every 10s
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const handleSolicitudUpdate = useCallback(async (codigo) => {
    try {
      const res = await apiFetch(`/tiendas/solicitud-pago/${codigo}/`);
      if (!res.ok) { stopPolling(); return; }
      const data = await res.json();
      setSolicitud(prev => ({ ...prev, ...data }));

      if (data.estado === "aprobada") {
        stopPolling();
        toast.success("✅ Pago confirmado. Tu membresía está activa.");
        await refreshSelectedStore?.();
        setTimeout(() => router.push("/dashboard"), 1500);
      } else if (data.estado === "pre_aprobada") {
        stopPolling();
        toast.warning(`⏳ Comprobante en revisión. Tienes 3 días de acceso mientras verificamos.`);
        fetchMembresia();
      } else if (data.estado === "rechazada") {
        stopPolling();
        toast.error(`❌ Pago rechazado: ${data.motivo_rechazo || "verifica el comprobante."}`);
      } else if (data.estado === "expirada") {
        stopPolling();
        setSolicitud(prev => ({ ...prev, estado: "expirada" }));
      }
    } catch { /* ignore network errors during polling */ }
  }, [stopPolling, refreshSelectedStore, router, fetchMembresia]);

  const startPolling = useCallback((codigo) => {
    stopPolling();
    pollingRef.current = setInterval(() => handleSolicitudUpdate(codigo), 10000);
  }, [stopPolling, handleSolicitudUpdate]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const solicitarPago = async (plan) => {
    setRequesting(plan);
    try {
      const res = await apiFetch("/tiendas/solicitar-pago/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, tienda_id: selectedStore.tienda.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al generar el código de pago.");
      }
      const data = await res.json();
      setSolicitud({
        ...data,
        estado: "pendiente",
        cuenta_banco:    process.env.NEXT_PUBLIC_CUENTA_BANCO    || '',
        cuenta_numero:   process.env.NEXT_PUBLIC_CUENTA_NUMERO   || '',
        cuenta_titular:  process.env.NEXT_PUBLIC_CUENTA_TITULAR  || '',
        cuenta_tipo:     process.env.NEXT_PUBLIC_CUENTA_TIPO     || '',
      });
      startPolling(data.codigo);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRequesting(null);
    }
  };

  const cancelarSolicitud = () => {
    stopPolling();
    setSolicitud(null);
  };

  const getMembresiaInfo = () => {
    if (!membresia) return { days: 0, graceDays: 0, memStatus: "expired" };
    const [y, m, d] = membresia.fecha_vencimiento.split("-").map(Number);
    const vence = new Date(y, m - 1, d);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const pendientePago = new Date(vence); pendientePago.setDate(pendientePago.getDate() + 1);
    const vencida = new Date(vence); vencida.setDate(vencida.getDate() + 3);
    const days = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24));
    const graceDays = Math.ceil((vencida - hoy) / (1000 * 60 * 60 * 24));
    let memStatus;
    if (hoy >= vencida) memStatus = "expired";
    else if (hoy >= pendientePago) memStatus = "grace";
    else if (days === 0) memStatus = "today";
    else memStatus = days <= 7 ? "warn" : "ok";
    return { days, graceDays, memStatus };
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

  const { days: daysRemaining, graceDays, memStatus } = getMembresiaInfo();
  const periodProgress = getPeriodProgress();
  const statusCfg = STATUS_CONFIG[membresia?.estado] || STATUS_CONFIG["Activa"];
  const planNombre = membresia?.membresia?.nombre || "—";

  const daysColor = memStatus === "ok"
    ? { bar: "bg-emerald-500", text: "text-emerald-600" }
    : memStatus === "warn" || memStatus === "today"
      ? { bar: "bg-amber-500", text: "text-amber-600" }
      : { bar: "bg-rose-500", text: "text-rose-600" };

  const daysLabel = memStatus === "expired"
    ? "Acceso bloqueado"
    : memStatus === "grace"
      ? `Gracia · ${graceDays} día${graceDays !== 1 ? "s" : ""} para bloqueo`
      : memStatus === "today"
        ? `Vence hoy · ${graceDays} día${graceDays !== 1 ? "s" : ""} de gracia`
        : `${daysRemaining} día${daysRemaining !== 1 ? "s" : ""} restantes`;

  const solicitudActiva = solicitud && !["rechazada", "expirada"].includes(solicitud.estado);

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="max-w-3xl mx-auto px-4 md:px-0">

        {/* Header */}
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

            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vigencia del Plan</p>
                <p className={`text-[11px] font-black uppercase tracking-widest ${daysColor.text}`}>{daysLabel}</p>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${daysColor.bar} rounded-full transition-all duration-1000`} style={{ width: `${Math.max(0, 100 - periodProgress)}%` }} />
              </div>
              <div className="flex items-center justify-between text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                <span>{formatDate(membresia?.fecha_activacion)}</span>
                <span>{formatDate(membresia?.fecha_vencimiento)}</span>
              </div>
            </div>

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
                  <FiClock className={daysColor.text} size={13} />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vencimiento</p>
                </div>
                <p className={`text-[13px] font-black ${memStatus !== "ok" ? daysColor.text : "text-slate-700 dark:text-slate-200"}`}>
                  {formatDate(membresia?.fecha_vencimiento)}
                </p>
              </div>
            </div>
          </div>

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
          {membresia?.estado === "Pre-activada" && (
            <div className="mx-6 mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl flex items-start gap-3">
              <FiAlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
              <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-tight leading-relaxed">
                Tu pago está en revisión manual. Tienes acceso temporal mientras verificamos el comprobante.
              </p>
            </div>
          )}
        </div>

        {/* Active Payment Request Card */}
        {solicitudActiva && (
          <div className="mb-6 glass rounded-[2rem] border-indigo-200 dark:border-indigo-800/40 shadow-2xl overflow-hidden">
            <div className="p-7 md:p-10">

              {/* Header row */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Solicitud de Pago</p>
                  <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Plan {solicitud.plan}</p>
                </div>
                <div className="flex items-center gap-2">
                  {solicitud.estado === "procesando" && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest">
                      <FiLoader size={9} className="animate-spin" /> Validando
                    </span>
                  )}
                  {solicitud.estado === "pendiente" && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest">
                      <FiClock size={9} /> Esperando
                    </span>
                  )}
                  <button
                    onClick={cancelarSolicitud}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    title="Cancelar"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>

              {/* Big code */}
              <div className="mb-6 p-5 bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800/60 rounded-2xl">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Tu Código de Pago</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300 tracking-widest font-mono">{solicitud.codigo}</p>
                  <CopyButton value={solicitud.codigo} />
                </div>
                <p className="text-[10px] text-indigo-400 mt-2 font-semibold">
                  Válido por: <Countdown expira={solicitud.expira} onExpired={() => setSolicitud(p => ({ ...p, estado: "expirada" }))} />
                </p>
              </div>

              {/* Monto */}
              <div className="mb-5 flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl">
                <div>
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Monto a Transferir</p>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">{formatMoney(solicitud.monto)}</p>
                </div>
                <CopyButton value={solicitud.monto} />
              </div>

              {/* Account data */}
              <div className="mb-6 space-y-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Datos de la Cuenta</p>
                {[
                  { label: "Banco", value: solicitud.cuenta_banco },
                  { label: "Número / Cuenta", value: solicitud.cuenta_numero },
                  { label: "Titular", value: solicitud.cuenta_titular },
                  { label: "Tipo", value: solicitud.cuenta_tipo },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="flex items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                      <p className="text-[13px] font-black text-slate-700 dark:text-slate-200 truncate">{value}</p>
                    </div>
                    <CopyButton value={value} small />
                  </div>
                ) : null)}
              </div>

              {/* WhatsApp button */}
              <a
                href={solicitud.wa_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2.5 active:scale-95 transition-all shadow-lg shadow-emerald-100 dark:shadow-none mb-4"
              >
                <FiMessageCircle size={16} /> Abrir WhatsApp con Comprobante
              </a>

              {/* Steps */}
              <div className="space-y-2.5">
                {[
                  "Transfiere el monto exacto a la cuenta indicada.",
                  "Abre WhatsApp con el botón de arriba.",
                  "Adjunta la foto del comprobante y envía (el código ya está en el mensaje).",
                  "Espera la confirmación automática — puede tardar hasta 30 segundos.",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 text-[9px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{step}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* Solicitud rechazada / expirada notice */}
        {solicitud && ["rechazada", "expirada"].includes(solicitud.estado) && (
          <div className="mb-6 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 rounded-2xl flex items-start gap-3">
            <FiAlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-tight">
                {solicitud.estado === "expirada" ? "Código expirado — genera uno nuevo." : `Pago rechazado: ${solicitud.motivo_rechazo || "verifica el comprobante."}`}
              </p>
            </div>
            <button onClick={() => setSolicitud(null)} className="text-rose-400 hover:text-rose-600 shrink-0">
              <FiX size={14} />
            </button>
          </div>
        )}

        {/* Plans — hide while a solicitud is pending/processing */}
        {!solicitudActiva && (
          <div className="mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Planes Disponibles</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Mensual */}
              <div className="glass p-7 rounded-[2rem] border-white/60 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center">
                      <FiZap size={22} />
                    </div>
                    <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest">30 Días</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">Plan Mensual</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Acceso completo por 30 días</p>
                  {membresia?.membresia?.nombre === "Mensual" && (
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter mb-5">
                      {formatMoney(membresia.membresia.precio)}<span className="text-[11px] font-black text-slate-400 ml-1">/ mes</span>
                    </p>
                  )}
                  <button
                    onClick={() => solicitarPago("Mensual")}
                    disabled={!!requesting}
                    className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {requesting === "Mensual" ? <FiLoader size={15} className="animate-spin" /> : <FiZap size={15} />}
                    {requesting === "Mensual" ? "Generando código..." : "Pagar Plan Mensual"}
                  </button>
                </div>
              </div>

              {/* Anual */}
              <div className="bg-slate-900 dark:bg-indigo-600 p-7 rounded-[2rem] shadow-2xl shadow-slate-300/30 dark:shadow-none relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <FiStar size={22} />
                    </div>
                    <span className="px-3 py-1.5 bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">365 Días</span>
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">Plan Anual</h3>
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-5">Acceso completo por un año</p>
                  {membresia?.membresia?.nombre === "Anual" && (
                    <p className="text-2xl font-black text-white tracking-tighter mb-5">
                      {formatMoney(membresia.membresia.precio)}<span className="text-[11px] font-black text-white/50 ml-1">/ año</span>
                    </p>
                  )}
                  <button
                    onClick={() => solicitarPago("Anual")}
                    disabled={!!requesting}
                    className="w-full py-3.5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {requesting === "Anual" ? <FiLoader size={15} className="animate-spin" /> : <FiStar size={15} />}
                    {requesting === "Anual" ? "Generando código..." : "Pagar Plan Anual"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        {!solicitudActiva && (
          <div className="glass rounded-[1.5rem] p-6 border border-white/60 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">¿Cómo funciona?</p>
            <div className="space-y-3">
              {[
                "Toca el botón del plan y se genera tu código único.",
                "Transfiere el monto exacto a los datos de la cuenta.",
                "Abre WhatsApp y envía el comprobante con el código.",
                "La IA valida el pago automáticamente en segundos.",
                "Tu membresía se activa sin intervención manual.",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                  <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
