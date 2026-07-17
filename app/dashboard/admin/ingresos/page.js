// app/dashboard/admin/ingresos/page.js
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";
import {
  FiShield,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCalendar,
  FiBarChart2,
  FiCreditCard,
  FiX,
  FiDownload,
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
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES_LARGO = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ORIGEN_BADGE = {
  telegram: { label: "Telegram", cls: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" },
  panel: { label: "Panel", cls: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
  manual: { label: "Manual", cls: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
};

function KpiCard({ icon: Icon, label, value, sub, accent = "indigo" }) {
  return (
    <div className="glass rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 bg-${accent}-500/10 rounded-xl`}>
          <Icon className={`text-${accent}-500`} size={14} />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-800 dark:text-white">{value}</p>
      {sub && <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function IngresosMembresiasPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [mesFiltro, setMesFiltro] = useState(null); // 1-12 o null

  const fetchData = useCallback(async (y) => {
    try {
      setLoading(true);
      const res = await apiFetch(`/tiendas/ingresos/?year=${y}`);
      if (!res.ok) throw new Error("No se pudo cargar el informe de ingresos.");
      const json = await res.json();
      setData(json);
      setMesFiltro(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.is_superuser) fetchData(year);
  }, [isAuthenticated, user, year, fetchData]);

  const hoy = new Date();
  const esAnioActual = data?.year === hoy.getFullYear();
  const mesActual = data && esAnioActual ? data.por_mes[hoy.getMonth()] : null;

  const variacion = useMemo(() => {
    if (!data || !data.total_anio_anterior) return null;
    return ((data.total_anual - data.total_anio_anterior) / data.total_anio_anterior) * 100;
  }, [data]);

  const totalRenovaciones = useMemo(() => {
    if (!data) return { cantidad: 0, mensuales: 0, anuales: 0 };
    return data.por_mes.reduce(
      (acc, m) => ({
        cantidad: acc.cantidad + m.cantidad,
        mensuales: acc.mensuales + m.mensuales,
        anuales: acc.anuales + m.anuales,
      }),
      { cantidad: 0, mensuales: 0, anuales: 0 }
    );
  }, [data]);

  const pagosVisibles = useMemo(() => {
    if (!data) return [];
    if (!mesFiltro) return data.pagos;
    return data.pagos.filter((p) => new Date(p.fecha + "T12:00:00").getMonth() + 1 === mesFiltro);
  }, [data, mesFiltro]);

  // Exportar CSV de lo visible (respeta el filtro de mes) — mismo patrón que recaudos
  const exportarCSV = () => {
    if (!pagosVisibles.length) return;
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      "Fecha,Ruta,ID Ruta,Plan,Origen,Codigo,Monto",
      ...pagosVisibles.map((p) =>
        [
          p.fecha,
          q(p.tienda),
          p.tienda_id ?? "",
          q(p.plan),
          ORIGEN_BADGE[p.origen]?.label || p.origen,
          p.codigo || "",
          Math.round(p.monto),
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ingresos_membresias_${data.year}${mesFiltro ? `_${String(mesFiltro).padStart(2, "0")}` : ""}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const chartData = useMemo(() => {
    if (!data) return null;
    return {
      labels: MESES,
      datasets: [
        {
          label: "Planes Mensuales",
          data: data.por_mes.map((m) => m.monto_mensuales),
          backgroundColor: "rgba(79, 70, 229, 0.85)",
          borderRadius: 8,
          stack: "ingresos",
        },
        {
          label: "Planes Anuales",
          data: data.por_mes.map((m) => m.monto_anuales),
          backgroundColor: "rgba(16, 185, 129, 0.85)",
          borderRadius: 8,
          stack: "ingresos",
        },
      ],
    };
  }, [data]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      onClick: (_, elements) => {
        if (elements.length > 0) {
          const mes = elements[0].index + 1;
          setMesFiltro((prev) => (prev === mes ? null : mes));
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10, weight: "bold" } } },
        y: {
          stacked: true,
          grid: { color: "rgba(148, 163, 184, 0.1)" },
          ticks: {
            font: { size: 10 },
            callback: (v) => (v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`),
          },
        },
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: { usePointStyle: true, padding: 16, font: { size: 11, weight: "bold" } },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatMoney(ctx.raw)}`,
            footer: (items) => {
              const total = items.reduce((acc, i) => acc + i.raw, 0);
              return `Total: ${formatMoney(total)}`;
            },
          },
        },
      },
    }),
    []
  );

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
      <div className="max-w-5xl mx-auto px-4 md:px-0">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">
              Ingresos por Membresías
            </h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Renovaciones de suscripción
            </p>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-4 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-black shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {(data?.anios_disponibles || [year]).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={() => fetchData(year)}
            className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>

        {loading || !data ? (
          <div className="min-h-[300px] flex items-center justify-center"><LoadingSpinner /></div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <KpiCard
                icon={FiDollarSign}
                label={`Total ${data.year}`}
                value={formatMoney(data.total_anual)}
                sub={`${totalRenovaciones.cantidad} renovaciones`}
                accent="indigo"
              />
              <KpiCard
                icon={variacion === null || variacion >= 0 ? FiTrendingUp : FiTrendingDown}
                label={`Vs ${data.year - 1}`}
                value={variacion === null ? "—" : `${variacion >= 0 ? "+" : ""}${variacion.toFixed(1)}%`}
                sub={`Año anterior: ${formatMoney(data.total_anio_anterior)}`}
                accent={variacion === null || variacion >= 0 ? "emerald" : "rose"}
              />
              <KpiCard
                icon={FiCalendar}
                label={esAnioActual ? MESES_LARGO[hoy.getMonth()] : "Mejor mes"}
                value={
                  esAnioActual
                    ? formatMoney(mesActual.total)
                    : formatMoney(Math.max(...data.por_mes.map((m) => m.total)))
                }
                sub={esAnioActual ? `${mesActual.cantidad} renovaciones este mes` : "Mayor recaudo del año"}
                accent="indigo"
              />
              <KpiCard
                icon={FiCreditCard}
                label="Por plan"
                value={`${totalRenovaciones.mensuales} / ${totalRenovaciones.anuales}`}
                sub="Mensuales / Anuales"
                accent="emerald"
              />
            </div>

            {/* Gráfico */}
            <div className="glass rounded-[2rem] border-white/60 dark:border-slate-800 shadow-lg p-6 mb-8">
              <div className="flex items-center gap-2 mb-6">
                <FiBarChart2 className="text-indigo-500" size={15} />
                <p className="text-[11px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                  Ingresos mensuales · {data.year}
                </p>
                <span className="text-[9px] font-bold text-slate-400 ml-auto hidden sm:block">
                  Toca una barra para filtrar el detalle
                </span>
              </div>
              <div className="relative h-[300px]">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Detalle de pagos */}
            <div className="flex items-center gap-2 mb-4 px-1">
              <FiDollarSign className="text-emerald-500" size={15} />
              <p className="text-[11px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                Detalle de pagos
              </p>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-md text-[10px] font-black">
                {pagosVisibles.length}
              </span>
              {mesFiltro && (
                <button
                  onClick={() => setMesFiltro(null)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
                >
                  {MESES_LARGO[mesFiltro - 1]} <FiX size={11} />
                </button>
              )}
              {pagosVisibles.length > 0 && (
                <button
                  onClick={exportarCSV}
                  aria-label="Exportar ingresos a CSV"
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                >
                  <FiDownload size={12} /> CSV
                </button>
              )}
            </div>

            {pagosVisibles.length === 0 ? (
              <div className="glass rounded-[1.5rem] border-white/60 dark:border-slate-800 p-8 text-center">
                <p className="text-[11px] font-bold text-slate-400">
                  Sin pagos registrados en el período.
                </p>
              </div>
            ) : (
              <div className="glass rounded-[1.5rem] border-white/60 dark:border-slate-800 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                        <th className="px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Ruta</th>
                        <th className="px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                        <th className="px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Origen</th>
                        <th className="px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                        <th className="px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagosVisibles.map((p) => {
                        const badge = ORIGEN_BADGE[p.origen] || ORIGEN_BADGE.manual;
                        return (
                          <tr key={p.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {new Date(p.fecha + "T12:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                            </td>
                            <td className="px-5 py-3 text-[12px] font-black text-slate-700 dark:text-white">
                              {p.tienda}
                              <span className="ml-1 text-[9px] font-black text-slate-400">#{p.tienda_id}</span>
                            </td>
                            <td className="px-5 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">{p.plan}</td>
                            <td className="px-5 py-3">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-[10px] font-black font-mono text-slate-400">{p.codigo || "—"}</td>
                            <td className="px-5 py-3 text-[12px] font-black text-emerald-600 dark:text-emerald-400 text-right whitespace-nowrap">
                              {formatMoney(p.monto)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
