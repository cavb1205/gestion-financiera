// app/dashboard/admin/page.js
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";
import {
  FiShield,
  FiRefreshCw,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiMapPin,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiActivity,
  FiCreditCard,
  FiBarChart2,
  FiTag,
  FiChevronRight,
  FiUserPlus,
  FiXCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney } from "@/app/utils/format";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const ACCESOS = [
  { path: "/dashboard/admin/rutas", label: "Administrar Rutas", desc: "Sucursales y suscripciones", icon: FiShield },
  { path: "/dashboard/admin/conciliacion", label: "Conciliación Pagos", desc: "Revisar comprobantes", icon: FiCreditCard },
  { path: "/dashboard/admin/ingresos", label: "Ingresos Membresías", desc: "Informe mensual y anual", icon: FiBarChart2 },
  { path: "/dashboard/admin/planes", label: "Planes y Precios", desc: "Valor de cada membresía", icon: FiTag },
  { path: "/dashboard/admin/cuenta-bancaria", label: "Cuenta Bancaria", desc: "Datos para pagos", icon: FiDollarSign },
];

function KpiCard({ icon: Icon, label, value, sub, box, color, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`glass rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg p-5 text-left ${
        onClick ? "hover:ring-2 hover:ring-indigo-400/40 transition-all active:scale-[0.99] cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-xl ${box}`}>
          <Icon className={color} size={15} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-800 dark:text-white">{value}</p>
      {sub && <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>}
    </Comp>
  );
}

