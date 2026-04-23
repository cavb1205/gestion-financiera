"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiX, FiArrowRight, FiArrowLeft, FiCheckCircle,
  FiMapPin, FiPhone, FiUser, FiShield, FiGift,
  FiShoppingCart, FiDollarSign,
} from "react-icons/fi";
import { apiFetch } from "@/app/utils/api";
import { formatMoney } from "@/app/utils/format";

const PAISES = [
  { code: "CO", name: "Colombia",  prefijo: "57", cupo: 100000, emoji: "🇨🇴" },
  { code: "CL", name: "Chile",     prefijo: "56", cupo: 50000,  emoji: "🇨🇱" },
  { code: "MX", name: "México",    prefijo: "52", cupo: 2000,   emoji: "🇲🇽" },
  { code: "PE", name: "Perú",      prefijo: "51", cupo: 300,    emoji: "🇵🇪" },
  { code: "EC", name: "Ecuador",   prefijo: "593", cupo: 200,   emoji: "🇪🇨" },
  { code: "OTHER", name: "Otro",   prefijo: "",   cupo: 100000, emoji: "🌎" },
];

export default function OnboardingWizard({ isOpen, onClose, tienda }) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 — configuración de país
  const [paisCode, setPaisCode] = useState(null);
  const [prefijo, setPrefijo] = useState(tienda?.prefijo_telefono || "");
  const [cupo, setCupo] = useState(
    tienda?.cupo_minimo_nuevo ? String(parseInt(tienda.cupo_minimo_nuevo)) : ""
  );
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Step 2 — primer cliente
  const [cliente, setCliente] = useState({
    identificacion: "", nombres: "", apellidos: "",
    telefono_principal: "", direccion: "",
  });
  const [clienteErrors, setClienteErrors] = useState({});
  const [savingCliente, setSavingCliente] = useState(false);
  const [clienteCreado, setClienteCreado] = useState(false);

  if (!isOpen) return null;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const selectPais = (p) => {
    setPaisCode(p.code);
    if (p.code !== "OTHER") {
      setPrefijo(p.prefijo);
      setCupo(String(p.cupo));
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await apiFetch(`/tiendas/${tienda.id}/settings/`, {
        method: "PATCH",
        body: JSON.stringify({
          prefijo_telefono: prefijo.replace(/\D/g, ""),
          cupo_minimo_nuevo: parseInt(cupo.replace(/\D/g, ""), 10) || 100000,
        }),
      });
      setConfigSaved(true);
    } catch {
      // Continúa aunque falle — no bloquear el onboarding
    } finally {
      setSavingConfig(false);
      setStep(2);
    }
  };

  const handleClienteChange = (e) => {
    const { name, value } = e.target;
    setCliente((p) => ({ ...p, [name]: value }));
    if (clienteErrors[name]) setClienteErrors((p) => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleCrearCliente = async () => {
    const errs = {};
    ["identificacion", "nombres", "apellidos", "telefono_principal", "direccion"].forEach((f) => {
      if (!cliente[f].trim()) errs[f] = "Obligatorio";
    });
    if (Object.keys(errs).length) { setClienteErrors(errs); return; }

    setSavingCliente(true);
    try {
      const res = await apiFetch(`/clientes/create/t/${tienda.id}/`, {
        method: "POST",
        body: JSON.stringify({ ...cliente, tienda: tienda.id }),
      });
      if (res.ok) setClienteCreado(true);
    } catch { /* continúa */ } finally {
      setSavingCliente(false);
      setStep(3);
    }
  };

  const paisSeleccionado = PAISES.find((p) => p.code === paisCode);

  // ── Render steps ─────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-md glass rounded-[2rem] shadow-2xl shadow-black/50 overflow-hidden">
        {/* Barra de progreso top */}
        <div className="h-1 bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black transition-all ${
                  s < step
                    ? "bg-emerald-500 text-white"
                    : s === step
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                }`}
              >
                {s < step ? <FiCheckCircle size={12} /> : s}
              </div>
            ))}
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Paso {step} de 3
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* ── STEP 1: País ─────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="px-7 pb-7 space-y-5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center">
                  <FiMapPin className="text-white" size={18} />
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">
                  ¿En qué país operas?
                </h2>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-[52px]">
                Configura el prefijo y el cupo mínimo de crédito
              </p>
            </div>

            {/* Selector de país */}
            <div className="grid grid-cols-3 gap-2">
              {PAISES.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => selectPais(p)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                    paisCode === p.code
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                      : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                  }`}
                >
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Campos editables */}
            {paisCode && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Prefijo WhatsApp
                    </label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <span className="text-slate-400 text-sm font-bold">+</span>
                      <input
                        type="text"
                        value={prefijo}
                        onChange={(e) => setPrefijo(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="flex-1 bg-transparent text-[13px] font-bold text-slate-800 dark:text-white outline-none"
                        placeholder="57"
                      />
                    </div>
                    <p className="text-[9px] font-bold text-slate-400">Para links de WhatsApp</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Cupo mínimo
                    </label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <span className="text-slate-400 text-sm font-bold">$</span>
                      <input
                        type="text"
                        value={cupo}
                        onChange={(e) => setCupo(e.target.value.replace(/\D/g, ""))}
                        className="flex-1 bg-transparent text-[13px] font-bold text-slate-800 dark:text-white outline-none"
                        placeholder="100000"
                      />
                    </div>
                    <p className="text-[9px] font-bold text-slate-400">Crédito inicial clientes nuevos</p>
                  </div>
                </div>

                {cupo && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/20">
                    <FiCheckCircle className="text-emerald-500 shrink-0" size={14} />
                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      Prefijo: +{prefijo} · Cupo inicial: {formatMoney(parseInt(cupo) || 0)}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Saltar
              </button>
              <button
                type="button"
                onClick={paisCode ? handleSaveConfig : () => setStep(2)}
                disabled={savingConfig}
                className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {savingConfig ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {paisCode ? "Guardar y continuar" : "Continuar sin configurar"}
                    <FiArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Primer cliente ───────────────────────────────────────── */}
        {step === 2 && (
          <div className="px-7 pb-7 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center">
                  <FiUser className="text-white" size={18} />
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">
                  Primer cliente
                </h2>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-[52px]">
                Registra tu primer cliente o hazlo después
              </p>
            </div>

            <div className="space-y-3">
              {/* Identificación */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiShield size={10} className="text-indigo-400" /> Documento
                </label>
                <input
                  name="identificacion"
                  type="text"
                  value={cliente.identificacion}
                  onChange={handleClienteChange}
                  placeholder="Número de identificación"
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border ${clienteErrors.identificacion ? "border-rose-400" : "border-slate-200 dark:border-slate-700"} rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all`}
                />
              </div>

              {/* Nombres y apellidos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombres</label>
                  <input
                    name="nombres"
                    type="text"
                    value={cliente.nombres}
                    onChange={handleClienteChange}
                    placeholder="Juan"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border ${clienteErrors.nombres ? "border-rose-400" : "border-slate-200 dark:border-slate-700"} rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apellidos</label>
                  <input
                    name="apellidos"
                    type="text"
                    value={cliente.apellidos}
                    onChange={handleClienteChange}
                    placeholder="Pérez"
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border ${clienteErrors.apellidos ? "border-rose-400" : "border-slate-200 dark:border-slate-700"} rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all`}
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiPhone size={10} className="text-indigo-400" /> Teléfono
                </label>
                <input
                  name="telefono_principal"
                  type="tel"
                  value={cliente.telefono_principal}
                  onChange={handleClienteChange}
                  placeholder="Número de teléfono"
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border ${clienteErrors.telefono_principal ? "border-rose-400" : "border-slate-200 dark:border-slate-700"} rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all`}
                />
              </div>

              {/* Dirección */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiMapPin size={10} className="text-indigo-400" /> Dirección
                </label>
                <input
                  name="direccion"
                  type="text"
                  value={cliente.direccion}
                  onChange={handleClienteChange}
                  placeholder="Barrio, calle, número..."
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border ${clienteErrors.direccion ? "border-rose-400" : "border-slate-200 dark:border-slate-700"} rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all`}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="p-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <FiArrowLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Lo haré después
              </button>
              <button
                type="button"
                onClick={handleCrearCliente}
                disabled={savingCliente}
                className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {savingCliente ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><FiUser size={13} /> Crear cliente</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: ¡Listo! ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="px-7 pb-7 space-y-5">
            {/* Celebration */}
            <div className="text-center py-4">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="absolute inset-0 bg-indigo-500 rounded-3xl animate-ping opacity-15" />
                <div className="relative w-20 h-20 rounded-3xl bg-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/30">
                  <FiGift className="text-white" size={32} />
                </div>
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter mb-2">
                ¡Todo listo!
              </h2>
              <p className="text-sm text-slate-500">Tu negocio está configurado y listo para operar</p>
            </div>

            {/* Resumen */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <FiCheckCircle className="text-emerald-600" size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                    {configSaved ? `País configurado · Prefijo +${prefijo}` : "Configuración de país"}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {configSaved ? "Guardado" : "Puedes editarlo en Perfil"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <FiCheckCircle className="text-emerald-600" size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                    {clienteCreado
                      ? `${cliente.nombres} ${cliente.apellidos} registrado`
                      : "Registro de clientes"}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {clienteCreado ? "Primer cliente creado" : "Puedes agregar clientes cuando quieras"}
                  </p>
                </div>
              </div>

              {/* Trial reminder */}
              <div className="flex items-center gap-3 p-3.5 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/20">
                <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <FiGift className="text-amber-600" size={14} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-amber-700 dark:text-amber-400">
                    Prueba gratuita activa — 7 días
                  </p>
                  <p className="text-[9px] font-bold text-amber-600/70 dark:text-amber-500/60 uppercase tracking-widest">
                    Acceso completo sin restricciones
                  </p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => { onClose(); router.push("/dashboard/ventas/nueva"); }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                <FiShoppingCart size={14} />
                Registrar primera venta
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Explorar el dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
