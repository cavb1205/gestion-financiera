"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiCheck, FiClipboard, FiLink, FiLock, FiMessageCircle, FiRefreshCw, FiSend, FiSlash } from "react-icons/fi";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api";
import { invitationExpiry, invitationMessage, validInvitation, whatsappInvitationUrl, whatsappPhone } from "../utils/telegramInvitacion";

const BUTTON = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";

function prepareWindow() {
  try {
    const popup = window.open("about:blank", "_blank");
    if (popup) {
      popup.opener = null;
      const referrer = popup.document.createElement("meta");
      referrer.name = "referrer";
      referrer.content = "no-referrer";
      popup.document.head.appendChild(referrer);
      popup.document.title = "Preparando invitación";
      popup.document.body.textContent = "Preparando tu mensaje para WhatsApp…";
    }
    return popup;
  } catch { return null; }
}

function openWhatsApp(popup, url) {
  // Navegar mediante un enlace con política explícita: location.replace()
  // puede enviar como Referer el origen de la ficha que inició la acción.
  const link = popup.document.createElement("a");
  link.href = url;
  link.referrerPolicy = "no-referrer";
  link.rel = "noopener noreferrer";
  link.textContent = "Abrir WhatsApp";
  popup.document.body.replaceChildren(link);
  link.click();
}