function EstadoChip({ icon: Icon, label, value, color, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 text-left w-full ${
        onClick ? "hover:border-indigo-400/50 transition-all active:scale-[0.99] cursor-pointer" : ""
      }`}
    >
      <Icon className={color} size={16} />
      <div className="min-w-0">
        <p className="text-[15px] font-black text-slate-800 dark:text-white leading-none">{value}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
      </div>
    </Comp>
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

  const crecimiento = useMemo(() => {
    if (!data || !data.ingresos_mes_anterior) return null;
    return ((data.ingresos_mes - data.ingresos_mes_anterior) / data.ingresos_mes_anterior) * 100;
  }, [data]);

  const chart = useMemo(() => {
    if (!data?.ingresos_6m) return null;
    return {
      data: {
        labels: data.ingresos_6m.map((m) => m.label),
        datasets: [
          {
            data: data.ingresos_6m.map((m) => m.total),
            backgroundColor: data.ingresos_6m.map((_, i) =>
              i === data.ingresos_6m.length - 1 ? "rgba(79, 70, 229, 0.9)" : "rgba(99, 102, 241, 0.35)"
            ),
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10, weight: "bold" } } },
          y: {
            grid: { color: "rgba(148, 163, 184, 0.1)" },
            ticks: {
              font: { size: 9 },
              callback: (v) => (v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`),
            },
          },
        },
        plugins: {
          tooltip: { callbacks: { label: (ctx) => formatMoney(ctx.raw) } },
        },
      },
    };
  }, [data]);

  const planTotal = useMemo(() => {
    if (!data?.distribucion_plan) return 0;
    return Object.values(data.distribucion_plan).reduce((a, b) => a + b, 0);
  }, [data]);

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

  const PLAN_COLORS = {
    Mensual: "bg-indigo-500",
    Anual: "bg-emerald-500",
    Prueba: "bg-amber-500",
  };

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
            {/* KPIs principales (clicables) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard
                icon={FiDollarSign}
                label="Ingresos del mes"
                value={formatMoney(data.ingresos_mes)}
                sub={
                  crecimiento === null
                    ? `${data.renovaciones_mes} renovaciones`
                    : `${crecimiento >= 0 ? "▲" : "▼"} ${Math.abs(crecimiento).toFixed(0)}% vs mes anterior`
                }
                box="bg-emerald-500/10"
                color="text-emerald-500"
                onClick={() => router.push("/dashboard/admin/ingresos")}
              />
              <KpiCard
                icon={FiTrendingUp}
                label="MRR estimado"
                value={formatMoney(data.mrr_estimado)}
                sub="Recurrente mensual"
                box="bg-indigo-500/10"
                color="text-indigo-500"
                onClick={() => router.push("/dashboard/admin/planes")}
              />
              <KpiCard
                icon={FiMapPin}
                label="Rutas activas"
                value={data.rutas.activas}
                sub={`de ${data.rutas.total} en total`}
                box="bg-violet-500/10"
                color="text-violet-500"
                onClick={() => router.push("/dashboard/admin/rutas?estado=Activa")}
              />
              <KpiCard
                icon={FiClock}
                label="Por conciliar"
                value={data.conciliacion_pendiente}
                sub={data.conciliacion_pendiente > 0 ? "Requieren revisión" : "Todo al día"}
                box={data.conciliacion_pendiente > 0 ? "bg-amber-500/10" : "bg-slate-500/10"}
                color={data.conciliacion_pendiente > 0 ? "text-amber-500" : "text-slate-400"}
                onClick={() => router.push("/dashboard/admin/conciliacion")}
              />
            </div>

            {/* Tendencia de ingresos + composición */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
              {/* Tendencia 6m */}
              <div className="lg:col-span-3 glass rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FiBarChart2 className="text-indigo-500" size={15} />
                  <p className="text-[11px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                    Ingresos · últimos 6 meses
                  </p>
                  {crecimiento !== null && (
                    <span
                      className={`ml-auto flex items-center gap-1 text-[11px] font-black ${
                        crecimiento >= 0 ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {crecimiento >= 0 ? <FiTrendingUp size={13} /> : <FiTrendingDown size={13} />}
                      {crecimiento >= 0 ? "+" : ""}{crecimiento.toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="h-[180px]">
                  {chart && <Bar data={chart.data} options={chart.options} />}
                </div>
              </div>

              {/* Composición por plan */}
              <div className="lg:col-span-2 glass rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FiActivity className="text-emerald-500" size={15} />
                  <p className="text-[11px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                    Base activa por plan
                  </p>
                </div>
                {planTotal === 0 ? (
                  <p className="text-[11px] font-bold text-slate-400 py-6 text-center">Sin rutas activas.</p>
                ) : (
                  <div className="space-y-3">
                    {/* Barra apilada */}
                    <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {Object.entries(data.distribucion_plan).map(([plan, n]) => (
                        <div
                          key={plan}
                          className={PLAN_COLORS[plan] || "bg-slate-400"}
                          style={{ width: `${(n / planTotal) * 100}%` }}
                          title={`${plan}: ${n}`}
                        />
                      ))}
                    </div>
                    {Object.entries(data.distribucion_plan).map(([plan, n]) => (
                      <div key={plan} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${PLAN_COLORS[plan] || "bg-slate-400"}`} />
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{plan}</span>
                        </div>
                        <span className="text-[12px] font-black text-slate-800 dark:text-white">
                          {n} <span className="text-slate-400 font-bold">· {Math.round((n / planTotal) * 100)}%</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
                  <FiUserPlus className="text-violet-500" size={14} />
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Nuevas este mes</span>
                  <span className="ml-auto text-[14px] font-black text-violet-600 dark:text-violet-400">
                    {data.nuevas_rutas_mes}
                  </span>
                </div>
              </div>
            </div>

            {/* Estado de rutas (chips clicables) */}
            <div className="glass rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FiActivity className="text-indigo-500" size={15} />
                <p className="text-[11px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                  Estado de las rutas
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <EstadoChip icon={FiCheckCircle} label="Activas" value={data.rutas.activas} color="text-emerald-500" onClick={() => router.push("/dashboard/admin/rutas?estado=Activa")} />
                <EstadoChip icon={FiClock} label="Pendiente pago" value={data.rutas.pendientes} color="text-amber-500" onClick={() => router.push("/dashboard/admin/rutas?estado=Pendiente Pago")} />
                <EstadoChip icon={FiAlertTriangle} label="Vencidas" value={data.rutas.vencidas} color="text-rose-500" onClick={() => router.push("/dashboard/admin/rutas?estado=Vencida")} />
                <EstadoChip icon={FiClock} label="Vencen en 3 días" value={data.por_vencer} color="text-orange-500" onClick={() => router.push("/dashboard/admin/rutas?estado=Por vencer")} />
              </div>
              {data.rutas.preactivadas > 0 && (
                <p className="text-[10px] font-bold text-slate-400 mt-3 pl-1">
                  + {data.rutas.preactivadas} pre-activada(s) esperando confirmación
                </p>
              )}

              {/* Retención y conversión */}
              {data.retencion && (
                <>
                  <div className="flex items-center gap-2 mt-5 mb-3">
                    <FiTrendingUp className="text-violet-500" size={14} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Retención y conversión
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <EstadoChip
                      icon={FiTrendingDown}
                      label="Bloqueadas este mes"
                      value={data.retencion.bloqueadas_mes}
                      color={data.retencion.bloqueadas_mes > 0 ? "text-rose-500" : "text-slate-400"}
                      onClick={() => router.push("/dashboard/admin/rutas?estado=Vencida")}
                    />
                    <EstadoChip
                      icon={FiTrendingUp}
                      label="Conversión trial"
                      value={data.retencion.conversion_trial != null ? `${data.retencion.conversion_trial}%` : "—"}
                      color="text-emerald-500"
                    />
                    <EstadoChip
                      icon={FiClock}
                      label="Trials en curso"
                      value={data.retencion.trials_en_curso}
                      color="text-amber-500"
                    />
                    <EstadoChip
                      icon={FiXCircle}
                      label="Trials perdidos"
                      value={data.retencion.trials_perdidos}
                      color="text-slate-400"
                    />
                  </div>
                </>
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
