// app/dashboard/admin/cuenta-bancaria/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchCuenta = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/tiendas/cuenta-destino/");
      if (!res.ok) throw new Error("No se pudo cargar la cuenta bancaria.");
      const data = await res.json();
      setForm({
        banco: data.banco || "",
        numero: data.numero || "",
        titular: data.titular || "",
        tipo: data.tipo || "",
      });
      setActualizada(data.actualizada || null);
      setHasChanges(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.is_superuser) fetchCuenta();
  }, [isAuthenticated, user, fetchCuenta]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/tiendas/cuenta-destino/", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No se pudo guardar la cuenta.");
      }
      const data = await res.json();
      setActualizada(data.actualizada || null);
      setHasChanges(false);
      toast.success("Datos bancarios actualizados.");
    } catch (error) {
      toast.error(error.message);
    } finally {
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
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-[14px] font-bold text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-600 transition-all"
                  />
                </div>
              ))}
            </div>

            {actualizada && (
              <p className="text-[10px] font-bold text-slate-400 mb-5">
                Última actualización:{" "}
                {new Date(actualizada).toLocaleString(undefined, {
                  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <FiLoader size={16} className="animate-spin" /> : <FiSave size={16} />}
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
