// app/dashboard/admin/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";
import {
  FiShield,
  FiRefreshCw,
  FiDollarSign,
  FiTrendingUp,
  FiMapPin,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiActivity,
  FiCreditCard,
  FiBarChart2,
  FiTag,
  FiChevronRight,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney } from "@/app/utils/format";

const ACCESOS = [
  { path: "/dashboard/admin/rutas", label: "Administrar Rutas", desc: "Sucursales y suscripciones", icon: FiShield },
  { path: "/dashboard/admin/conciliacion", label: "Conciliación Pagos", desc: "Revisar comprobantes", icon: FiCreditCard },
  { path: "/dashboard/admin/ingresos", label: "Ingresos Membresías", desc: "Informe mensual y anual", icon: FiBarChart2 },
  { path: "/dashboard/admin/planes", label: "Planes y Precios", desc: "Valor de cada membresía", icon: FiTag },
  { path: "/dashboard/admin/cuenta-bancaria", label: "Cuenta Bancaria", desc: "Datos para pagos", icon: FiDollarSign },
];

function KpiCard({ icon: Icon, label, value, sub, box, color }) {
  return (
    <div className="glass rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-xl ${box}`}>
          <Icon className={color} size={15} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-800 dark:text-white">{value}</p>
      {sub && <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function EstadoChip({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
      <Icon className={color} size={16} />
      <div className="min-w-0">
        <p className="text-[15px] font-black text-slate-800 dark:text-white leading-none">{value}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function AdminPanelPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, clearStore } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al entrar al panel, el root sale de cualquier ruta que estuviera viendo (modo administración)
  useEffect(() => {
    if (user?.username === "root") clearStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResumen = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/tiendas/admin/resumen/");
      if (!res.ok) throw new Error("No se pudo cargar el panel de administración.");
      setData(await res.json());
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.is_superuser) fetchResumen();
  }, [isAuthenticated, user, fetchResumen]);

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
      <div className="max-w-4xl mx-auto px-4 md:px-0">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">
              Panel de Administración
            </h1>
            <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest leading-none mt-1">
              Gestión global del negocio
            </p>
          </div>
          <button
            onClick={fetchResumen}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>

        {loading || !data ? (
          <div className="min-h-[300px] flex items-center justify-center"><LoadingSpinner /></div>
        ) : (
          <>
            {/* KPIs principales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard
                icon={FiDollarSign}
                label="Ingresos del mes"
                value={formatMoney(data.ingresos_mes)}
                sub={`${data.renovaciones_mes} renovaciones`}
                box="bg-emerald-500/10"
                color="text-emerald-500"
              />
              <KpiCard
                icon={FiTrendingUp}
                label="MRR estimado"
                value={formatMoney(data.mrr_estimado)}
                sub="Recurrente mensual"
                box="bg-indigo-500/10"
                color="text-indigo-500"
              />
              <KpiCard
                icon={FiMapPin}
                label="Rutas activas"
                value={data.rutas.activas}
                sub={`de ${data.rutas.total} en total`}
                box="bg-violet-500/10"
                color="text-violet-500"
              />
              <KpiCard
                icon={FiClock}
                label="Por conciliar"
                value={data.conciliacion_pendiente}
                sub={data.conciliacion_pendiente > 0 ? "Requieren revisión" : "Todo al día"}
                box={data.conciliacion_pendiente > 0 ? "bg-amber-500/10" : "bg-slate-500/10"}
                color={data.conciliacion_pendiente > 0 ? "text-amber-500" : "text-slate-400"}
              />
            </div>

            {/* Estado de rutas */}
            <div className="glass rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FiActivity className="text-indigo-500" size={15} />
                <p className="text-[11px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                  Estado de las rutas
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <EstadoChip icon={FiCheckCircle} label="Activas" value={data.rutas.activas} color="text-emerald-500" />
                <EstadoChip icon={FiClock} label="Pendiente pago" value={data.rutas.pendientes} color="text-amber-500" />
                <EstadoChip icon={FiAlertTriangle} label="Vencidas" value={data.rutas.vencidas} color="text-rose-500" />
                <EstadoChip icon={FiClock} label="Vencen en 3 días" value={data.por_vencer} color="text-orange-500" />
              </div>
              {data.rutas.preactivadas > 0 && (
                <p className="text-[10px] font-bold text-slate-400 mt-3 pl-1">
                  + {data.rutas.preactivadas} pre-activada(s) esperando confirmación
                </p>
              )}
            </div>

            {/* Accesos directos */}
            <div className="flex items-center gap-2 mb-4 px-1">
              <FiShield className="text-violet-500" size={15} />
              <p className="text-[11px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                Accesos rápidos
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACCESOS.map(({ path, label, desc, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => router.push(path)}
                  className="glass rounded-[1.25rem] border-white/60 dark:border-slate-800 shadow-md p-4 flex items-center gap-3 text-left hover:ring-2 hover:ring-indigo-400/40 transition-all active:scale-[0.99]"
                >
                  <div className="w-11 h-11 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Icon className="text-indigo-500" size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-black text-slate-800 dark:text-white truncate">{label}</p>
                    <p className="text-[10px] font-bold text-slate-400 truncate">{desc}</p>
                  </div>
                  {path === "/dashboard/admin/conciliacion" && data.conciliacion_pendiente > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-md text-[10px] font-black shrink-0">
                      {data.conciliacion_pendiente}
                    </span>
                  )}
                  <FiChevronRight className="text-slate-300 dark:text-slate-600 shrink-0" size={16} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
