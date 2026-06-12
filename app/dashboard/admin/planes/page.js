// app/dashboard/admin/planes/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";
import {
  FiShield,
  FiTag,
  FiSave,
  FiLoader,
  FiRefreshCw,
  FiInfo,
  FiCalendar,
  FiGift,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney } from "@/app/utils/format";

// Metadatos visuales por plan (el backend define los planes; esto solo decora).
// Clases Tailwind literales para que el escáner las detecte (no interpolar colores).
const PLAN_META = {
  Prueba: { icon: FiGift, box: "bg-amber-500/10", color: "text-amber-500", desc: "Período de evaluación inicial" },
  Mensual: { icon: FiCalendar, box: "bg-indigo-500/10", color: "text-indigo-500", desc: "Renovación cada 30 días" },
  Anual: { icon: FiTag, box: "bg-emerald-500/10", color: "text-emerald-500", desc: "Renovación cada 365 días" },
};
const PLAN_META_DEFAULT = { icon: FiTag, box: "bg-slate-500/10", color: "text-slate-500", desc: "" };

export default function PlanesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [planes, setPlanes] = useState([]);
  const [precios, setPrecios] = useState({}); // { [id]: "12000" }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPlanes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/tiendas/planes/");
      if (!res.ok) throw new Error("No se pudieron cargar los planes.");
      const data = await res.json();
      setPlanes(data);
      setPrecios(Object.fromEntries(data.map((p) => [p.id, String(p.precio)])));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.is_superuser) fetchPlanes();
  }, [isAuthenticated, user, fetchPlanes]);

  const handleChange = (id, value) => {
    // Solo dígitos
    setPrecios((prev) => ({ ...prev, [id]: value.replace(/[^\d]/g, "") }));
  };

  const hasChanges = planes.some((p) => String(p.precio) !== (precios[p.id] ?? ""));

  const handleSave = async () => {
    const payload = planes.map((p) => ({ id: p.id, precio: Number(precios[p.id] || 0) }));
    setSaving(true);
    try {
      const res = await apiFetch("/tiendas/planes/", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No se pudieron guardar los precios.");
      }
      const data = await res.json();
      setPlanes(data);
      setPrecios(Object.fromEntries(data.map((p) => [p.id, String(p.precio)])));
      toast.success("Precios actualizados.");
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
              Planes y Precios
            </h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Valor de cada membresía
            </p>
          </div>
          <button
            onClick={fetchPlanes}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>

        {loading ? (
          <div className="min-h-[300px] flex items-center justify-center"><LoadingSpinner /></div>
        ) : (
          <>
            {/* Aviso */}
            <div className="flex items-start gap-3 mb-6 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/40">
              <FiInfo className="text-indigo-500 shrink-0 mt-0.5" size={15} />
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                Cambiar un precio afecta solo los <b>cobros futuros</b>. Los ingresos ya
                registrados conservan el precio con el que se cobraron.
              </p>
            </div>

            {/* Tarjetas de plan */}
            <div className="space-y-4 mb-7">
              {planes.map((plan) => {
                const meta = PLAN_META[plan.nombre] || PLAN_META_DEFAULT;
                const Icon = meta.icon;
                const cambiado = String(plan.precio) !== (precios[plan.id] ?? "");
                return (
                  <div
                    key={plan.id}
                    className={`glass rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg p-5 transition-all ${
                      cambiado ? "ring-2 ring-indigo-400/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-11 h-11 ${meta.box} rounded-2xl flex items-center justify-center`}>
                        <Icon className={meta.color} size={19} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-black text-slate-800 dark:text-white">{plan.nombre}</p>
                        <p className="text-[10px] font-bold text-slate-400">{meta.desc}</p>
                      </div>
                      <div className="flex-1" />
                      <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                        Actual: {formatMoney(plan.precio)}
                      </span>
                    </div>

                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Nuevo precio
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[15px]">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={precios[plan.id] ?? ""}
                        onChange={(e) => handleChange(plan.id, e.target.value)}
                        placeholder="0"
                        className="w-full pl-9 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-[15px] font-black text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <FiLoader size={16} className="animate-spin" /> : <FiSave size={16} />}
              {saving ? "Guardando..." : "Guardar precios"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
