"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import { FiRefreshCw, FiCalendar, FiCheckCircle, FiAlertCircle, FiClock, FiCopy, FiCheck, FiLoader, FiUploadCloud, FiX, FiArrowRight, FiMessageCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney } from "@/app/utils/format";
import { apiFetch, getApiError } from "@/app/utils/api";
import { formatAppDate, getAppDateString } from "@/app/utils/datetime";
import { textoTransferencia, faseRenovacion, estadoAcceso } from "@/app/utils/membresia.mjs";

const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "";
const PRIMARY = "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";
const PANEL = "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7";
const TONES = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
};

function CopyButton({ value, label = "Copiar", disabled = false }) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef(null);
  useEffect(() => () => clearTimeout(timeout.current), []);
  return <button type="button" disabled={disabled} onClick={async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("No se pudo copiar. Puedes seleccionar el texto y copiarlo manualmente."); }
  }} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">
    {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}<span aria-live="polite">{copied ? "Copiado" : label}</span>
  </button>;
}

function Expiry({ value, onExpired }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    let expired = false;
    const tick = () => {
      const difference = new Date(value).getTime() - Date.now();
      if (!Number.isFinite(difference)) { setRemaining("Consulta el estado antes de transferir"); return; }
      if (difference <= 0) {
        setRemaining("Código vencido. Actualizando…");
        if (!expired) { expired = true; onExpired(); }
        return;
      }
      setRemaining(`Código válido por ${Math.floor(difference / 3600000)} h ${Math.floor(difference % 3600000 / 60000)} min`);
    };
    tick();
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, [value, onExpired]);
  return <p className="text-xs text-slate-500 dark:text-slate-400">{remaining}</p>;
}

export default function MembresiasPage() {
  const auth = useAuth();
  if (auth.loading || !auth.isAuthenticated || !auth.selectedStore) return <LoadingSpinner />;
  // Cada ruta tiene su propio formulario, comprobante y solicitudes en curso.
  return <Renovacion key={auth.selectedStore.tienda.id} store={auth.selectedStore} refreshStore={auth.refreshSelectedStore} />;
}

