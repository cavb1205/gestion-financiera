// app/dashboard/admin/conciliacion/page.js
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import RootReadError, { useRootRead } from "../_components/RootReadState";
import { formatMoney } from "@/app/utils/format";
import { formatAppDateTime } from "@/app/utils/datetime";

function formatFecha(iso) {
  if (!iso) return "—";
  return formatAppDateTime(iso, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function SolicitudCard({ solicitud, onVerComprobante, onAccion, actioning, modo }) {
  const esExpirada = modo === "expirada";
  const esPendiente = modo === "pendiente" || esExpirada;
  const [montoVerificado, setMontoVerificado] = useState("");
  const requiereMonto = esPendiente && solicitud.requiere_revision_monto;
  const importeValido = /^[0-9]{1,10}$/.test(montoVerificado);
  return (
    <div className="glass rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-[13px] font-black text-slate-800 dark:text-white truncate">
            {solicitud.tienda_nombre}
            <span className="ml-1.5 text-[10px] font-black text-slate-400">#{solicitud.tienda_id}</span>
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {solicitud.plan} · {solicitud.monto_plan == null ? "Monto por verificar" : formatMoney(solicitud.monto_plan)}
          </p>
        </div>
        <span className="shrink-0 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[11px] font-black font-mono tracking-wider">
          {solicitud.codigo}
        </span>
      </div>

      <p className="text-xs mb-3 break-words">Referencia bancaria: {solicitud.referencia_bancaria || "No informada"}</p>
      <p className="text-xs mb-3 break-words">Cuenta informada: {solicitud.cuenta_historica_verificable
        ? `${solicitud.cuenta_acordada.banco} · ${solicitud.cuenta_acordada.numero}` : "Sin registro de la cuenta original"}</p>
      {solicitud.monto_detectado != null && <p className="text-xs mb-3">Importe detectado (sin verificar): {formatMoney(solicitud.monto_detectado)}</p>}
      {solicitud.motivo_revision && <p className="text-xs mb-3 break-words">Motivo registrado: {solicitud.motivo_revision}</p>}
      {solicitud.confirmada_fuera_plazo && <p className="text-xs mb-3 text-amber-600">Confirmada fuera de plazo por excepción.</p>}
      {esExpirada && <p className="text-xs mb-3 text-amber-600">Plazo de revisión vencido. No se confirma automáticamente ni desde Telegram.</p>}

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
              : `${modo === "confirmada" ? "Confirmada" : "Revisada"}: ${formatFecha(solicitud.procesada)}`}
          </span>
        </div>
        {!esPendiente && solicitud.revisor && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <FiCheck size={11} className="shrink-0 text-emerald-500" />
            <span className="truncate">Revisó: {solicitud.revisor}</span>
          </div>
        )}
      </div>

      {requiereMonto && <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-300">
        <p className="mb-2">Solicitud anterior sin precio original guardado. Revisa el comprobante y el ingreso bancario; no se usará la tarifa actual automáticamente.</p>
        <label htmlFor={`monto-${solicitud.codigo}`}>Importe verificado en el comprobante</label>
        <input id={`monto-${solicitud.codigo}`} inputMode="numeric" maxLength={10} value={montoVerificado}
          disabled={!!actioning} onChange={(event) => setMontoVerificado(event.target.value.replace(/[^\d]/g, ""))}
          className="mt-1 w-full rounded-lg border border-amber-200 bg-white p-2 text-slate-800" />
      </div>}
      <div className="flex flex-wrap items-center gap-2">
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

        <div className="hidden sm:block flex-1" />

        {esPendiente ? (
          <>
            {!esExpirada && <button
              onClick={() => onAccion(solicitud.codigo, "rechazar")}
              disabled={!!actioning}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all disabled:opacity-50"
            >
              <FiX size={12} /> Rechazar
            </button>}
            <button
              onClick={() => onAccion(solicitud.codigo, esExpirada ? "excepcion" : "confirmar", requiereMonto ? Number(montoVerificado) : undefined)}
              disabled={!!actioning || (requiereMonto && !importeValido)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-95"
            >
              {actioning === solicitud.codigo ? <FiLoader size={12} className="animate-spin" /> : <FiCheck size={12} />}
              {esExpirada ? "Revisar excepción" : "Confirmar"}
            </button>
          </>
        ) : modo === "confirmada" ? (
          <button
            onClick={() => onAccion(solicitud.codigo, "revertir")}
            disabled={!!actioning}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all disabled:opacity-50"
          >
            {actioning === solicitud.codigo ? <FiLoader size={12} className="animate-spin" /> : <FiRotateCcw size={12} />}
            Revertir
          </button>
        ) : <span className="text-xs">Rechazada o revertida · solo consulta</span>}
      </div>
    </div>
  );
}

export default function ConciliacionPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [data, setData] = useState({ pendientes: [], confirmadas: [], vencidas: [], revisadas: [] });
  const { read, loading, loadError, hasLoaded } = useRootRead();
  const [actioning, setActioning] = useState(null);
  const [comprobanteModal, setComprobanteModal] = useState(null);
  const [loadingComprobante, setLoadingComprobante] = useState(false);
  const [review, setReview] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [bankVerified, setBankVerified] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [dias, setDias] = useState(30);
  const actionRef = useRef(false);
  const imageRequestRef = useRef(0);
  const imageUrlRef = useRef(null);

  const fetchData = useCallback(async () => {
    return read(`/tiendas/solicitudes/revision/?dias=${dias}`, (json) => {
      if (!Array.isArray(json?.pendientes) || !Array.isArray(json?.confirmadas)) throw new Error("Respuesta de conciliación incompleta.");
      setData({ pendientes: json.pendientes, confirmadas: json.confirmadas, vencidas: json.vencidas || [], revisadas: json.revisadas || [] });
      setReview(null);
    }, "No se pudo cargar la conciliación.");
  }, [read, dias]);

  useEffect(() => {
    if (isAuthenticated && user?.is_superuser) fetchData();
  }, [isAuthenticated, user, fetchData]);

  const verComprobante = async (codigo) => {
    const request = ++imageRequestRef.current;
    setLoadingComprobante(true);
    setComprobanteModal({ codigo, url: null });
    try {
      const res = await apiFetch(`/tiendas/solicitud/${codigo}/comprobante/ver/`);
      if (!res.ok) throw new Error("No se pudo cargar el comprobante.");
      const blob = await res.blob();
      if (request !== imageRequestRef.current) return;
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = URL.createObjectURL(blob);
      setComprobanteModal({ codigo, url: imageUrlRef.current });
    } catch (error) {
      if (request !== imageRequestRef.current) return;
      toast.error(error.message);
      setComprobanteModal(null);
    } finally {
      if (request === imageRequestRef.current) setLoadingComprobante(false);
    }
  };

  const cerrarModal = () => {
    imageRequestRef.current += 1;
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = null;
    setComprobanteModal(null);
  };
  useEffect(() => () => {
    imageRequestRef.current += 1;
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
  }, []);

  const solicitarAccion = (codigo, resultado, montoConfirmado) => {
    if (actionRef.current || loading || loadError || !hasLoaded) return;
    const solicitud = [...data.pendientes, ...data.confirmadas, ...data.vencidas].find(item => item.codigo === codigo);
    setReview({ solicitud, codigo, resultado, montoConfirmado });
    setMotivo(""); setBankVerified(false); setReviewError("");
  };

  const requiereMotivo = review && review.resultado !== "confirmar";
  const aprobacion = review && ["confirmar", "excepcion"].includes(review.resultado);
  const reviewValid = review && (!requiereMotivo || motivo.trim().length >= 5) && (!aprobacion || bankVerified);
  const ejecutarAccion = async () => {
    if (actionRef.current || !reviewValid || loading || loadError) return;
    const { codigo, resultado, montoConfirmado } = review;
    actionRef.current = true;
    setActioning(codigo);
    try {
      const res = await apiFetch(`/tiendas/solicitud/${codigo}/revisar/`, {
        method: "POST",
        body: JSON.stringify({ resultado: resultado === "excepcion" ? "confirmar" : resultado,
          ...(resultado === "excepcion" ? { confirmar_expirada: true } : {}), motivo: motivo.trim(),
          ...(montoConfirmado !== undefined ? { monto_confirmado: montoConfirmado } : {}) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo procesar la solicitud.");
      }
      const result = await res.json();
      toast.success(`${result.message || "Operación registrada."}${result.estado_membresia ? ` Estado: ${result.estado_membresia}. Vigencia: ${result.fecha_vencimiento}.` : ""}`);
      setReview(null);
      await fetchData();
    } catch (error) {
      toast.error(error.message);
      setReviewError(`${error.message} Recarga y revisa el estado antes de intentar otra acción.`);
    } finally {
      actionRef.current = false;
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

  if (loadError && !loading) return <RootReadError message={loadError} onRetry={fetchData} hasLoaded={hasLoaded} />;

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
            aria-label="Recargar conciliación"
            disabled={!!actioning}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
        <label className="text-sm">Período de revisión <select value={dias} onChange={event => setDias(Number(event.target.value))}
          disabled={!!actioning} className="mb-4 rounded-lg border p-2 dark:bg-slate-800">
          {[30, 90, 365].map(value => <option key={value} value={value}>Últimos {value} días</option>)}
        </select></label>

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
                  Confirmadas (últimos {dias} días)
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
            {[
              ["Comprobantes fuera de plazo", data.vencidas, "expirada"],
              ["Rechazadas o revertidas", data.revisadas, "historico"],
            ].map(([title, solicitudes, modo]) => <section key={modo} className="mt-8">
              <h2 className="font-bold mb-3">{title} · {solicitudes.length}</h2>
              {solicitudes.length === 0 ? <p className="text-sm">Sin registros en este período.</p> : <div className="space-y-3">
                {solicitudes.map(solicitud => <SolicitudCard key={solicitud.codigo} solicitud={solicitud} modo={modo}
                  onVerComprobante={verComprobante} onAccion={solicitarAccion} actioning={actioning} />)}
              </div>}
            </section>)}
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

      <ConfirmModal
        isOpen={!!review}
        onClose={() => { if (!actionRef.current) setReview(null); }}
        onConfirm={ejecutarAccion}
        isLoading={!!actioning}
        confirmDisabled={!reviewValid || !!reviewError}
        title={review?.resultado === "revertir" ? "Revertir pago confirmado" : review?.resultado === "rechazar" ? "Rechazar comprobante" : review?.resultado === "excepcion" ? "Confirmar pago fuera de plazo" : "Confirmar pago"}
        message={review?.resultado === "revertir" ? "Se anulará el ingreso conservando el historial y se restaurará la vigencia anterior, solo si no hubo cambios posteriores. No se realiza un reembolso ni se garantiza que la ruta quede pendiente de pago."
          : review?.resultado === "rechazar" ? "Se rechazará este comprobante. No se registrará un ingreso ni se desharán renovaciones pagadas posteriores."
          : "Verifica el dinero recibido, no solo la imagen. Se activará o extenderá la membresía y la ruta volverá a estar visible."}
        confirmText={review?.resultado === "revertir" ? "Confirmar reversión" : review?.resultado === "rechazar" ? "Confirmar rechazo" : "Registrar confirmación"}
        cancelText="Cancelar"
      >
        <p className="text-sm mb-3">{review?.solicitud?.tienda_nombre} · {review?.codigo} · Importe: {formatMoney(review?.montoConfirmado ?? review?.solicitud?.monto_plan)}</p>
        {aprobacion && review?.solicitud?.vigencia_prevista && <p className="text-sm mb-3">Vencimiento previsto: {review.solicitud.vigencia_prevista.actual} → {review.solicitud.vigencia_prevista.propuesta}. Se comprobará nuevamente al guardar.</p>}
        {review?.resultado === "revertir" && <p className="text-sm mb-3">Vencimiento anterior al pago: {review.solicitud.fecha_vencimiento_previa || 'Revisión histórica necesaria'}.</p>}
        {aprobacion && <label className="flex gap-2 text-sm mb-3"><input type="checkbox" checked={bankVerified} disabled={!!actioning}
          onChange={event => setBankVerified(event.target.checked)} />Verifiqué el ingreso bancario y el importe</label>}
        {requiereMotivo && <><label htmlFor="motivo-revision">Motivo de la revisión</label>
          <textarea id="motivo-revision" value={motivo} maxLength={500} disabled={!!actioning} onChange={event => setMotivo(event.target.value)}
            className="w-full border rounded-lg p-2 mt-1 dark:bg-slate-800" /></>}
        {reviewError && <div role="alert" className="mt-3 text-sm text-amber-600">{reviewError}
          <button onClick={fetchData} className="block mt-2 underline">Recargar revisión</button>
        </div>}
      </ConfirmModal>
    </div>
  );
}
