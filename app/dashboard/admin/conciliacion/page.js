// app/dashboard/admin/conciliacion/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";
import {
  FiShield,
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiCheck,
  FiX,
  FiImage,
  FiLoader,
  FiAlertTriangle,
  FiRotateCcw,
  FiUser,
  FiCalendar,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ConfirmModal from "@/app/components/ConfirmModal";
import { formatMoney } from "@/app/utils/format";

function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function SolicitudCard({ solicitud, onVerComprobante, onAccion, actioning, modo }) {
  const esPendiente = modo === "pendiente";
  return (
    <div className="glass rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-[13px] font-black text-slate-800 dark:text-white truncate">
            {solicitud.tienda_nombre}
            <span className="ml-1.5 text-[10px] font-black text-slate-400">#{solicitud.tienda_id}</span>
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {solicitud.plan} · {formatMoney(solicitud.monto_plan)}
          </p>
        </div>
        <span className="shrink-0 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[11px] font-black font-mono tracking-wider">
          {solicitud.codigo}
        </span>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
          <FiUser size={11} className="shrink-0 text-slate-400" />
          <span className="truncate">Solicita: {solicitud.solicitante || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
          <FiCalendar size={11} className="shrink-0 text-slate-400" />
          <span>
            {esPendiente
              ? `Solicitada: ${formatFecha(solicitud.creada)}`
              : `Confirmada: ${formatFecha(solicitud.procesada)}`}
          </span>
        </div>
        {!esPendiente && solicitud.revisor && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <FiCheck size={11} className="shrink-0 text-emerald-500" />
            <span className="truncate">Revisó: {solicitud.revisor}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {solicitud.tiene_comprobante ? (
          <button
            onClick={() => onVerComprobante(solicitud.codigo)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 transition-all"
          >
            <FiImage size={12} /> Ver comprobante
          </button>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
            <FiAlertTriangle size={12} /> Sin comprobante
          </span>
        )}

        <div className="flex-1" />

        {esPendiente ? (
          <>
            <button
              onClick={() => onAccion(solicitud.codigo, "rechazar")}
              disabled={actioning === solicitud.codigo}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all disabled:opacity-50"
            >
              <FiX size={12} /> Rechazar
            </button>
            <button
              onClick={() => onAccion(solicitud.codigo, "confirmar")}
              disabled={actioning === solicitud.codigo}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-95"
            >
              {actioning === solicitud.codigo ? <FiLoader size={12} className="animate-spin" /> : <FiCheck size={12} />}
              Confirmar
            </button>
          </>
        ) : (
          <button
            onClick={() => onAccion(solicitud.codigo, "rechazar")}
            disabled={actioning === solicitud.codigo}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all disabled:opacity-50"
          >
            {actioning === solicitud.codigo ? <FiLoader size={12} className="animate-spin" /> : <FiRotateCcw size={12} />}
            Revertir
          </button>
        )}
      </div>
    </div>
  );
}

export default function ConciliacionPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [data, setData] = useState({ pendientes: [], confirmadas: [] });
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [comprobanteModal, setComprobanteModal] = useState(null);
  const [loadingComprobante, setLoadingComprobante] = useState(false);
  const [confirmReject, setConfirmReject] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/tiendas/solicitudes/revision/");
      if (!res.ok) throw new Error("No se pudo cargar la conciliación.");
      const json = await res.json();
      setData({ pendientes: json.pendientes || [], confirmadas: json.confirmadas || [] });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.is_superuser) fetchData();
  }, [isAuthenticated, user, fetchData]);

  const verComprobante = async (codigo) => {
    setLoadingComprobante(true);
    setComprobanteModal({ codigo, url: null });
    try {
      const res = await apiFetch(`/tiendas/solicitud/${codigo}/comprobante/ver/`);
      if (!res.ok) throw new Error("No se pudo cargar el comprobante.");
      const blob = await res.blob();
      setComprobanteModal({ codigo, url: URL.createObjectURL(blob) });
    } catch (error) {
      toast.error(error.message);
      setComprobanteModal(null);
    } finally {
      setLoadingComprobante(false);
    }
  };

  const cerrarModal = () => {
    if (comprobanteModal?.url) URL.revokeObjectURL(comprobanteModal.url);
    setComprobanteModal(null);
  };

  // El rechazo/reversión es destructivo: pide confirmación con ConfirmModal.
  // La confirmación de un pago es directa.
  const solicitarAccion = (codigo, resultado) => {
    if (resultado === "rechazar") {
      setConfirmReject(codigo);
    } else {
      ejecutarAccion(codigo, resultado);
    }
  };

  const ejecutarAccion = async (codigo, resultado) => {
    setActioning(codigo);
    try {
      const res = await apiFetch(`/tiendas/solicitud/${codigo}/revisar/`, {
        method: "POST",
        body: JSON.stringify({ resultado }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo procesar la solicitud.");
      }
      toast.success(resultado === "confirmar" ? "Pago confirmado." : "Pago rechazado.");
      setConfirmReject(null);
      fetchData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActioning(null);
    }
  };

  if (authLoading || !isAuthenticated) return <LoadingSpinner />;

  if (!user?.is_superuser) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <FiShield className="text-rose-500 mb-4" size={48} />
        <p className="text-lg font-black text-slate-800 dark:text-white uppercase">Acceso Restringido</p>
        <p className="text-xs text-slate-400 mt-2">Solo el usuario root puede acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="max-w-3xl mx-auto px-4 md:px-0">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">
              Conciliación de Pagos
            </h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Solicitudes de membresía
            </p>
          </div>
          <button
            onClick={fetchData}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>

        {loading ? (
          <div className="min-h-[300px] flex items-center justify-center"><LoadingSpinner /></div>
        ) : (
          <>
            {/* Esperando confirmación */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4 px-1">
                <FiClock className="text-amber-500" size={15} />
                <p className="text-[11px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                  Esperando confirmación
                </p>
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-md text-[10px] font-black">
                  {data.pendientes.length}
                </span>
              </div>
              {data.pendientes.length === 0 ? (
                <div className="glass rounded-[1.5rem] border-white/60 dark:border-slate-800 p-8 text-center">
                  <FiCheckCircle className="text-emerald-400 mx-auto mb-2" size={28} />
                  <p className="text-[11px] font-bold text-slate-400">No hay solicitudes pendientes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.pendientes.map((s) => (
                    <SolicitudCard
                      key={s.codigo}
                      solicitud={s}
                      modo="pendiente"
                      onVerComprobante={verComprobante}
                      onAccion={solicitarAccion}
                      actioning={actioning}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirmadas recientes */}
            <div>
              <div className="flex items-center gap-2 mb-4 px-1">
                <FiCheckCircle className="text-emerald-500" size={15} />
                <p className="text-[11px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                  Confirmadas (últimos 30 días)
                </p>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-md text-[10px] font-black">
                  {data.confirmadas.length}
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 mb-4 px-1 leading-relaxed">
                Cruza cada código con el concepto de tu extracto bancario. Si un pago no aparece, usa <b>Revertir</b>.
              </p>
              {data.confirmadas.length === 0 ? (
                <div className="glass rounded-[1.5rem] border-white/60 dark:border-slate-800 p-8 text-center">
                  <p className="text-[11px] font-bold text-slate-400">Sin pagos confirmados en el período.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.confirmadas.map((s) => (
                    <SolicitudCard
                      key={s.codigo}
                      solicitud={s}
                      modo="confirmada"
                      onVerComprobante={verComprobante}
                      onAccion={solicitarAccion}
                      actioning={actioning}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal comprobante */}
      {comprobanteModal && (
        <div
          className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={cerrarModal}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                Comprobante · {comprobanteModal.codigo}
              </p>
              <button onClick={cerrarModal} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                <FiX size={18} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center min-h-[200px] bg-slate-50 dark:bg-slate-950">
              {loadingComprobante || !comprobanteModal.url ? (
                <FiLoader className="animate-spin text-slate-400" size={28} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comprobanteModal.url}
                  alt="Comprobante"
                  className="max-w-full max-h-[70vh] object-contain rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmación de rechazo / reversión */}
      <ConfirmModal
        isOpen={!!confirmReject}
        onClose={() => setConfirmReject(null)}
        onConfirm={() => ejecutarAccion(confirmReject, "rechazar")}
        isLoading={actioning === confirmReject}
        title="¿Rechazar/revertir este pago?"
        message="La membresía volverá a estado Pendiente Pago."
        confirmText="Sí, rechazar"
        cancelText="Cancelar"
      />
    </div>
  );
}
