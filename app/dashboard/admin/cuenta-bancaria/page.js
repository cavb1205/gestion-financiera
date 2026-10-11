// app/dashboard/admin/cuenta-bancaria/page.js
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";
import {
  FiShield,
  FiCreditCard,
  FiSave,
  FiLoader,
  FiRefreshCw,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ConfirmModal from "@/app/components/ConfirmModal";
import RootReadError, { useRootRead } from "../_components/RootReadState";
import RootConfigurationHistory from "../_components/RootConfigurationHistory";
import { formatAppDateTime } from "@/app/utils/datetime";

const CAMPOS = [
  { key: "banco", label: "Banco", placeholder: "Ej: Banco Estado" },
  { key: "numero", label: "Número / Cuenta", placeholder: "Ej: 25595432-6" },
  { key: "titular", label: "Titular", placeholder: "Ej: Andrés Pérez" },
  { key: "tipo", label: "Tipo de cuenta", placeholder: "Ej: Cuenta RUT" },
];

export default function CuentaBancariaPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ banco: "", numero: "", titular: "", tipo: "" });
  const [actualizada, setActualizada] = useState(null);
  const { read, loading, loadError, hasLoaded } = useRootRead();
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [original, setOriginal] = useState(null);
  const [history, setHistory] = useState([]);
  const [motivo, setMotivo] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [stale, setStale] = useState(false);
  const savingRef = useRef(false);
  const valid = CAMPOS.every(({ key }) => form[key].trim().length > 0 && form[key].trim().length <= 100);

  const fetchCuenta = useCallback(async () => {
    return read("/tiendas/cuenta-destino/", (data) => {
      if (!Number.isInteger(data?.version) || !CAMPOS.every(({key}) => typeof data[key] === 'string')) throw new Error("La cuenta no tiene datos o versión válidos. Actualiza el sistema.");
      setForm({
        banco: data.banco || "",
        numero: data.numero || "",
        titular: data.titular || "",
        tipo: data.tipo || "",
      });
      setActualizada(data.actualizada || null);
      setHasChanges(false);
      setOriginal(data);
      setHistory(data.historial || []);
      setStale(false);
      setConfirming(false);
    }, "No se pudo cargar la cuenta bancaria.");
  }, [read]);

  useEffect(() => {
    if (isAuthenticated && user?.is_superuser) fetchCuenta();
  }, [isAuthenticated, user, fetchCuenta]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (savingRef.current || !hasLoaded || !valid || stale || !original || motivo.trim().length < 5) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const res = await apiFetch("/tiendas/cuenta-destino/", {
        method: "PUT",
        body: JSON.stringify({ ...form, version: original.version, motivo: motivo.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo guardar la cuenta.");
      }
      const data = await res.json();
      setOriginal(data);
      setForm(Object.fromEntries(CAMPOS.map(({key}) => [key, data[key]])));
      setHistory(data.historial || []);
      setActualizada(data.actualizada || null);
      setHasChanges(false);
      setConfirming(false);
      setMotivo("");
      toast.success("Datos bancarios actualizados.");
    } catch (error) {
      toast.error(error.message);
      setStale(true);
      setConfirming(false);
    } finally {
      savingRef.current = false;
      setSaving(false);
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

  if (loadError && !loading) return <RootReadError message={loadError} onRetry={fetchCuenta} hasLoaded={hasLoaded} />;

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="max-w-xl mx-auto px-4 md:px-0">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">
              Cuenta Bancaria
            </h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Datos para pagos de membresía
            </p>
          </div>
          <button
            onClick={fetchCuenta}
            aria-label="Recargar cuenta"
            disabled={saving}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>

        {loading ? (
          <div className="min-h-[300px] flex items-center justify-center"><LoadingSpinner /></div>
        ) : (
          <div className="glass rounded-[2rem] border-white/60 dark:border-slate-800 shadow-2xl p-7 md:p-9">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                <FiCreditCard className="text-white" size={22} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cuenta de destino</p>
                <p className="text-[13px] font-black text-slate-800 dark:text-white">
                  Estos datos verá el usuario al pagar
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-7">
              {CAMPOS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label htmlFor={`cuenta-${key}`} className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {label}
                  </label>
                  <input
                    id={`cuenta-${key}`}
                    maxLength={100}
                    disabled={saving || stale}
                    type="text"
                    value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-[14px] font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-600 transition-all"
                  />
                </div>
              ))}
            </div>
            {!original?.configurada && <p className="text-sm mb-4">Cuenta sin configurar: completa los cuatro datos antes de solicitar transferencias.</p>}
            {stale && <p role="alert" className="text-amber-600 mb-4">Recarga la cuenta y revisa los datos antes de volver a guardar.</p>}

            {actualizada && (
              <p className="text-[10px] font-bold text-slate-400 mb-5">
                Última actualización:{" "}
                {formatAppDateTime(actualizada, {
                  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            )}

            <button
              onClick={() => { setMotivo(""); setConfirming(true); }}
              disabled={saving || !hasChanges || !valid || stale || !hasLoaded}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <FiLoader size={16} className="animate-spin" /> : <FiSave size={16} />}
              {saving ? "Guardando..." : "Revisar cambios"}
            </button>
          </div>
        )}
        {!loading && <RootConfigurationHistory tipo="cuenta" rows={history} />}
        <ConfirmModal isOpen={confirming} onClose={() => { if (!saving) setConfirming(false); }} onConfirm={handleSave}
          isLoading={saving} confirmDisabled={motivo.trim().length < 5 || stale} title="Confirmar cuenta bancaria"
          message="Las nuevas solicitudes utilizarán esta cuenta. Las solicitudes existentes conservarán los datos que recibieron."
          confirmText="Confirmar cuenta">
          <div className="text-xs space-y-2 break-words mb-4">{CAMPOS.map(({key,label}) => <p key={key}>
            <b>{label}:</b> {original?.[key] || 'Sin configurar'} → {form[key]}
          </p>)}</div>
          <label htmlFor="motivo-cuenta">Motivo del cambio</label>
          <textarea id="motivo-cuenta" value={motivo} onChange={event => setMotivo(event.target.value)} maxLength={500}
            disabled={saving} className="w-full border rounded-lg p-2 mt-1 dark:bg-slate-800" />
        </ConfirmModal>
      </div>
    </div>
  );
}
