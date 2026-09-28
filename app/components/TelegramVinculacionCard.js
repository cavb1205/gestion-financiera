"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FiCheck,
  FiClipboard,
  FiLink,
  FiLock,
  FiMessageCircle,
  FiRefreshCw,
  FiSend,
  FiShield,
  FiSlash,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api";

const EMPTY = { estado: "sin_vincular", habilitado: true };

function statusCopy(estado) {
  if (estado === "activo") return { label: "Activo", tone: "emerald" };
  if (estado === "pendiente_confirmacion") return { label: "Pendiente de confirmación", tone: "amber" };
  return { label: "Sin vincular", tone: "slate" };
}

function buildWhatsAppUrl({ phone, countryPrefix, firstName }) {
  const rawPhone = String(phone || "").trim();
  let digits = rawPhone.replace(/\D/g, "");
  const prefix = String(countryPrefix || "").replace(/\D/g, "");

  if (!digits) return null;
  if (rawPhone.startsWith("00")) {
    digits = digits.slice(2);
  } else if (!rawPhone.startsWith("+")) {
    if (!prefix) return null;
    if (!digits.startsWith(prefix)) {
      digits = `${prefix}${digits.replace(/^0+/, "")}`;
    }
  }

  // No abrir WhatsApp si el número parece incompleto o puede apuntar a otro.
  if (digits.length < 8 || digits.length > 15) return null;

  const greeting = firstName?.trim() ? `Hola ${firstName.trim()}` : "Hola";
  const message = `${greeting} 👋\n\nSi deseas, puedes recibir por Telegram avisos cuando registremos un crédito, un abono o una novedad de pago, junto con el progreso y el saldo de tus créditos.\n\n📲 Para instalar Telegram, toca el enlace que corresponda a tu celular:\n🤖 Android (Google Play): https://play.google.com/store/apps/details?id=org.telegram.messenger\n🍎 iPhone (App Store): https://apps.apple.com/app/telegram-messenger/id686449807\n\nEn la tienda, pulsa “Instalar” o “Obtener”. Después abre Telegram y sigue los pasos para crear tu cuenta. Si el enlace no abre, busca “Telegram Messenger” directamente en la tienda de aplicaciones de tu celular.\n\nCuando esté lista, respóndenos por aquí y te enviaremos una invitación personal para activar los avisos. Es opcional. 🙂`;

  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`;
}

export default function TelegramVinculacionCard({
  clienteId,
  phone,
  countryPrefix,
  firstName,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [enlace, setEnlace] = useState("");
  const [chatId, setChatId] = useState("");

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/clientes/${clienteId}/telegram/`);
      if (response.status === 503) {
        setData({ habilitado: false, estado: "no_configurado" });
        return;
      }
      if (!response.ok) throw new Error("No se pudo consultar la vinculación");
      const payload = await response.json();
      setData(payload);
      if (payload.chat_id) setChatId(String(payload.chat_id));
    } catch (error) {
      toast.error(error.message || "No se pudo consultar Telegram");
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => { cargar(); }, [cargar]);

  async function generarInvitacion() {
    try {
      setBusy("generar");
      const response = await apiFetch(`/clientes/${clienteId}/telegram/invitacion/`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo generar la invitación");
      setEnlace(payload.enlace || "");
      toast.success("Enlace temporal generado");
    } catch (error) {
      toast.error(error.message || "No se pudo generar la invitación");
    } finally {
      setBusy("");
    }
  }

  async function copiarEnlace() {
    if (!enlace) return;
    try {
      await navigator.clipboard.writeText(enlace);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }

  async function confirmar() {
    if (!chatId.trim() || !data?.version) {
      toast.error("Ingresa el chat ID que aparece en la solicitud");
      return;
    }
    try {
      setBusy("confirmar");
      const response = await apiFetch(`/clientes/${clienteId}/telegram/`, {
        method: "POST",
        body: JSON.stringify({ chat_id: chatId.trim(), version: data.version }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo confirmar la vinculación");
      toast.success("Telegram vinculado para este cliente");
      await cargar();
    } catch (error) {
      toast.error(error.message || "No se pudo confirmar la vinculación");
    } finally {
      setBusy("");
    }
  }

  async function revocar() {
    if (!window.confirm("¿Revocar los avisos de Telegram para este cliente?")) return;
    try {
      setBusy("revocar");
      const response = await apiFetch(`/clientes/${clienteId}/telegram/`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "No se pudo revocar la vinculación");
      }
      setEnlace("");
      setChatId("");
      toast.success("Vinculación revocada");
      await cargar();
    } catch (error) {
      toast.error(error.message || "No se pudo revocar la vinculación");
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return <div className="h-36 animate-pulse rounded-[2rem] border border-slate-200/70 bg-white/60 dark:border-slate-800 dark:bg-slate-900/50" />;
  }

  if (!data?.habilitado) {
    return (
      <section className="rounded-[2rem] border border-slate-200/70 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-200 p-3 text-slate-500 dark:bg-slate-800 dark:text-slate-400"><FiSend size={19} /></div>
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Avisos por Telegram</p><p className="mt-1 text-xs font-bold text-slate-400">Bot de clientes aún no configurado.</p></div>
        </div>
      </section>
    );
  }

  const status = statusCopy(data.estado);
  const active = data.estado === "activo";
  const pending = data.estado === "pendiente_confirmacion";
  const whatsappUrl = buildWhatsAppUrl({ phone, countryPrefix, firstName });

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-indigo-100/80 bg-gradient-to-br from-white via-white to-indigo-50/70 p-5 shadow-sm dark:border-indigo-950 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 md:p-6">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-indigo-400/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-600/20"><FiSend size={19} /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black tracking-tight text-slate-800 dark:text-white">Avisos por Telegram</h3><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${status.tone === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : status.tone === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>{status.label}</span></div>
              <p className="mt-1 max-w-xl text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">Vincula un chat por cliente. Los avisos incluyen créditos, abonos y fallas, pero nunca muestran la URL interna del sistema.</p>
            </div>
          </div>
          <FiShield className="hidden shrink-0 text-indigo-400 sm:block" size={20} />
        </div>

        {!active && !pending && (
          <>
            <div className="mt-5 rounded-2xl border border-indigo-100 bg-white/80 p-4 dark:border-indigo-900/60 dark:bg-slate-950/30">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"><FiMessageCircle size={17} /></div>
                  <div>
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200">¿Le gustaría recibir avisos de sus créditos?</p>
                    <p className="mt-1 max-w-2xl text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">Puedes enviarle una explicación sencilla por WhatsApp. Cuando instale Telegram y cree su cuenta, podrá avisarte para que le envíes una invitación personal.</p>
                  </div>
                </div>
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    <FiMessageCircle size={15} /> Enviar por WhatsApp
                  </a>
                ) : (
                  <p className="shrink-0 text-[10px] font-bold text-amber-600 dark:text-amber-400" role="status">
                    Revisa el teléfono y el prefijo de país para habilitar WhatsApp.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-white/80 p-4 dark:border-indigo-900/60 dark:bg-slate-950/30 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs font-black text-slate-700 dark:text-slate-200">Genera una invitación temporal</p><p className="mt-1 text-[11px] font-medium text-slate-400">Cuando el cliente confirme que ya tiene Telegram. La invitación caduca en 15 minutos.</p></div>
              <button type="button" onClick={generarInvitacion} disabled={busy === "generar"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"><FiLink size={15} />{busy === "generar" ? "Generando..." : "Generar enlace"}</button>
            </div>
          </>
        )}

        {enlace && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20"><div className="flex items-start gap-3"><FiLink className="mt-0.5 shrink-0 text-emerald-600" /><div className="min-w-0 flex-1"><p className="text-xs font-black text-emerald-800 dark:text-emerald-200">Enlace listo para entregar al cliente</p><p className="mt-1 truncate font-mono text-[10px] text-emerald-700/80 dark:text-emerald-300/80">{enlace}</p></div><button type="button" onClick={copiarEnlace} aria-label="Copiar enlace de invitación" className="rounded-xl p-2 text-emerald-700 transition hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40"><FiClipboard size={17} /></button></div></div>
        )}

        {pending && (
          <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"><div className="flex items-start gap-3"><FiLock className="mt-0.5 shrink-0 text-amber-600" /><div className="flex-1"><p className="text-xs font-black text-amber-800 dark:text-amber-200">Consentimiento recibido; falta tu confirmación</p><p className="mt-1 text-[11px] font-medium leading-relaxed text-amber-700/80 dark:text-amber-300/80">Confirma que el chat ID corresponde al cliente antes de activar avisos financieros.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={chatId} onChange={(event) => setChatId(event.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="Chat ID de Telegram" className="min-h-11 flex-1 rounded-xl border border-amber-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none ring-amber-300 transition focus:ring-2 dark:border-amber-800 dark:bg-slate-950 dark:text-white" /><button type="button" onClick={confirmar} disabled={busy === "confirmar"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-amber-700 disabled:opacity-60"><FiCheck size={15} />{busy === "confirmar" ? "Confirmando..." : "Confirmar"}</button></div></div></div></div>
        )}

        {active && <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-600 p-2 text-white"><FiCheck size={16} /></div><div><p className="text-xs font-black text-emerald-800 dark:text-emerald-200">Avisos activos para este cliente</p><p className="mt-1 text-[11px] font-medium text-emerald-700/80 dark:text-emerald-300/80">Chat vinculado: {data.chat_id}</p></div></div><button type="button" onClick={revocar} disabled={busy === "revocar"} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 text-[10px] font-black uppercase tracking-widest text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:hover:bg-rose-950/40"><FiSlash size={14} />{busy === "revocar" ? "Revocando..." : "Revocar"}</button></div>}

        {(active || pending) && <p className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400"><FiRefreshCw size={12} />La vinculación queda limitada a las rutas activas administradas por este usuario.</p>}
      </div>
    </section>
  );
}
