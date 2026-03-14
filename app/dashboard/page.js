"use client";

import { useEffect, useState } from "react";
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiShield,
  FiAlertCircle,
  FiPackage,
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

const formatDate = (s) => {
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const calcDiasRestantes = (s) => {
  if (!s) return Number.MAX_SAFE_INTEGER;
  const [y, m, d] = s.split("-").map(Number);
  const vence = new Date(y, m - 1, d, 23, 59, 59);
  return Math.ceil((vence - new Date()) / 86400000);
};

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
      return null;
    }
  };

  const actualizarDashboard = async () => {
    setRefreshing(true);
    await fetchTienda();
    setRefreshing(false);
  };

  useEffect(() => {
    setTienda({
      tienda: selectedStore.tienda,
      membresia: selectedStore.membresia,
      fecha_vencimiento: selectedStore.fecha_vencimiento,
    });
    fetchTienda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore.tienda.id]);

  if (authLoading || !tienda) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const t = tienda.tienda;
  const dias = calcDiasRestantes(tienda.fecha_vencimiento);
  const memStatus = dias > 7 ? "ok" : dias > 0 ? "warn" : "expired";
  const cajaPositiva = (t.caja ?? 0) >= 0;

  // ── Membresía vencida ───────────────────────────────────────────
  if (memStatus === "expired") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-600/10 blur-[130px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[130px] rounded-full animate-pulse" style={{ animationDelay: "3s" }} />
        </div>
        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex p-5 bg-white/5 border border-rose-500/20 rounded-[2.5rem] mb-6 shadow-2xl">
              <FiAlertTriangle className="text-rose-500 text-5xl animate-bounce" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">
              Acceso <span className="text-rose-500">Restringido</span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Membresía Caducada</p>
          </div>
          <div className="glass p-10 rounded-[3rem] border-rose-500/10 shadow-2xl text-center">
            <p className="text-sm font-bold text-slate-300 mb-8 leading-relaxed">
              La cuenta de <span className="text-rose-400">&quot;{t.nombre}&quot;</span> está en suspensión.
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
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <FiShield size={18} /> Gestionar Membresía
              </button>
              <button
                onClick={() => window.open(`https://wa.me/56963511337?text=Hola,%20quisiera%20renovar%20para%20${t.nombre}`, "_blank")}
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
                {refreshing ? "Verificando..." : "Comprobar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="pb-16 space-y-8">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 pt-1">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest capitalize mb-1.5">{today}</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">{t.nombre}</h1>
          <div className="flex items-center gap-2 mt-2.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operativo
            </span>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
              memStatus === "ok"
                ? "bg-slate-100 dark:bg-slate-800 text-slate-500"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
            }`}>
              {memStatus === "ok" ? `Plan ${tienda.membresia?.nombre}` : `${dias}d para vencer`}
            </span>
          </div>
        </div>
        <button
          onClick={actualizarDashboard}
          disabled={refreshing}
          title="Sincronizar datos"
          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-2xl hover:text-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0 mt-1"
        >
          <FiRefreshCw size={18} className={refreshing ? "animate-spin text-indigo-500" : ""} />
        </button>
      </div>

      {/* ── Alerta de membresía próxima a vencer ─────────────────── */}
      {memStatus === "warn" && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl">
          <FiAlertCircle className="text-amber-500 shrink-0" size={18} />
          <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide flex-1">
            Tu membresía vence en <span className="text-amber-900 dark:text-amber-300">{dias} días</span> — {formatDate(tienda.fecha_vencimiento)}
          </p>
          <button
            onClick={() => router.push("/dashboard/membresias")}
            className="shrink-0 px-4 py-2 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            Renovar
          </button>
        </div>
      )}

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Caja */}
        <div className={`rounded-[1.75rem] p-5 md:p-6 border relative overflow-hidden ${
          cajaPositiva
            ? "bg-emerald-600 border-emerald-500 shadow-xl shadow-emerald-200/40 dark:shadow-none"
            : "bg-rose-600 border-rose-500 shadow-xl shadow-rose-200/40 dark:shadow-none"
        }`}>
          <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-3">Caja</p>
          <p className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none mb-1">{fmt(t.caja)}</p>
          <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">{cajaPositiva ? "Disponible" : "Revisar"}</p>
          <FiDollarSign className="absolute -right-3 -bottom-3 text-white/10" size={72} />
        </div>

        {/* Ventas del mes */}
        <div className="glass rounded-[1.75rem] p-5 md:p-6 border-white/60 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ventas Mes</p>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
              <FiTrendingUp size={13} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-1">{fmt(t.ventas_netas_mes)}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capital colocado</p>
          <FiTrendingUp className="absolute -right-3 -bottom-3 text-slate-100 dark:text-slate-800" size={72} />
        </div>

        {/* Por cobrar */}
        <div className="glass rounded-[1.75rem] p-5 md:p-6 border-white/60 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Por Cobrar</p>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
              <FiActivity size={13} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-2">{fmt(t.dinero_x_cobrar)}</p>
          {(t.caja + t.dinero_x_cobrar) > 0 && (
            <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(100, (t.dinero_x_cobrar / (t.caja + t.dinero_x_cobrar)) * 100)}%` }}
              />
            </div>
          )}
          <FiActivity className="absolute -right-3 -bottom-3 text-slate-100 dark:text-slate-800" size={72} />
        </div>

        {/* Recaudos hoy */}
        <div className="glass rounded-[1.75rem] p-5 md:p-6 border-white/60 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recaudos Hoy</p>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg">
              <FiClock size={13} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-1">{fmt(t.recaudos_dia)}</p>
          {t.ventas_netas_dia > 0 && (
            <p className="text-[10px] font-bold text-slate-400">+{fmt(t.ventas_netas_dia)} ventas</p>
          )}
          {t.ventas_netas_dia === 0 && (
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin ventas hoy</p>
          )}
          <FiClock className="absolute -right-3 -bottom-3 text-slate-100 dark:text-slate-800" size={72} />
        </div>

      </div>

      {/* ── Gráfico + Resúmenes + Sidebar ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <div className="lg:col-span-8 space-y-6">
          <Grafico data={tienda} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResumenMes tienda={tienda} />
            <ResumenAnual tienda={tienda} />
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <ResumenDia tienda={tienda} token={token} />
          <UltimosMovimientos tienda={tienda} />
        </aside>

      </div>

      {/* ── Balance consolidado ──────────────────────────────────── */}
      <ResumenGeneral tienda={tienda} />

    </div>
  );
}
