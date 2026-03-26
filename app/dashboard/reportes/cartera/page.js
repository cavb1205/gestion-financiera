// app/dashboard/reportes/cartera/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import {
  FiDollarSign,
  FiAlertTriangle,
  FiClock,
  FiTrendingUp,
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiShield,
  FiBarChart2,
  FiPercent,
  FiUsers,
  FiChevronRight,
  FiCalendar,
} from "react-icons/fi";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney, parseMoney } from "../../../utils/format";
import { toast } from "react-toastify";

export default function CarteraReportPage() {
  const { selectedStore, token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setCargando(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ventas/activas/t/${selectedStore.tienda.id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Error al consultar la cartera activa.");
      const data = await res.json();
      if (Array.isArray(data)) {
        setVentas(data);
      } else {
        setVentas([]);
      }
    } catch (err) {
      setError(err.message || "Error de conexión.");
      toast.error("No se pudo cargar la cartera activa.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && selectedStore && token) {
      fetchData();
    }
  }, [isAuthenticated, selectedStore, token]);

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  // --- KPI Calculations ---
  const totalPorCobrar = ventas.reduce((acc, v) => acc + parseMoney(v.saldo_actual), 0);
  const totalAbonado = ventas.reduce((acc, v) => acc + parseMoney(v.total_abonado), 0);
  const totalAPagar = ventas.reduce((acc, v) => acc + parseMoney(v.total_a_pagar), 0);
  const ventasMorosas = ventas.filter((v) => v.dias_atrasados > 0);
  const tasaMorosidad = ventas.length > 0 ? (ventasMorosas.length / ventas.length) * 100 : 0;
  const promedioDiasMora =
    ventasMorosas.length > 0
      ? ventasMorosas.reduce((acc, v) => acc + v.dias_atrasados, 0) / ventasMorosas.length
      : 0;
  const indiceRecuperacion = totalAPagar > 0 ? (totalAbonado / totalAPagar) * 100 : 0;

  // --- Status Distribution ---
  const statusGroups = {
    Vigente: { count: 0, saldo: 0, color: "emerald" },
    Atrasado: { count: 0, saldo: 0, color: "amber" },
    Vencido: { count: 0, saldo: 0, color: "rose" },
  };
  ventas.forEach((v) => {
    const estado = v.estado_venta;
    if (statusGroups[estado]) {
      statusGroups[estado].count += 1;
      statusGroups[estado].saldo += parseMoney(v.saldo_actual);
    }
  });
  const totalCount = ventas.length || 1;

  // --- Aging Buckets ---
  const agingBuckets = [
    { label: "Al Día", min: -Infinity, max: 0, count: 0, saldo: 0, intensity: "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400" },
    { label: "1-5 Días", min: 1, max: 5, count: 0, saldo: 0, intensity: "bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400" },
    { label: "6-15 Días", min: 6, max: 15, count: 0, saldo: 0, intensity: "bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400" },
    { label: "16-30 Días", min: 16, max: 30, count: 0, saldo: 0, intensity: "bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400" },
    { label: "30+ Días", min: 31, max: Infinity, count: 0, saldo: 0, intensity: "bg-rose-100 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300" },
  ];
  ventas.forEach((v) => {
    const dias = v.dias_atrasados;
    for (const bucket of agingBuckets) {
      if (dias >= bucket.min && dias <= bucket.max) {
        bucket.count += 1;
        bucket.saldo += parseMoney(v.saldo_actual);
        break;
      }
    }
  });

  // --- Top 10 Risky Clients ---
  const topRiesgo = [...ventasMorosas]
    .sort((a, b) => parseMoney(b.saldo_actual) - parseMoney(a.saldo_actual))
    .slice(0, 10);

  // --- Distribution by Plazo ---
  const plazoGroups = {};
  ventas.forEach((v) => {
    const plazo = v.plazo || "Otro";
    if (!plazoGroups[plazo]) plazoGroups[plazo] = { count: 0, saldo: 0 };
    plazoGroups[plazo].count += 1;
    plazoGroups[plazo].saldo += parseMoney(v.saldo_actual);
  });

  // --- CSV Export ---
  const exportCSV = () => {
    const headers = "ID,Cliente,Identificación,Estado,Plazo,Saldo Actual,Total a Pagar,Total Abonado,Días Atrasados,Cuotas,Pagos Realizados,Pagos Pendientes";
    const rows = ventas.map((v) =>
      [
        v.id,
        `"${v.cliente.nombres} ${v.cliente.apellidos}"`,
        v.cliente.identificacion,
        v.estado_venta,
        v.plazo,
        parseMoney(v.saldo_actual),
        parseMoney(v.total_a_pagar),
        parseMoney(v.total_abonado),
        v.dias_atrasados,
        v.cuotas,
        v.pagos_realizados,
        v.pagos_pendientes,
      ].join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cartera_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const estadoBadge = (estado) => {
    const map = {
      Vigente: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/30",
      Atrasado: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-900/30",
      Vencido: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100 dark:border-rose-900/30",
    };
    return map[estado] || "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700";
  };

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase truncate">Análisis de Cartera</h1>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Salud Crediticia • <span className="text-slate-400">{selectedStore.tienda.nombre}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchData}
              className="p-3.5 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
            >
              <FiRefreshCw size={18} className={cargando ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
            </button>
            {ventas.length > 0 && (
              <button
                onClick={exportCSV}
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                <FiDownload size={16} />
                <span className="hidden md:inline">Exportar</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-[2rem] flex items-center gap-4 text-rose-600">
            <FiAlertCircle size={20} className="shrink-0" />
            <p className="text-[11px] font-black uppercase tracking-widest leading-none">{error}</p>
          </div>
        )}

        {cargando ? (
          <LoadingSpinner />
        ) : ventas.length === 0 ? (
          <div className="glass p-16 md:p-20 rounded-[3rem] text-center border-white/60 dark:border-slate-800">
            <div className="w-20 md:w-24 h-20 md:h-24 bg-slate-100 dark:bg-slate-800 text-slate-300 rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner">
              <FiShield size={40} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-400 uppercase tracking-widest mb-2">Sin Cartera Activa</h2>
            <p className="text-sm font-bold text-slate-400">No se encontraron créditos activos en esta tienda.</p>
          </div>
        ) : (
          <>
            {/* 4 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              {/* Total por Cobrar */}
              <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="p-2.5 md:p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl md:rounded-2xl">
                    <FiDollarSign size={20} />
                  </div>
                  <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg">
                    {ventas.length} créd.
                  </span>
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 select-all">
                  {formatMoney(totalPorCobrar)}
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total por Cobrar</p>
              </div>

              {/* Tasa de Morosidad */}
              <div className={`glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden`}>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl ${tasaMorosidad > 50 ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600'}`}>
                    <FiAlertTriangle size={20} />
                  </div>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${tasaMorosidad > 50 ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'}`}>
                    {ventasMorosas.length} morosos
                  </span>
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                  {tasaMorosidad.toFixed(1)}%
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Tasa de Morosidad</p>
              </div>

              {/* Promedio Días Mora */}
              <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="p-2.5 md:p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl md:rounded-2xl">
                    <FiClock size={20} />
                  </div>
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Mora</span>
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                  {promedioDiasMora.toFixed(1)}
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Promedio Días Mora</p>
              </div>

              {/* Índice de Recuperación */}
              <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border relative overflow-hidden shadow-2xl bg-emerald-600 border-emerald-500 shadow-emerald-200 dark:shadow-none">
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="p-2.5 md:p-3 bg-white/20 rounded-xl md:rounded-2xl">
                      <FiTrendingUp size={20} />
                    </div>
                    <FiPercent className="opacity-50" size={16} />
                  </div>
                  <p className="text-xl md:text-3xl font-black tracking-tighter mb-1 select-all">
                    {indiceRecuperacion.toFixed(1)}%
                  </p>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none opacity-80">Índice de Recuperación</p>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              </div>
            </div>

            {/* Distribution by Status */}
            <div className="glass rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl mb-8">
              <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                  <FiBarChart2 size={20} />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Distribución por Estado</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{ventas.length} créditos activos</p>
                </div>
              </div>
              <div className="p-6 md:p-10 space-y-5">
                {Object.entries(statusGroups).map(([estado, data]) => {
                  const pct = (data.count / totalCount) * 100;
                  const colorMap = {
                    emerald: { bar: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/10", text: "text-emerald-600", label: "text-emerald-500" },
                    amber: { bar: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-900/10", text: "text-amber-600", label: "text-amber-500" },
                    rose: { bar: "bg-rose-500", bg: "bg-rose-50 dark:bg-rose-900/10", text: "text-rose-600", label: "text-rose-500" },
                  };
                  const c = colorMap[data.color];
                  return (
                    <div key={estado}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-black uppercase tracking-widest ${c.label}`}>{estado}</span>
                          <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-500">
                            {data.count} créditos
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-black ${c.text}`}>{formatMoney(data.saldo)}</span>
                          <span className="text-[10px] font-black text-slate-400">{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${c.bar}`}
                          style={{ width: `${Math.max(pct, 1)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

              {/* Aging Table */}
              <div className="glass rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl lg:col-span-2">
                <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                    <FiClock size={20} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Antigüedad de Mora</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Segmentación por días de atraso</p>
                  </div>
                </div>

                {/* Mobile card view */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {agingBuckets.map((bucket, idx) => (
                    <div key={idx} className={`px-5 py-4 ${bucket.intensity}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-black uppercase tracking-tight">{bucket.label}</p>
                        <p className="text-sm font-black tracking-tight">{formatMoney(bucket.saldo)}</p>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                        <span>{bucket.count} créditos</span>
                        <span className="ml-auto">{totalPorCobrar > 0 ? ((bucket.saldo / totalPorCobrar) * 100).toFixed(1) : 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rango</th>
                        <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"># Créditos</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Saldo Total</th>
                        <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">% de Cartera</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {agingBuckets.map((bucket, idx) => (
                        <tr key={idx} className={`group transition-all ${bucket.intensity}`}>
                          <td className="px-8 py-5 whitespace-nowrap">
                            <p className="text-xs font-black uppercase tracking-tighter">{bucket.label}</p>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="px-3 py-1 bg-white/60 dark:bg-slate-800/60 rounded-lg text-xs font-black">
                              {bucket.count}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <p className="text-sm font-black tracking-tight">{formatMoney(bucket.saldo)}</p>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <p className="text-sm font-black tracking-tight">
                              {totalPorCobrar > 0 ? ((bucket.saldo / totalPorCobrar) * 100).toFixed(1) : 0}%
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-800">
                      <tr>
                        <td className="px-8 py-6 text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Total Cartera</td>
                        <td className="px-8 py-6 text-center text-sm font-black text-slate-800 dark:text-white">{ventas.length}</td>
                        <td className="px-8 py-6 text-right text-sm font-black text-indigo-600 dark:text-indigo-400">{formatMoney(totalPorCobrar)}</td>
                        <td className="px-8 py-6 text-right text-sm font-black text-slate-800 dark:text-white">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Top 10 Clientes en Riesgo */}
              <div className="glass rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl lg:col-span-2">
                <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                    <FiUsers size={20} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Top 10 Clientes en Riesgo</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ordenados por saldo pendiente</p>
                  </div>
                </div>

                {topRiesgo.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-sm font-bold text-slate-400">No hay clientes en mora actualmente.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile card view */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {topRiesgo.map((venta, idx) => (
                        <div
                          key={venta.id}
                          onClick={() => router.push(`/dashboard/ventas/${venta.id}`)}
                          className="px-5 py-4 active:bg-slate-50 dark:active:bg-slate-800/50 cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight truncate pr-2">
                              {venta.cliente.nombres} {venta.cliente.apellidos}
                            </p>
                            <FiChevronRight size={14} className="text-slate-300 shrink-0" />
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                            <span className="text-indigo-500">{formatMoney(parseMoney(venta.saldo_actual))}</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-rose-500">{venta.dias_atrasados}d mora</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-slate-400">{venta.pagos_realizados}/{venta.cuotas}</span>
                            <span className={`ml-auto px-2 py-0.5 rounded-lg border text-[9px] ${estadoBadge(venta.estado_venta)}`}>
                              {venta.estado_venta}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente</th>
                            <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Saldo Pendiente</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Días Mora</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cuotas Pagadas</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {topRiesgo.map((venta, idx) => (
                            <tr
                              key={venta.id}
                              onClick={() => router.push(`/dashboard/ventas/${venta.id}`)}
                              className="group hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all cursor-pointer"
                            >
                              <td className="px-8 py-5 whitespace-nowrap">
                                <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">
                                  {venta.cliente.nombres} {venta.cliente.apellidos}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{venta.cliente.identificacion}</p>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{formatMoney(parseMoney(venta.saldo_actual))}</p>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <span className={`px-3 py-1 rounded-lg text-xs font-black ${venta.dias_atrasados > 15 ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'}`}>
                                  {venta.dias_atrasados}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <span className="text-xs font-black text-slate-600 dark:text-slate-400">
                                  {venta.pagos_realizados} / {venta.cuotas}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <span className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${estadoBadge(venta.estado_venta)}`}>
                                  {venta.estado_venta}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Distribution by Plazo */}
              <div className="glass p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl lg:col-span-2">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                    <FiCalendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Distribución por Plazo</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Segmentación de modalidad de pago</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                  {Object.entries(plazoGroups).map(([plazo, data]) => {
                    const plazoColors = {
                      Diario: { bg: "bg-indigo-50 dark:bg-indigo-900/10", border: "border-indigo-100 dark:border-indigo-900/20", label: "text-indigo-400", value: "text-indigo-600 dark:text-indigo-400" },
                      Semanal: { bg: "bg-amber-50 dark:bg-amber-900/10", border: "border-amber-100 dark:border-amber-900/20", label: "text-amber-400", value: "text-amber-600 dark:text-amber-400" },
                      Mensual: { bg: "bg-emerald-50 dark:bg-emerald-900/10", border: "border-emerald-100 dark:border-emerald-900/20", label: "text-emerald-400", value: "text-emerald-600 dark:text-emerald-400" },
                    };
                    const c = plazoColors[plazo] || { bg: "bg-slate-50 dark:bg-slate-800/50", border: "border-slate-100 dark:border-slate-800", label: "text-slate-400", value: "text-slate-600 dark:text-slate-400" };
                    return (
                      <div key={plazo} className={`p-5 md:p-6 ${c.bg} rounded-3xl border ${c.border}`}>
                        <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${c.label}`}>{plazo}</p>
                        <p className={`text-xl font-black tracking-tight mb-1 ${c.value}`}>{formatMoney(data.saldo)}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data.count} créditos</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
