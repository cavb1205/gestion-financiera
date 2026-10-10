"use client";

import { useEffect, useRef, useState } from "react";
import { FiAlertTriangle, FiRefreshCw, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { apiFetch, getApiError } from "@/app/utils/api";
import { formatMoney } from "@/app/utils/format";
import { formatAppDate } from "@/app/utils/datetime";

export default function ManualMembershipExpiryModal({ detail, onClose, onReload }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const inFlightRef = useRef(false);
  const [snapshot, setSnapshot] = useState(detail);
  const [motivo, setMotivo] = useState("");
  const [annulPayment, setAnnulPayment] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // A conflict or an uncertain POST must be reconciled before another mutation.
  const [reloadRequired, setReloadRequired] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const pending = snapshot.solicitudes_pendientes || [];
  const manualPayments = (snapshot.pagos || []).filter(
    (payment) => payment.estado === "vigente" && !payment.codigo && String(payment.origen).toLowerCase() === "manual"
  );
  const validVersion = Number.isInteger(snapshot.membresia?.version);
  const validPayment = !annulPayment || manualPayments.some((payment) => String(payment.id) === paymentId);
  const reason = motivo.trim();
  const canSubmit = !busy && !reloadRequired && !recorded && validVersion
    && (!snapshot.membresia?.vencida_manualmente || annulPayment) && reason.length >= 5 && reason.length <= 500
    && validPayment && (!pending.length || acknowledged);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    cancelRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  const reload = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(true);
    try {
      const fresh = await onReload(snapshot.tienda.id);
      if (recorded) {
        if (!fresh.membresia?.vencida_manualmente) throw new Error("La membresía cambió nuevamente. Revisa su historial.");
        toast.success("Membresía vencida manualmente. Detalle actualizado.");
        onClose();
        return;
      }
      setSnapshot(fresh);
      setMotivo("");
      setAnnulPayment(false);
      setPaymentId("");
      setAcknowledged(false);
      setReloadRequired(false);
      setError(fresh.membresia?.vencida_manualmente
        ? "La membresía ya está vencida manualmente. Revisa el historial actualizado."
        : "Datos actualizados. Revisa los pagos y solicitudes antes de confirmar nuevamente.");
    } catch (err) {
      setError(`${recorded ? "El cambio fue registrado, pero" : "No"} se pudo actualizar el detalle. ${err.message}`);
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit || inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(true);
    setError("");
    let accepted = false;
    let receivedResponse = false;
    try {
      const response = await apiFetch(`/tiendas/${snapshot.tienda.id}/admin/vencer/`, {
        method: "POST",
        body: JSON.stringify({
          motivo: reason,
          version: snapshot.membresia.version,
          pago_id: annulPayment ? Number(paymentId) : null,
          confirmar_solicitudes_pendientes: acknowledged,
        }),
      });
      receivedResponse = true;
      if (response.status === 409) {
        setReloadRequired(true);
        setError("La membresía cambió desde que abriste el detalle. Recarga y revisa los datos antes de volver a confirmar.");
        return;
      }
      if (!response.ok) {
        if (response.status >= 500) setReloadRequired(true);
        throw new Error(await getApiError(response, "No se pudo vencer la membresía."));
      }
      accepted = true;
      setRecorded(true);
      const fresh = await onReload(snapshot.tienda.id);
      if (!fresh.membresia?.vencida_manualmente) throw new Error("No se pudo verificar el vencimiento manual.");
      toast.success("Membresía vencida manualmente. Detalle actualizado.");
      onClose();
    } catch (err) {
      if (accepted) {
        setError("El cambio fue registrado, pero no se pudo actualizar el detalle. Recarga para verificarlo; no vuelvas a enviarlo.");
      } else if (!receivedResponse) {
        setReloadRequired(true);
        setError(`${err.message} No pudimos verificar si el cambio fue registrado. Recarga antes de continuar.`);
      } else {
        setError(err.message);
      }
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="manual-expiry-title"
      aria-describedby="manual-expiry-description"
      aria-busy={busy}
      onCancel={(event) => { event.preventDefault(); if (!inFlightRef.current) onClose(); }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 sm:p-7 text-slate-800 dark:text-slate-100 shadow-2xl backdrop:bg-slate-950/75 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start gap-3 mb-5">
        <FiAlertTriangle className="text-rose-600 shrink-0 mt-1" size={24} />
        <div className="min-w-0 flex-1">
          <h2 id="manual-expiry-title" className="text-lg font-black">Vencer membresía manualmente</h2>
          <p className="mt-1 text-xs font-bold break-words">{snapshot.tienda.nombre} · #{snapshot.tienda.id}</p>
        </div>
        <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"><FiX size={18} /></button>
      </div>
      <p id="manual-expiry-description" className="p-4 mb-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-sm leading-relaxed text-rose-800 dark:text-rose-200">
        Bloquea inmediatamente el acceso operativo de esta ruta, sin período de gracia ni preactivación. Se conservan clientes, créditos y recaudos. Root mantiene acceso para administrarla.
      </p>
      <dl className="grid grid-cols-2 gap-3 mb-5 text-xs">
        <div className="col-span-2 min-w-0"><dt className="text-slate-500">Administrador</dt><dd className="font-bold break-words">{snapshot.admin?.nombre || snapshot.admin?.username || "—"}</dd></div>
        <div><dt className="text-slate-500">Plan actual</dt><dd className="font-bold">{snapshot.membresia?.plan || "—"}</dd></div>
        <div><dt className="text-slate-500">Vencimiento actual</dt><dd className="font-bold">{formatAppDate(snapshot.membresia?.fecha_vencimiento)}</dd></div>
      </dl>
      {snapshot.membresia?.vencida_manualmente && <p className="mb-4 text-sm text-rose-700 dark:text-rose-300">La ruta ya está vencida. Solo podrás confirmar si seleccionas un ingreso manual para corregir; la fecha del bloqueo se conservará.</p>}
      <form onSubmit={submit} className="space-y-5">
        <fieldset disabled={busy || recorded || reloadRequired} className="space-y-5 disabled:opacity-70">
          <div>
            <label htmlFor="manual-expiry-reason" className="block text-sm font-bold mb-2">Motivo obligatorio</label>
            <textarea id="manual-expiry-reason" required minLength={5} maxLength={500} rows={3} value={motivo} onChange={(event) => setMotivo(event.target.value)} aria-describedby="manual-expiry-reason-help" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            <p id="manual-expiry-reason-help" className="text-xs text-slate-500 mt-1">Entre 5 y 500 caracteres · {reason.length}/500. Queda registrado en el historial.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <label className="flex items-start gap-3 text-sm font-bold">
              <input type="checkbox" checked={annulPayment} disabled={!manualPayments.length} onChange={(event) => { setAnnulPayment(event.target.checked); setPaymentId(""); }} className="mt-1 accent-rose-600" />
              Anular también un pago manual registrado por error
            </label>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Opcional. El pago se conserva como anulado y deja de sumar a los ingresos. No se realiza ningún reembolso.</p>
            {!manualPayments.length && <p className="mt-2 text-xs text-slate-500">No hay pagos manuales vigentes para anular.</p>}
            {annulPayment && (
              <div className="mt-3">
                <label htmlFor="manual-expiry-payment" className="block text-xs font-bold mb-2">Pago a anular</label>
                <select id="manual-expiry-payment" required value={paymentId} onChange={(event) => setPaymentId(event.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 text-sm">
                  <option value="">Selecciona un pago</option>
                  {manualPayments.map((payment) => <option key={payment.id} value={payment.id}>#{payment.id} · {formatAppDate(payment.fecha)} · {payment.plan} · {formatMoney(payment.monto)}</option>)}
                </select>
              </div>
            )}
          </div>
          {pending.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Hay {pending.length} solicitud(es) de pago pendientes</p>
              <ul className="mt-2 space-y-1 text-xs text-amber-800 dark:text-amber-200 break-words">
                {pending.map((request) => <li key={request.codigo}>{request.codigo} · {request.plan} · {request.estado} · {formatAppDate(request.fecha)}</li>)}
              </ul>
              <label className="mt-3 flex items-start gap-3 text-sm leading-relaxed">
                <input type="checkbox" required checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1 accent-amber-600" />
                Entiendo que estas solicitudes seguirán pendientes. Esta acción no las cancela y su aprobación podría reactivar la membresía.
              </label>
            </div>
          )}
        </fieldset>
        {!validVersion && <p role="alert" className="text-sm text-rose-600">Falta la versión de la membresía. Recarga el detalle antes de continuar.</p>}
        {error && <p role="alert" className="p-3 text-sm rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200">{error}</p>}
        <button type="button" disabled={busy} onClick={reload} className="w-full flex justify-center items-center gap-2 rounded-xl py-3 border border-indigo-300 text-indigo-600 dark:text-indigo-300 font-bold disabled:opacity-50"><FiRefreshCw size={16} />{busy ? "Actualizando…" : "Recargar detalle"}</button>
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button ref={cancelRef} type="button" disabled={busy} onClick={onClose} className="flex-1 rounded-xl py-3 bg-slate-100 dark:bg-slate-800 font-bold text-sm disabled:opacity-50">{recorded ? "Cerrar" : "Cancelar"}</button>
          <button type="submit" disabled={!canSubmit} className="flex-1 rounded-xl py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">{busy ? "Procesando…" : "Vencer membresía"}</button>
        </div>
      </form>
    </dialog>
  );
}
