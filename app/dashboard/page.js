"use client";

import { useEffect, useState } from "react";
import {
  FiShoppingBag,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiZap,
  FiShield,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import ResumenDia from "../components/dashboard/ResumenDia";
import ResumenMes from "../components/dashboard/ResumenMes";
import ResumenAnual from "../components/dashboard/ResumenAnual";
import ResumenGeneral from "../components/dashboard/ResumenGeneral";
import Grafico from "../components/dashboard/Grafico";
import UltimosMovimientos from "../components/dashboard/UltimosMovimientos";
import LoadingSpinner from "../components/LoadingSpinner";

const fmt = (n) =>
  "$" + new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n ?? 0);

export default function DashboardPage() {
  const { selectedStore, token, updateStoreData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tienda, setTienda] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTienda = async () => {
    if (!selectedStore || !token) return null;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tiendas/detail/admin/${selectedStore.tienda.id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTienda(data);
      updateStoreData?.(data);
      return data;
    } catch {
      console.error("Error al obtener datos de la tienda");
      return null;
    }
  };

  const actualizarDashboard = async () => {
    setRefreshing(true);
    await fetchTienda();
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      // Mostrar datos en caché de inmediato, actualizar en background
      setTienda({
        tienda: selectedStore.tienda,
        membresia: selectedStore.membresia,
        fecha_vencimiento: selectedStore.fecha_vencimiento,
      });
      fetchTienda();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore.tienda.id]);

  if (authLoading || !tienda) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // ── Membresía ──────────────────────────────────────────────────
  const formatDate = (s) => {
    if (!s) return "";
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-CO");
  };

  const calcDiasRestantes = (s) => {
    if (!s) return Number.MAX_SAFE_INTEGER;
    const [y, m, d] = s.split("-").map(Number);
    const vence = new Date(y, m - 1, d, 23, 59, 59);
    return Math.ceil((vence - new Date()) / 86400000);
  };

  const dias = calcDiasRestantes(tienda.fecha_vencimiento);
  const memStatus = dias > 7 ? "ok" : dias > 0 ? "warn" : "expired";
  const isExpired = memStatus === "expired";

  // ── Pantalla de membresía vencida ──────────────────────────────
  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-600/10 blur-[130px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[130px] rounded-full animate-pulse" style={{ animationDelay: "3s" }} />
        </div>
        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex p-5 bg-white/5 border border-rose-500/20 rounded-[2.5rem] mb-6 shadow-2xl">
              <FiAlertTriangle className="text-rose-500 text-5xl animate-bounce" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase italic">
              ACCESO<span className="text-rose-500 not-italic ml-2">RESTRINGIDO</span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Membresía Caducada</p>
          </div>
          <div className="glass p-10 rounded-[3rem] border-rose-500/10 shadow-2xl text-center">
            <p className="text-sm font-bold text-slate-300 mb-8 leading-relaxed">
              La cuenta de <span className="text-rose-400">&quot;{tienda.tienda.nombre}&quot;</span> está en suspensión.
            </p>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 mb-8 space-y-4 text-left">
              <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Plan</span>
                <span className="text-white">{tienda.membresia?.nombre}</span>
              </div>
              <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                <span className="text-slate-500">Venció</span>
                <span className="text-rose-400">{formatDate(tienda.fecha_vencimiento)}</span>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/dashboard/membresias")}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
              >
                <FiShield size={18} /> Gestionar Membresía
              </button>
              <button
                onClick={() => window.open(`https://wa.me/56963511337?text=Hola,%20quisiera%20renovar%20para%20${tienda.tienda.nombre}`, "_blank")}
                className="w-full py-4 bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/30 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3"
              >
                <FiCheckCircle size={16} /> Contactar por WhatsApp
              </button>
              <button
                onClick={actualizarDashboard}
                disabled={refreshing}
                className="w-full py-4 bg-white/5 border border-white/5 text-slate-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"
              >
                <FiRefreshCw className={refreshing ? "animate-spin text-indigo-400" : "text-indigo-400"} />
                {refreshing ? "Verificando..." : "Comprobar Pago"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── KPIs ───────────────────────────────────────────────────────
  const t = tienda.tienda;
  const cajaPositiva = (t.caja ?? 0) >= 0;

  return (
    <div className="min-h-screen pb-12 overflow-x-hidden">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full mb-8 pointer-events-none">
        <div className="w-full pt-6">
          <div className="glass px-6 py-4 flex items-center justify-between rounded-[2rem] pointer-events-auto gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="bg-indigo-600 rounded-xl p-2.5 shadow-lg shadow-indigo-200/30 dark:shadow-none shrink-0">
                <FiShoppingBag className="text-white text-xl" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-black text-slate-800 dark:text-white tracking-tight truncate">
                  {t.nombre}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    t.estado
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${t.estado ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                    {t.estado ? "En línea" : "Inactivo"}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    memStatus === "ok" ? "bg-slate-100 dark:bg-slate-800 text-slate-500" :
                    memStatus === "warn" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                    "bg-rose-100 text-rose-700"
                  }`}>
                    {memStatus === "ok" ? `Plan ${tienda.membresia?.nombre}` : memStatus === "warn" ? `${dias}d restantes` : "Vencida"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <p className="hidden md:block text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {new Date().toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" })}
              </p>
              <button
                onClick={actualizarDashboard}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 disabled:opacity-50 uppercase tracking-widest"
              >
                <FiRefreshCw size={14} className={refreshing ? "animate-spin text-indigo-500" : "text-indigo-500"} />
                {refreshing ? "..." : "Sync"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full space-y-8">

        {/* ── KPI Cards ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <FiZap className="text-indigo-500" size={16} />
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em]">Indicadores Clave</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Caja */}
            <div className={`relative overflow-hidden rounded-[2rem] p-6 border ${
              cajaPositiva
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40"
                : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${cajaPositiva ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"}`}>
                  <FiDollarSign size={18} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                  cajaPositiva
                    ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400"
                }`}>
                  {cajaPositiva ? "Positivo" : "Revisar"}
                </span>
              </div>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Caja Disponible</p>
              <p className={`text-2xl font-black tracking-tighter leading-none ${cajaPositiva ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {fmt(t.caja)}
              </p>
              <div className={`absolute bottom-0 right-0 opacity-[0.06] pointer-events-none`}>
                <FiDollarSign size={80} />
              </div>
            </div>

            {/* Ventas del mes */}
            <div className="relative overflow-hidden glass rounded-[2rem] p-6 border-indigo-500/10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <FiTrendingUp size={18} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {new Date().toLocaleDateString("es-CO", { month: "short" })}
                </span>
              </div>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Ventas del Mes</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">
                {fmt(t.ventas_netas_mes)}
              </p>
              <div className="absolute bottom-0 right-0 opacity-[0.04] pointer-events-none">
                <FiTrendingUp size={80} />
              </div>
            </div>

            {/* Por cobrar */}
            <div className="relative overflow-hidden glass rounded-[2rem] p-6 border-blue-500/10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FiActivity size={18} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cartera</span>
              </div>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Por Cobrar</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">
                {fmt(t.dinero_x_cobrar)}
              </p>
              {(t.caja + t.dinero_x_cobrar) > 0 && (
                <div className="mt-3 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (t.dinero_x_cobrar / (t.caja + t.dinero_x_cobrar)) * 100)}%` }}
                  />
                </div>
              )}
              <div className="absolute bottom-0 right-0 opacity-[0.04] pointer-events-none">
                <FiActivity size={80} />
              </div>
            </div>

            {/* Recaudos hoy */}
            <div className="relative overflow-hidden glass rounded-[2rem] p-6 border-amber-500/10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <FiClock size={18} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Hoy</span>
              </div>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Recaudos Hoy</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">
                {fmt(t.recaudos_dia)}
              </p>
              {t.ventas_netas_dia > 0 && (
                <p className="mt-2 text-[10px] font-bold text-slate-400">
                  + {fmt(t.ventas_netas_dia)} en ventas
                </p>
              )}
              <div className="absolute bottom-0 right-0 opacity-[0.04] pointer-events-none">
                <FiClock size={80} />
              </div>
            </div>

          </div>
        </section>

        {/* ── Gráfico + Resúmenes laterales ──────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <Grafico data={tienda} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="transition-all duration-500 hover:-translate-y-1">
                <ResumenMes tienda={tienda} />
              </div>
              <div className="transition-all duration-500 hover:-translate-y-1">
                <ResumenAnual tienda={tienda} />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            <div className="transition-all duration-500 hover:-translate-y-1">
              <ResumenDia tienda={tienda} token={token} />
            </div>
            <div className="transition-all duration-500 hover:-translate-y-1">
              <UltimosMovimientos tienda={tienda} />
            </div>
          </aside>
        </section>

        {/* ── Balance consolidado ─────────────────────────────────── */}
        <section>
          <ResumenGeneral tienda={tienda} />
        </section>

      </main>
    </div>
  );
}