export default function TelegramVinculacionCard({ clienteId, phone, countryPrefix, firstName, timeZone }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [invitacion, setInvitacion] = useState(null);
  const [chatId, setChatId] = useState("");
  const [whatsappFallback, setWhatsappFallback] = useState(false);
  const mounted = useRef(true);
  const actionLock = useRef(false);
  const statusSequence = useRef(0);

  const consultar = useCallback(async () => {
    const sequence = ++statusSequence.current;
    const response = await apiFetch(`/clientes/${clienteId}/telegram/`);
    const payload = await response.json().catch(() => ({}));
    if (!mounted.current || sequence !== statusSequence.current) return null;
    if (response.status === 503) {
      const unavailable = { habilitado: false, estado: "no_configurado", invitacion: null };
      setData(unavailable); setInvitacion(null); setError("");
      return unavailable;
    }
    if (!response.ok) throw new Error(payload.error || "No se pudo consultar la vinculación. Intenta actualizar.");
    setData(payload); setError(""); setChatId(payload.chat_id ? String(payload.chat_id) : "");
    setInvitacion((previous) => previous?.id === payload.invitacion?.id && payload.estado === "sin_vincular" ? previous : null);
    return payload;
  }, [clienteId]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try { await consultar(); }
    catch (err) { if (mounted.current) setError(err.message); }
    finally { if (mounted.current) setLoading(false); }
  }, [consultar]);

  useEffect(() => {
    mounted.current = true;
    cargar();
    const refresh = () => { if (!actionLock.current) cargar(); };
    window.addEventListener("focus", refresh);
    return () => { mounted.current = false; window.removeEventListener("focus", refresh); };
  }, [cargar]);

  const expiraEn = data?.invitacion?.expira_en;
  useEffect(() => {
    const remaining = Date.parse(expiraEn) - Date.now();
    if (!Number.isFinite(remaining)) return;
    const timer = window.setTimeout(() => { setInvitacion(null); if (!actionLock.current) cargar(); }, Math.max(remaining, 0) + 50);
    return () => window.clearTimeout(timer);
  }, [expiraEn, cargar]);

  async function obtenerInvitacion(forceNew = false) {
    const current = await consultar();
    if (!current) throw new Error("La ficha cambió. Abre de nuevo el perfil del cliente.");
    if (current.habilitado === false) throw new Error("El bot de avisos no está disponible ahora.");
    if (current.estado !== "sin_vincular") throw new Error("Este cliente ya aceptó una invitación. Su estado está actualizado en el perfil.");
    if (!forceNew && invitacion?.id === current.invitacion?.id && validInvitation(invitacion)) return invitacion;
    const response = await apiFetch(`/clientes/${clienteId}/telegram/invitacion/`, { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "No se pudo generar la invitación");
    const prepared = { id: payload.invitacion_id, enlace: payload.enlace, expira_en: payload.expira_en };
    if (!validInvitation(prepared)) throw new Error("No se recibió una invitación válida. Actualiza el perfil e intenta de nuevo.");
    if (!mounted.current) throw new Error("La ficha cambió. Abre de nuevo el perfil del cliente.");
    statusSequence.current += 1;
    setInvitacion(prepared);
    setData({ ...current, invitacion: { id: prepared.id, expira_en: prepared.expira_en } });
    return prepared;
  }

  async function preparar(action, forceNew = false) {
    if (actionLock.current || loading || error) return;
    const recipient = whatsappPhone(phone, countryPrefix);
    if (action === "whatsapp" && !recipient) return;
    actionLock.current = true; setBusy(action);
    const popup = action === "whatsapp" ? prepareWindow() : null;
    try {
      const invitation = await obtenerInvitacion(forceNew);
      const message = invitationMessage({ firstName, invitation, timeZone });
      if (action === "whatsapp") {
        const url = whatsappInvitationUrl(recipient, message);
        if (popup && !popup.closed) { openWhatsApp(popup, url); setWhatsappFallback(false); }
        else { setWhatsappFallback(true); toast.info("Mensaje listo. Pulsa «Abrir WhatsApp» para enviarlo."); }
      } else if (action === "copiar") {
        try { await navigator.clipboard.writeText(message); toast.success("Instrucciones e invitación copiadas"); }
        catch { toast.info("El mensaje está listo abajo. Selecciona el texto para copiarlo manualmente."); }
      } else {
        setWhatsappFallback(false);
        toast.success("Nueva invitación preparada. La anterior dejó de funcionar.");
      }
    } catch (err) {
      if (popup && !popup.closed) popup.close();
      if (mounted.current) toast.error(err.message || "No se pudo preparar la invitación");
    } finally { actionLock.current = false; if (mounted.current) setBusy(""); }
  }

  async function gestionar(action) {
    if (actionLock.current || loading || error) return;
    if (action === "revocar" && !window.confirm("¿Revocar los avisos de Telegram para este cliente?")) return;
    if (action === "confirmar" && (!chatId.trim() || !data?.version)) { toast.error("Ingresa el chat ID de la solicitud anterior"); return; }
    const invitationId = data?.invitacion?.id;
    if (action === "cancelar" && !invitationId) return;
    actionLock.current = true; setBusy(action);
    try {
      const cancel = action === "cancelar";
      const response = await apiFetch(`/clientes/${clienteId}/telegram/${cancel ? "invitacion/" : ""}`, {
        method: action === "confirmar" ? "POST" : "DELETE",
        ...(cancel ? { body: JSON.stringify({ invitacion_id: invitationId }) } : action === "confirmar" ? { body: JSON.stringify({ chat_id: chatId.trim(), version: data.version }) } : {}),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "No se pudo actualizar Telegram");
      }
      setWhatsappFallback(false);
      const current = await consultar();
      toast.success(cancel ? current?.estado === "activo" ? "El cliente ya aceptó; sus avisos continúan activos" : "La invitación seleccionada ya no está disponible" : action === "revocar" ? "Vinculación revocada" : "Telegram activo para este cliente");
    } catch (err) { toast.error(err.message || "No se pudo actualizar Telegram"); }
    finally { actionLock.current = false; if (mounted.current) setBusy(""); }
  }

  const active = data?.estado === "activo";
  const pending = data?.estado === "pendiente_confirmacion";
  const available = data?.habilitado === true;
  const disabled = loading || Boolean(busy) || Boolean(error) || !available;
  const phoneNumber = whatsappPhone(phone, countryPrefix);
  let message = "";
  if (invitacion?.id === data?.invitacion?.id && invitacion) {
    try { message = invitationMessage({ firstName, invitation: invitacion, timeZone }); }
    catch { /* Puede vencer mientras se renderiza: no mostrar un enlace vencido. */ }
  }
  const ready = Boolean(message);
  const whatsappUrl = whatsappInvitationUrl(phoneNumber, message);
  const status = loading ? "Consultando…" : error ? "Sin conexión" : active ? "Activo" : pending ? "Solicitud anterior pendiente" : data?.invitacion ? "Invitación pendiente" : "Sin vincular";

  return (
    <section className="rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/70 p-5 shadow-sm dark:border-indigo-950 dark:from-slate-900 dark:to-indigo-950/40 md:p-6" aria-label="Avisos por Telegram">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3"><span className="rounded-2xl bg-indigo-600 p-3 text-white"><FiSend size={19} /></span><div><h3 className="text-sm font-black text-slate-800 dark:text-white">Avisos por Telegram</h3><p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{status}</p></div></div>
        <button type="button" onClick={cargar} disabled={loading || Boolean(busy)} aria-label="Actualizar estado de Telegram" className="rounded-xl p-2 text-slate-500 hover:bg-indigo-50 disabled:opacity-50 dark:hover:bg-slate-800"><FiRefreshCw size={17} /></button>
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
      {data?.habilitado === false && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">El bot de avisos no está disponible ahora. Actualiza el estado e inténtalo más tarde.</p>}
      {!active && !pending && <div className="mt-5 space-y-4">
        <div><p className="text-sm font-bold text-slate-800 dark:text-slate-100">Envía las instrucciones y la invitación en un solo mensaje</p><p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">El cliente tendrá 72 horas para instalar Telegram, crear su cuenta y aceptar. Al aceptar, sus avisos quedarán activos automáticamente.</p></div>
        {data?.invitacion && <div className="rounded-xl border border-indigo-100 bg-white/70 p-3 text-xs dark:border-indigo-900 dark:bg-slate-950/30"><p className="font-bold text-indigo-800 dark:text-indigo-200">Invitación vigente hasta el {invitationExpiry(expiraEn, timeZone)}</p><p className="mt-1 leading-relaxed text-slate-500 dark:text-slate-400">{ready ? "Puedes copiar o reenviar este mismo enlace. Generar uno nuevo reemplazará el anterior." : "Al preparar un nuevo mensaje, se generará otra invitación y el enlace anterior dejará de funcionar."}</p></div>}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button type="button" onClick={() => preparar("whatsapp")} disabled={disabled || !phoneNumber} className={`${BUTTON} bg-emerald-600 text-white hover:bg-emerald-700`}><FiMessageCircle size={16} />{busy === "whatsapp" ? "Preparando mensaje…" : ready ? "Reenviar invitación por WhatsApp" : data?.invitacion ? "Enviar nueva invitación por WhatsApp" : "Enviar invitación por WhatsApp"}</button>
          <button type="button" onClick={() => preparar("copiar")} disabled={disabled} className={`${BUTTON} border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-950 dark:text-indigo-300`}><FiClipboard size={16} />{busy === "copiar" ? "Preparando mensaje…" : "Copiar mensaje"}</button>
        </div>
        {!phoneNumber && <p role="status" className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">Revisa el teléfono del cliente y el prefijo de país de la ruta, o guarda el teléfono con + y su código de país. Puedes usar «Copiar mensaje» para entregarlo por otro medio.</p>}
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">WhatsApp abrirá el mensaje preparado. Revisa el destinatario y pulsa «Enviar» allí. No se envía automáticamente.</p>
        {whatsappFallback && whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={`${BUTTON} bg-emerald-600 text-white`}><FiMessageCircle size={16} />Abrir WhatsApp</a>}
        {ready && <div className="space-y-2"><label htmlFor={`telegram-mensaje-${clienteId}`} className="text-xs font-bold text-slate-700 dark:text-slate-200">Mensaje preparado para el cliente</label><textarea id={`telegram-mensaje-${clienteId}`} value={message} readOnly rows={7} onFocus={(event) => event.target.select()} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300" /><button type="button" onClick={() => preparar("nueva", true)} disabled={disabled} className="min-h-10 text-xs font-bold text-indigo-600 disabled:opacity-50 dark:text-indigo-300"><FiLink className="mr-2 inline" />{busy === "nueva" ? "Generando…" : "Generar nuevo enlace y reemplazar el anterior"}</button></div>}
        {data?.invitacion && <button type="button" onClick={() => gestionar("cancelar")} disabled={disabled} className={`${BUTTON} border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/30`}><FiSlash size={15} />{busy === "cancelar" ? "Cancelando…" : "Cancelar invitación"}</button>}
      </div>}
      {pending && <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/80 p-4 dark:border-amber-900 dark:bg-amber-950/20"><p className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-200"><FiLock />Solicitud del flujo anterior</p><p className="mt-2 text-xs leading-relaxed text-amber-700 dark:text-amber-300">Esta solicitud se creó cuando era necesaria una confirmación del personal. Verifica que corresponde al cliente y confírmala. Las invitaciones nuevas se activan con la aceptación del cliente.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input aria-label="Chat ID de la solicitud anterior" value={chatId} onChange={(event) => setChatId(event.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" className="min-h-11 flex-1 rounded-xl border border-amber-200 bg-white px-3 text-sm dark:border-amber-800 dark:bg-slate-950 dark:text-white" /><button type="button" onClick={() => gestionar("confirmar")} disabled={disabled} className={`${BUTTON} bg-amber-600 text-white`}><FiCheck />{busy === "confirmar" ? "Confirmando…" : "Confirmar solicitud anterior"}</button></div></div>}
      {active && <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/20"><p className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200"><FiCheck />Avisos activos para este cliente</p><p className="mt-2 text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">La vinculación continúa para los próximos créditos de esta ficha. El vencimiento de la invitación no interrumpe los avisos.</p></div>}
      {(active || pending) && <button type="button" onClick={() => gestionar("revocar")} disabled={disabled} className={`${BUTTON} mt-3 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/30`}><FiSlash size={15} />{busy === "revocar" ? "Revocando…" : "Revocar vinculación"}</button>}
    </section>
  );
}