function Renovacion({ store, refreshStore }) {
  const router = useRouter();
  const id = store.tienda.id;
  const [membership, setMembership] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [monthly, setMonthly] = useState(null);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [continuePayment, setContinuePayment] = useState(false);
  const [paymentUncertain, setPaymentUncertain] = useState(false);
  const mounted = useRef(false);
  const sequence = useRef(0);
  const writing = useRef(false);
  const observedVersion = useRef(store.version);
  const requestCode = useRef(null);

  const load = useCallback(async () => {
    const current = ++sequence.current;
    setRefreshing(true);
    try {
      const paths = [`/tiendas/detail/admin/${id}/?vista=membresia`, "/tiendas/planes/", `/tiendas/solicitud-pago/actual/t/${id}/?incluir_ultima=1`];
      const [mem, plans, actual] = await Promise.all(paths.map(async path => {
        const response = await apiFetch(path, { cache: "no-store" });
        if (!response.ok) throw new Error(await getApiError(response, "No se pudo verificar la renovación. Intenta actualizar."));
        return response.json();
      }));
      if (!mem?.fecha_vencimiento || !mem.renovacion_mensual?.hasta || !Array.isArray(plans) || !Object.hasOwn(actual, "solicitud")) {
        throw new Error("No se pudo verificar la información de renovación. Actualiza o contacta a soporte.");
      }
      if (!mounted.current || current !== sequence.current) return;
      setMembership(mem);
      setNow(new Date());
      setMonthly(plans.find(plan => plan.nombre === "Mensual") || null);
      if ((actual.solicitud?.codigo || null) !== requestCode.current) {
        requestCode.current = actual.solicitud?.codigo || null;
        setFile(null); setPreview(""); setContinuePayment(false); setPaymentUncertain(false);
      } else if (actual.solicitud?.estado !== "pendiente") {
        setFile(null); setPreview("");
      }
      setRequest(actual.solicitud);
      setError("");
      if (mem.version !== observedVersion.current) {
        observedVersion.current = mem.version;
        await refreshStore?.({ membershipOnly: true });
      }
    } catch (problem) {
      if (mounted.current && current === sequence.current) setError(problem.message || "No se pudo verificar la renovación.");
    } finally {
      if (mounted.current && current === sequence.current) { setLoading(false); setRefreshing(false); }
    }
  }, [id, refreshStore]);

  useEffect(() => {
    mounted.current = true;
    const initialRead = setTimeout(load, 0);
    const refresh = () => { if (document.visibilityState === "visible" && !writing.current) load(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(initialRead);
      mounted.current = false;
      sequence.current += 1;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  const phase = faseRenovacion(request);
  useEffect(() => {
    if (phase !== "revision") return;
    const timer = setInterval(() => { if (!writing.current && document.visibilityState === "visible") load(); }, 10000);
    return () => clearInterval(timer);
  }, [phase, load]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const resetFile = () => { setFile(null); setPreview(""); };
  const mutate = async (action, path, options) => {
    if (writing.current || refreshing || error) return;
    writing.current = true;
    sequence.current += 1;
    setBusy(action);
    try {
      const response = await apiFetch(path, options);
      if (!response.ok) throw new Error(await getApiError(response, "No se pudo completar la operación. Actualiza el estado antes de reintentar."));
      const result = await response.json();
      if (!mounted.current) return;
      if (action === "renew") { requestCode.current = result.codigo; setRequest(result); setContinuePayment(true); resetFile(); setPaymentUncertain(false); }
      else if (action === "cancel") { setContinuePayment(false); resetFile(); }
      else if (action === "upload") { setContinuePayment(false); resetFile(); }
      await load();
    } catch (problem) {
      if (mounted.current) {
        setError(`${problem.message} Verifica el estado con «Actualizar» antes de volver a intentarlo.`);
        if (action === "upload") setPaymentUncertain(true);
      }
    } finally {
      writing.current = false;
      if (mounted.current) setBusy("");
    }
  };

  const upload = () => {
    if (!file || !request) return;
    const data = new FormData(); data.append("comprobante", file);
    mutate("upload", `/tiendas/solicitud-pago/${request.codigo}/comprobante/`, { method: "POST", body: data });
  };
  const renew = () => mutate("renew", "/tiendas/solicitar-pago/", { method: "POST", body: JSON.stringify({ plan: "Mensual", tienda_id: id }) });

  if (loading) return <LoadingSpinner />;
  const disabled = !!busy || refreshing || !!error;
  const zone = store.tienda.zona_horaria || "America/Santiago";
  const date = value => formatAppDate(value, { day: "numeric", month: "short", year: "numeric" }, zone);
  const status = membership ? estadoAcceso(membership, getAppDateString(0, now, zone)) : null;
  const bank = textoTransferencia(request?.cuenta);
  const expiredCode = phase === "pagar" && (!request.expira || new Date(request.expira).getTime() <= now.getTime());
  const payable = !!bank && request?.cuenta_historica_verificable !== false && request?.monto != null && !expiredCode;
  const support = request?.wa_link || (SUPPORT_WHATSAPP ? `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hola, necesito ayuda con la renovación de la ruta ${store.tienda.nombre}.${request ? ` Código ${request.codigo}.` : ""}`)}` : "");
  const requiresHelp = (phase === "cerrada" && (request?.tiene_comprobante || request?.estado === "rechazada")) || paymentUncertain;

  return <div className="mx-auto max-w-2xl px-4 pb-12 text-slate-800 dark:text-slate-100 md:px-0">
    <header className="mb-6 flex items-center justify-between gap-3">
      <div className="min-w-0"><h1 className="text-2xl font-black tracking-tight">Membresía</h1><p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">{store.tienda.nombre}</p></div>
      <button type="button" onClick={load} disabled={!!busy || refreshing} aria-label="Actualizar membresía" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold disabled:opacity-50 dark:border-slate-700"><FiRefreshCw className={refreshing ? "animate-spin" : ""} />Actualizar</button>
    </header>

    {error && <div role="alert" className={`mb-5 rounded-2xl border p-4 text-sm ${TONES.rose}`}><p className="font-bold">No pudimos verificar el estado</p><p className="mt-1">{error}</p><button type="button" onClick={load} disabled={refreshing || !!busy} className="mt-3 underline">Actualizar y verificar</button></div>}

    {membership && <>
      <section className={`${PANEL} mb-5`} aria-label="Estado de la membresía">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Membresía de la ruta</p><h2 className="mt-1 text-lg font-bold">{store.tienda.nombre}</h2></div><span className={`rounded-full border px-3 py-1 text-xs font-bold ${TONES[status.tone]}`}>{status.label}</span></div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800"><span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400"><FiCalendar />Vencimiento actual</span><strong>{date(membership.fecha_vencimiento)}</strong></div>
        {status.blocked && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Renueva para reanudar el acceso. Tus clientes, créditos y recaudos se conservan.</p>}
        {status.label === "Acceso temporal" && <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">Puedes trabajar hasta el {date(membership.pre_activada_hasta)} mientras verificamos tu pago. La renovación todavía no está confirmada.</p>}
      </section>

      {phase === "pagar" && !continuePayment && <section className={`${PANEL} mb-5`}>
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">Renovación pendiente</p><h2 className="mt-2 text-xl font-bold">Continúa donde quedaste</h2><p className="mb-5 mt-2 text-sm text-slate-500 dark:text-slate-400">Ya tienes un código de pago. Retoma la transferencia o adjunta el comprobante si ya pagaste.</p><button type="button" onClick={() => setContinuePayment(true)} disabled={disabled} className={PRIMARY}>Continuar renovación<FiArrowRight /></button>
      </section>}

      {phase === "pagar" && continuePayment && <section className={`${PANEL} mb-5`} aria-label="Datos para renovar">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">1. Transfiere · 2. Envía el comprobante</p><h2 className="mt-2 text-xl font-bold">Renovación {request.plan === "Mensual" ? "mensual" : "pendiente"}</h2>
        <div className="my-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><div><p className="text-xs text-slate-500 dark:text-slate-400">Monto a transferir</p><p className="mt-1 text-3xl font-black tracking-tight">{request.monto == null ? "Por verificar" : formatMoney(request.monto)}</p></div>{request.monto != null && <CopyButton value={request.monto} label="Copiar monto" disabled={disabled || !payable} />}</div>
        <div className="mb-5"><h3 className="mb-3 text-sm font-bold">Datos de transferencia</h3>{bank ? <><div className="mb-3 whitespace-pre-wrap break-words rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base leading-7 select-text dark:border-slate-700 dark:bg-slate-800">{bank}</div><CopyButton value={bank} label="Copiar datos de transferencia" disabled={disabled || !payable} /></> : <p className="text-sm text-amber-700 dark:text-amber-300">Esta solicitud no conserva una cuenta verificable. Contacta a soporte antes de transferir.</p>}</div>
        {!payable && <p role="alert" className={`mb-5 rounded-xl border p-3 text-sm ${TONES.amber}`}>No transfieras con estos datos hasta verificar la solicitud. Si ya pagaste, puedes enviar el comprobante.</p>}
        <div className="mb-6 rounded-2xl border border-indigo-200 p-4 dark:border-indigo-800"><p className="mb-2 text-sm font-bold">Escribe este código en el comentario de la transferencia</p><div className="mb-2 flex flex-wrap items-center justify-between gap-3"><strong className="font-mono text-xl tracking-wider">{request.codigo}</strong><CopyButton value={request.codigo} label="Copiar código" disabled={disabled || !payable} /></div><Expiry value={request.expira} onExpired={load} /></div>
        <div className="border-t border-slate-100 pt-5 dark:border-slate-800"><h3 className="text-base font-bold">¿Ya realizaste la transferencia?</h3><p className="mb-4 mt-1 text-sm text-slate-500 dark:text-slate-400">Adjunta una foto o imagen del comprobante. No necesitas transferir otra vez.</p>
          <label htmlFor="comprobante-membresia" className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 p-4 text-sm font-bold hover:border-indigo-400 dark:border-slate-600"><FiUploadCloud />{file ? "Cambiar comprobante" : "Adjuntar comprobante"}<input id="comprobante-membresia" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || expiredCode} className="sr-only" onChange={event => {
            const selected = event.target.files?.[0]; event.target.value = "";
            if (!selected) return;
            if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || selected.size > 5 * 1024 * 1024) { toast.error("Adjunta una imagen JPG, PNG o WebP de hasta 5 MB."); return; }
            setFile(selected); setPreview(URL.createObjectURL(selected));
          }} /></label><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">JPG, PNG o WebP · máximo 5 MB</p>
          {preview && <div className="relative my-4 rounded-2xl border border-slate-200 p-2 dark:border-slate-700"><Image unoptimized width={800} height={500} src={preview} alt="Comprobante seleccionado" className="max-h-64 w-full rounded-xl object-contain" /><button type="button" aria-label="Quitar comprobante" onClick={resetFile} disabled={disabled} className="absolute right-3 top-3 rounded-full bg-slate-900 p-2 text-white"><FiX /></button><p className="mt-2 break-all text-xs text-slate-500">{file?.name}</p></div>}
          <button type="button" onClick={upload} disabled={disabled || !file || expiredCode} className={`${PRIMARY} mt-4`}>{busy === "upload" ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}{busy === "upload" ? "Enviando comprobante…" : "Enviar comprobante"}</button><p className="mt-3 text-xs text-slate-500 dark:text-slate-400">El envío queda en revisión. La renovación se confirma cuando se verifica el pago.</p>
        </div>
        <button type="button" disabled={disabled} onClick={() => mutate("cancel", `/tiendas/solicitud-pago/${request.codigo}/cancelar/`, { method: "POST" })} className="mt-5 min-h-11 text-xs font-semibold text-slate-500 underline">Cancelar solicitud si todavía no transferiste</button>
      </section>}

      {phase === "revision" && <section className={`${PANEL} mb-5`} aria-live="polite"><FiClock className="mb-3 text-amber-500" size={28} /><h2 className="text-xl font-bold">Pago en revisión</h2><p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{request.tiene_comprobante ? "Recibimos tu comprobante." : "Estamos verificando tu solicitud."} No necesitas volver a transferir ni generar otro pago.</p><p className="mt-3 text-sm font-bold">Código: {request.codigo}</p><p className="mt-3 text-xs text-slate-500 dark:text-slate-400">El estado se actualiza automáticamente. Si ya recibiste la confirmación, también puedes tocar «Actualizar».</p>{!status.blocked && <button type="button" onClick={() => router.push("/dashboard/liquidar")} className={`${PRIMARY} mt-5`}>Continuar trabajando<FiArrowRight /></button>}</section>}

      {phase === "confirmada" && <section className={`${PANEL} mb-5`} aria-live="polite"><FiCheckCircle className="mb-3 text-emerald-500" size={28} /><h2 className="text-xl font-bold">Pago confirmado</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{status.blocked ? "Este pago está confirmado, pero el acceso actual requiere revisión. Contacta a soporte antes de volver a pagar." : <>Tu membresía tiene vigencia hasta el <strong>{date(membership.fecha_vencimiento)}</strong>.</>}</p>{!status.blocked && <button type="button" onClick={() => router.push("/dashboard/liquidar")} className={`${PRIMARY} mt-5`}>Continuar trabajando<FiArrowRight /></button>}</section>}

      {phase === "cerrada" && request.estado !== "cancelada" && <div className={`mb-5 rounded-2xl border p-4 text-sm ${TONES.amber}`}><p className="font-bold">{request.estado === "expirada" ? "La solicitud anterior venció" : "El pago necesita revisión"}</p>{request.motivo_rechazo && <p className="mt-1">{request.motivo_rechazo}</p>}<p className="mt-2">{requiresHelp ? "Si ya transferiste, contacta a soporte antes de pagar nuevamente." : "Si todavía no transferiste, puedes iniciar una nueva renovación mensual. Si ya pagaste, contacta a soporte."}</p></div>}

      {["renovar", "cerrada", "confirmada"].includes(phase) && <section className={PANEL} aria-label="Renovación mensual"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-bold">Renovación mensual</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Acceso completo por 30 días</p></div><p className="text-3xl font-black tracking-tight">{monthly ? formatMoney(monthly.precio) : "No disponible"}</p></div><div className="my-5 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800"><p className="text-slate-500 dark:text-slate-400">Al confirmar el pago, tu membresía quedaría hasta</p><p className="mt-1 text-lg font-bold">{date(membership.renovacion_mensual.hasta)}</p><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Conservas los días vigentes. Si ya venció, los 30 días empiezan al confirmar la renovación.</p></div><button type="button" onClick={renew} disabled={disabled || !monthly || requiresHelp || (phase === "confirmada" && status.blocked)} className={PRIMARY}>{busy === "renew" ? <FiLoader className="animate-spin" /> : <FiArrowRight />}{busy === "renew" ? "Preparando renovación…" : phase === "confirmada" ? "Renovar otros 30 días" : "Renovar membresía"}</button>{requiresHelp && <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">Primero verifica con soporte la transferencia anterior para evitar un pago duplicado.</p>}</section>}
    </>}
    {support && <a href={support} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50 dark:border-slate-700 dark:text-emerald-300 dark:hover:bg-emerald-950/30"><FiMessageCircle />Necesito ayuda con mi renovación</a>}
    <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">La membresía corresponde únicamente a esta ruta.</p>
  </div>;
}
