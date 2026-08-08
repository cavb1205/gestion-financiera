// app/dashboard/reportes/cartera/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";
import {
  FiDollarSign,
  FiAlertTriangle,
  FiClock,
  FiDownload,
  FiRefreshCw,
  FiAlertCircle,
  FiShield,
  FiBarChart2,
  FiUsers,
  FiChevronRight,
  FiCalendar,
} from "react-icons/fi";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney, parseMoney } from "../../../utils/format";
import {
  clasificarDeterioro,
  formatDiasSinAbono,
  getMontoParaPonerseAlDia,
  getRiesgoCartera,
  NIVEL_DETERIORO,
} from "../../../utils/cartera";
import { toast } from "react-toastify";

const numero = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const escaparCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const nombreCliente = (venta) =>
  `${venta?.cliente?.nombres || ""} ${venta?.cliente?.apellidos || ""}`.trim() || "Sin nombre";

export default function CarteraReportPage() {
  const { selectedStore, isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const [ventas, setVentas] = useState([]);
  const [auditoria, setAuditoria] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const tiendaId = selectedStore?.tienda?.id;
  const isAdmin = user?.is_staff || user?.is_superuser;

  const fetchData = useCallback(async () => {
    if (!tiendaId) return;
    setCargando(true);
    setError("");
    setAuditoria(null);
    try {
      const [res, auditoriaRes] = await Promise.all([
        apiFetch(`/ventas/activas/t/${tiendaId}/`),
        isAdmin
          ? apiFetch(`/tiendas/controles/inconsistencias/t/${tiendaId}/`)
          : Promise.resolve(null),
      ]);
      if (!res.ok) throw new Error("Error al consultar la cartera activa.");
      const data = await res.json();
      if (Array.isArray(data)) {
        setVentas(data);
      } else {
        setVentas([]);
      }
      if (auditoriaRes?.ok) {
        const auditoriaData = await auditoriaRes.json();
        setAuditoria(auditoriaData && typeof auditoriaData === "object" ? auditoriaData : null);
      }
    } catch (err) {
      setError(err.message || "Error de conexión.");
      toast.error("No se pudo cargar la cartera activa.");
    } finally {
      setCargando(false);
    }
  }, [isAdmin, tiendaId]);

  useEffect(() => {
    if (isAuthenticated && tiendaId) {
      fetchData();
    }
  }, [isAuthenticated, tiendaId, fetchData]);

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  // --- KPI Calculations ---
  const totalPorCobrar = ventas.reduce((acc, v) => acc + parseMoney(v.saldo_actual), 0);
  const totalAbonado = ventas.reduce((acc, v) => acc + parseMoney(v.total_abonado), 0);
  const totalAPagar = ventas.reduce((acc, v) => acc + parseMoney(v.total_a_pagar), 0);
  const capitalRecuperado = ventas.reduce((acc, v) => acc + parseMoney(v.capital_recuperado), 0);
  const capitalExpuesto = ventas.reduce((acc, v) => acc + parseMoney(v.capital_expuesto), 0);
  const interesNoCobrado = ventas.reduce((acc, v) => acc + parseMoney(v.interes_no_cobrado), 0);
  const ventasMorosas = ventas.filter((v) => getRiesgoCartera(v).enMora);
  const saldoEnMora = ventasMorosas.reduce((acc, v) => acc + parseMoney(v.saldo_actual), 0);
  const tasaMorosidadCreditos = ventas.length > 0 ? (ventasMorosas.length / ventas.length) * 100 : 0;
  const tasaMorosidadSaldo = totalPorCobrar > 0 ? (saldoEnMora / totalPorCobrar) * 100 : 0;
  const promedioCuotasMora =
    ventasMorosas.length > 0
      ? ventasMorosas.reduce((acc, v) => acc + numero(getRiesgoCartera(v).cuotasAtrasadas), 0) / ventasMorosas.length
      : 0;
  const promedioDiasSinAbono =
    ventasMorosas.length > 0
      ? ventasMorosas.reduce((acc, v) => acc + numero(getRiesgoCartera(v).diasSinAbono), 0) / ventasMorosas.length
      : 0;
  const indiceRecuperacion = totalAPagar > 0 ? (totalAbonado / totalAPagar) * 100 : 0;
  const ventasGestion = ventas.filter((v) => getRiesgoCartera(v).prioridad.rank > 0);
  const ventasUrgentes = ventas.filter((v) => getRiesgoCartera(v).prioridad.rank >= 2);
  const saldoGestion = ventasGestion.reduce((acc, v) => acc + parseMoney(v.saldo_actual), 0);
  const saldoUrgente = ventasUrgentes.reduce((acc, v) => acc + parseMoney(v.saldo_actual), 0);
  const ventasSinPrimerAbono = ventas.filter((v) => parseMoney(v.total_abonado) <= 0);
  const ventasCandidatasCastigo = ventas.filter((v) => getRiesgoCartera(v).candidatoCastigo);

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
  const ventasOtrosEstado = ventas.filter((v) => !statusGroups[v.estado_venta]);
  if (ventasOtrosEstado.length > 0) {
    statusGroups.Otros = {
      count: ventasOtrosEstado.length,
      saldo: ventasOtrosEstado.reduce((acc, v) => acc + parseMoney(v.saldo_actual), 0),
      color: "slate",
    };
  }
  const totalCount = ventas.length || 1;
  const totalStatusSaldo = Object.values(statusGroups).reduce((acc, group) => acc + group.saldo, 0);

  // --- Aging Buckets ---
  const agingBuckets = [
    { label: "Al Día", min: -Infinity, max: 0, count: 0, saldo: 0, intensity: "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400" },
    { label: "1-5 Cuotas", min: 1, max: 5, count: 0, saldo: 0, intensity: "bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400" },
    { label: "6-15 Cuotas", min: 6, max: 15, count: 0, saldo: 0, intensity: "bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400" },
    { label: "16-30 Cuotas", min: 16, max: 30, count: 0, saldo: 0, intensity: "bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400" },
    { label: "30+ Cuotas", min: 31, max: Infinity, count: 0, saldo: 0, intensity: "bg-rose-100 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300" },
  ];
  ventas.forEach((v) => {
    const dias = numero(getRiesgoCartera(v).cuotasAtrasadas);
    for (const bucket of agingBuckets) {
      if (dias >= bucket.min && dias <= bucket.max) {
        bucket.count += 1;
        bucket.saldo += parseMoney(v.saldo_actual);
        break;
      }
    }
  });

  // --- Deterioro de cartera según la frecuencia del crédito ---
  const deterioroTiers = [
    { ...NIVEL_DETERIORO[3], nivel: 3, count: 0, saldo: 0 },
    { ...NIVEL_DETERIORO[2], nivel: 2, count: 0, saldo: 0 },
    { ...NIVEL_DETERIORO[1], nivel: 1, count: 0, saldo: 0 },
  ];
  ventas.forEach((v) => {
    const { nivel } = clasificarDeterioro(v);
    const tier = deterioroTiers.find((t) => t.nivel === nivel);
    if (tier) {
      tier.count += 1;
      tier.saldo += parseMoney(v.saldo_actual);
    }
  });
  const totalDeterioroCount = deterioroTiers.reduce((a, t) => a + t.count, 0);
  const totalDeterioroSaldo = deterioroTiers.reduce((a, t) => a + t.saldo, 0);

  // --- Top 10 Risky Clients ---
  // Prioridad: nivel de deterioro desc (crítico→alto→atención), luego
  // estado (Vencido antes que Atrasado) y por último saldo desc.
  const estadoPriority = { Vencido: 0, Atrasado: 1 };
  const topRiesgo = [...ventasMorosas]
    .sort((a, b) => {
      const ra = getRiesgoCartera(a);
      const rb = getRiesgoCartera(b);
      if (ra.prioridad.rank !== rb.prioridad.rank) return rb.prioridad.rank - ra.prioridad.rank;
      const na = clasificarDeterioro(a).nivel;
      const nb = clasificarDeterioro(b).nivel;
      if (na !== nb) return nb - na;
      const pa = estadoPriority[a.estado_venta] ?? 99;
      const pb = estadoPriority[b.estado_venta] ?? 99;
      if (pa !== pb) return pa - pb;
      if (ra.diasSinAbono !== rb.diasSinAbono) return (rb.diasSinAbono || 0) - (ra.diasSinAbono || 0);
      return parseMoney(b.saldo_actual) - parseMoney(a.saldo_actual);
    })
    .slice(0, 10);

  const moraTemprana = ventasMorosas.filter((v) => clasificarDeterioro(v).nivel === 0);
  const saldoMoraTemprana = moraTemprana.reduce((acc, v) => acc + parseMoney(v.saldo_actual), 0);

  // --- Distribution by Plazo ---
  const plazoGroups = {};
  ventas.forEach((v) => {
    const plazo = v.plazo || "Otro";
    if (!plazoGroups[plazo]) plazoGroups[plazo] = { count: 0, saldo: 0, moraCount: 0, moraSaldo: 0 };
    plazoGroups[plazo].count += 1;
    plazoGroups[plazo].saldo += parseMoney(v.saldo_actual);
    if (getRiesgoCartera(v).enMora) {
      plazoGroups[plazo].moraCount += 1;
      plazoGroups[plazo].moraSaldo += parseMoney(v.saldo_actual);
    }
  });

  // --- CSV Export ---
  const exportCSV = () => {
    const headers = [
      "ID", "Cliente", "Identificación", "Estado", "Plazo", "Saldo Actual",
      "Total a Pagar", "Total Abonado", "Capital Recuperado", "Capital Expuesto",
      "Interés No Cobrado", "Días Sin Abono", "Último Abono", "Cuotas Atrasadas",
      "Monto Para Ponerse al Día", "Prioridad", "Deterioro", "Cuotas",
      "Pagos Realizados", "Pagos Pendientes",
    ].join(",");
    const rows = ventas.map((v) =>
      [
        escaparCsv(v.id),
        escaparCsv(nombreCliente(v)),
        escaparCsv(v.cliente?.identificacion),
        escaparCsv(v.estado_venta),
        escaparCsv(v.plazo),
        parseMoney(v.saldo_actual),
        parseMoney(v.total_a_pagar),
        parseMoney(v.total_abonado),
        parseMoney(v.capital_recuperado),
        parseMoney(v.capital_expuesto),
        parseMoney(v.interes_no_cobrado),
        numero(getRiesgoCartera(v).diasSinAbono),
        escaparCsv(v.fecha_ultimo_abono || ""),
        numero(getRiesgoCartera(v).cuotasAtrasadas),
        getMontoParaPonerseAlDia(v),
        escaparCsv(getRiesgoCartera(v).prioridad.label),
        escaparCsv(clasificarDeterioro(v).label),
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

  const prioridadBadge = (rank) => {
    if (rank >= 3) return "bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100 dark:border-rose-900/30";
    if (rank >= 2) return "bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-100 dark:border-orange-900/30";
    if (rank >= 1) return "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-900/30";
    return "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700";
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
            {/* Indicadores ejecutivos: dinero expuesto y acción requerida */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              {/* Cartera activa */}
              <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="p-2.5 md:p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl md:rounded-2xl">
                    <FiDollarSign size={20} />
                  </div>
                  <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg">
                    {ventas.length} créditos
                  </span>
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 select-all">
                  {formatMoney(totalPorCobrar)}
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Cartera activa</p>
                <p className="text-[9px] font-bold text-slate-400 mt-2">Saldo total pendiente</p>
              </div>

              {/* Saldo en mora */}
              <div className={`glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden`}>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl ${tasaMorosidadSaldo > 50 ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600'}`}>
                    <FiAlertTriangle size={20} />
                  </div>
                  <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${tasaMorosidadSaldo > 50 ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'}`}>
                    {tasaMorosidadSaldo.toFixed(1)}% del saldo
                  </span>
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                  {formatMoney(saldoEnMora)}
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Saldo en mora</p>
                <p className="text-[9px] font-bold text-slate-400 mt-2">{ventasMorosas.length} créditos · {tasaMorosidadCreditos.toFixed(1)}% por cantidad</p>
              </div>

              {/* Capital expuesto */}
              <div className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="p-2.5 md:p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl md:rounded-2xl">
                    <FiShield size={20} />
                  </div>
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Pérdida potencial</span>
                </div>
                <p className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                  {formatMoney(capitalExpuesto)}
                </p>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Capital expuesto</p>
                <p className="text-[9px] font-bold text-slate-400 mt-2">Recuperado: {formatMoney(capitalRecuperado)} · interés pendiente: {formatMoney(interesNoCobrado)}</p>
              </div>

              {/* Gestión prioritaria */}
              <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border relative overflow-hidden shadow-2xl bg-slate-900 border-slate-800 shadow-slate-300 dark:shadow-none">
                <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className="p-2.5 md:p-3 bg-white/10 rounded-xl md:rounded-2xl">
                      <FiClock size={20} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-300">Hoy</span>
                  </div>
                  <p className="text-xl md:text-3xl font-black tracking-tighter mb-1 select-all">
                    {ventasGestion.length}
                  </p>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none opacity-80">Créditos para gestionar</p>
                  <p className="text-[9px] font-bold text-slate-300 mt-2">{formatMoney(saldoGestion)} pendiente · {ventasUrgentes.length} urgentes/críticos ({formatMoney(saldoUrgente)})</p>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              </div>
            </div>

            {/* Lectura rápida de avance y seguimiento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Avance acumulado</p>
                <p className="mt-2 text-xl font-black text-slate-800 dark:text-white">{indiceRecuperacion.toFixed(1)}%</p>
                <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">Abonado acumulado sobre créditos activos, no rendimiento del día.</p>
              </div>
              <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-5 dark:border-amber-900/30 dark:bg-amber-900/10">
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Mora operativa</p>
                <p className="mt-2 text-xl font-black text-slate-800 dark:text-white">{promedioCuotasMora.toFixed(1)} cuotas</p>
                <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">Promedio de cuotas equivalentes vencidas · {promedioDiasSinAbono.toFixed(1)} días sin abono.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Primer abono y castigo</p>
                <p className="mt-2 text-xl font-black text-slate-800 dark:text-white">{ventasSinPrimerAbono.length} sin primer abono</p>
                <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">{ventasCandidatasCastigo.length} candidatos a revisión por 90+ días.</p>
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
                    const pctSaldo = totalStatusSaldo > 0 ? (data.saldo / totalStatusSaldo) * 100 : 0;
                    const pctCreditos = (data.count / totalCount) * 100;
                    const colorMap = {
                      emerald: { bar: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/10", text: "text-emerald-600", label: "text-emerald-500" },
                      amber: { bar: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-900/10", text: "text-amber-600", label: "text-amber-500" },
                      rose: { bar: "bg-rose-500", bg: "bg-rose-50 dark:bg-rose-900/10", text: "text-rose-600", label: "text-rose-500" },
                      slate: { bar: "bg-slate-500", bg: "bg-slate-50 dark:bg-slate-900/10", text: "text-slate-600", label: "text-slate-500" },
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
                          <span className="text-[10px] font-black text-slate-400">{pctSaldo.toFixed(1)}% saldo</span>
                        </div>
                      </div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${c.bar}`}
                          style={{ width: `${Math.max(pctSaldo, 1)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[9px] font-bold text-slate-400">{pctCreditos.toFixed(1)}% de los créditos activos</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {auditoria && (
              <div className={`mb-8 rounded-[2rem] border p-5 md:p-6 ${
                Array.isArray(auditoria.casos) && auditoria.casos.length > 0
                  ? "border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-900/10"
                  : "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-900/10"
              }`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white/70 p-3 text-amber-600 shadow-sm dark:bg-slate-900/50 dark:text-amber-300">
                      <FiAlertCircle size={20} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white">Calidad de datos</h3>
                        <span className="rounded-full bg-white/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">Solo revisión</span>
                      </div>
                      <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                        {Array.isArray(auditoria.casos) && auditoria.casos.length > 0
                          ? `${auditoria.casos.length} contradicción(es) entre ventas, saldos y recaudos.`
                          : "No se detectaron contradicciones entre ventas, saldos y recaudos."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 md:justify-end">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Monto a revisar</p>
                      <p className="mt-1 text-sm font-black text-slate-800 dark:text-white">{formatMoney(auditoria.resumen?.monto_a_revisar)}</p>
                    </div>
                    {Array.isArray(auditoria.casos) && auditoria.casos.length > 0 && (
                      <Link href="/dashboard/alertas" className="rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400">
                        Revisar casos
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

              {/* Aging Table */}
              <div className="glass rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl lg:col-span-2">
                <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                    <FiClock size={20} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Cuotas equivalentes vencidas</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">No son días calendario sin abono</p>
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

              {/* Deterioro de cartera según la frecuencia del crédito */}
              <div className="glass rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl lg:col-span-2">
                <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                    <FiAlertTriangle size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Deterioro de Cartera</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Créditos en mora · umbrales según Diario, Semanal o Mensual</p>
                  </div>
                  {totalDeterioroCount > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-lg md:text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight leading-none">{formatMoney(totalDeterioroSaldo)}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{totalDeterioroCount} cruzaron umbral</p>
                    </div>
                  )}
                </div>

                {moraTemprana.length > 0 && (
                  <div className="mx-6 mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-900/10 md:mx-10">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">Mora temprana</p>
                        <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">Está atrasada, pero todavía no cruza el umbral de deterioro de su frecuencia.</p>
                      </div>
                      <p className="text-sm font-black text-amber-700 dark:text-amber-300">{moraTemprana.length} créditos · {formatMoney(saldoMoraTemprana)}</p>
                    </div>
                  </div>
                )}

                {totalDeterioroCount === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-sm font-bold text-slate-400">Sin créditos que hayan cruzado un umbral de deterioro.</p>
                    <p className="text-[10px] font-bold text-slate-400/70 uppercase tracking-widest mt-1">La mora temprana se muestra arriba para no perderla de vista.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 mt-4">
                    {deterioroTiers.map((tier) => (
                      <div key={tier.nivel} className="p-6 md:p-8">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${tier.badge}`}>
                            {tier.label}
                          </span>
                        </div>
                        <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">{tier.count}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                          crédito{tier.count !== 1 ? "s" : ""} · umbral según frecuencia
                        </p>
                        <p className={`text-sm font-black mt-3 tracking-tight ${tier.text}`}>{formatMoney(tier.saldo)}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">saldo expuesto</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top 10 Créditos en Riesgo */}
              <div className="glass rounded-[2rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl lg:col-span-2">
                <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                    <FiUsers size={20} />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Top 10 Créditos en Riesgo</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Prioridad de gestión · exposición · atraso</p>
                  </div>
                </div>

                {topRiesgo.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-sm font-bold text-slate-400">No hay créditos en mora actualmente.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile card view */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {topRiesgo.map((venta) => {
                        const det = clasificarDeterioro(venta);
                        const riesgo = getRiesgoCartera(venta);
                        return (
                        <Link
                          key={venta.id}
                          href={`/dashboard/ventas/${venta.id}`}
                          className="block px-5 py-4 active:bg-slate-50 dark:active:bg-slate-800/50 cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight truncate pr-2">
                              {nombreCliente(venta)}
                            </p>
                            <FiChevronRight size={14} className="text-slate-300 shrink-0" />
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                            <span className="text-indigo-500">{formatMoney(parseMoney(venta.saldo_actual))}</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-rose-500">{numero(riesgo.cuotasAtrasadas)} cuotas</span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-slate-400">{formatDiasSinAbono(venta)}</span>
                            <span className={`ml-auto px-2 py-0.5 rounded-lg border text-[9px] ${prioridadBadge(riesgo.prioridad.rank)}`}>
                              {riesgo.prioridad.label}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            <span>Para ponerse al día: <strong className="text-indigo-600 dark:text-indigo-400">{formatMoney(getMontoParaPonerseAlDia(venta))}</strong></span>
                            <span>·</span>
                            <span>{det.nivel > 0 ? det.label : "Mora temprana"}</span>
                          </div>
                        </Link>
                        );
                      })}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                            <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente</th>
                            <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Exposición</th>
                            <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Para ponerse al día</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Seguimiento</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Prioridad</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {topRiesgo.map((venta) => {
                            const det = clasificarDeterioro(venta);
                            const riesgo = getRiesgoCartera(venta);
                            return (
                            <tr
                              key={venta.id}
                              onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.target.closest("a")) return; router.push(`/dashboard/ventas/${venta.id}`); }}
                              className="group hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all cursor-pointer"
                            >
                              <td className="px-8 py-5 whitespace-nowrap">
                                <Link href={`/dashboard/ventas/${venta.id}`} className="block text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">
                                  {nombreCliente(venta)}
                                </Link>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{venta.cliente.identificacion}</p>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{formatMoney(parseMoney(venta.saldo_actual))}</p>
                                <p className="mt-1 text-[9px] font-bold text-slate-400">Capital expuesto: {formatMoney(parseMoney(venta.capital_expuesto))}</p>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <p className="text-sm font-black text-amber-600 dark:text-amber-400 tracking-tight">{formatMoney(getMontoParaPonerseAlDia(venta))}</p>
                                <p className="mt-1 text-[9px] font-bold text-slate-400">para ponerse al día</p>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <p className="text-xs font-black text-slate-700 dark:text-slate-300">{formatDiasSinAbono(venta)}</p>
                                <p className="mt-1 text-[9px] font-bold text-slate-400">{numero(riesgo.cuotasAtrasadas)} cuotas vencidas</p>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <div className="flex flex-col items-center gap-1.5">
                                  <span className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${prioridadBadge(riesgo.prioridad.rank)}`}>
                                    {riesgo.prioridad.label}
                                  </span>
                                  <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${det.nivel > 0 ? det.badge : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"}`}>
                                    {det.nivel > 0 ? det.label : "Mora temprana"}
                                  </span>
                                </div>
                              </td>
                            </tr>
                            );
                          })}
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
                        <p className="mt-3 text-[10px] font-black text-rose-500">{formatMoney(data.moraSaldo)} en mora · {data.moraCount} créditos</p>
                        <p className="mt-1 text-[9px] font-bold text-slate-400">{data.saldo > 0 ? ((data.moraSaldo / data.saldo) * 100).toFixed(1) : 0}% del plazo</p>
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
