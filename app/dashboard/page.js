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
  FiChevronRight,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";
import ResumenDia from "../components/dashboard/ResumenDia";
import ResumenMes from "../components/dashboard/ResumenMes";
import ResumenAnual from "../components/dashboard/ResumenAnual";
import ResumenGeneral from "../components/dashboard/ResumenGeneral";
import Grafico from "../components/dashboard/Grafico";
import UltimosMovimientos from "../components/dashboard/UltimosMovimientos";
import LoadingSpinner from "../components/LoadingSpinner";
import { SkeletonCard } from "../components/Skeleton";
import { formatMoney } from "../utils/format";

const formatDate = (s) => {
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const calcDiasRestantes = (s) => {
  if (!s) return Number.MAX_SAFE_INTEGER;
  const [y, m, d] = s.split("-").map(Number);
  const vence = new Date(y, m - 1, d);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.ceil((vence - hoy) / 86400000);
};

// Espejo del backend: Activa → Pendiente Pago (gracia 2d) → Vencida
const calcEstadoMembresia = (s) => {
  if (!s) return "ok";
  const [y, m, d] = s.split("-").map(Number);
  const vence = new Date(y, m - 1, d);
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const pendientePago = new Date(vence); pendientePago.setDate(pendientePago.getDate() + 1);
  const vencida = new Date(vence); vencida.setDate(vencida.getDate() + 3);
  if (hoy >= vencida) return "expired";
  if (hoy >= pendientePago) return "grace";
  if (Math.ceil((vence - hoy) / 86400000) <= 7) return "warn";
  return "ok";
};

export default function DashboardPage() {
  const { selectedStore, token, updateStoreData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tienda, setTienda] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [alertas, setAlertas] = useState({ vencidos: 0, moraGrave: 0, montoMora: 0, fallasHoy: 0, cajaNegativa: false, proximosVencer: 0, montoProximosVencer: 0 });

  const fetchTienda = async () => {
    if (!selectedStore) return null;
    try {
      const res = await apiFetch(
        `/tiendas/detail/admin/${selectedStore.tienda.id}/`
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

  const fetchAlertas = async () => {
    if (!selectedStore) return;
    try {
      const hoy = new Date();
      const fechaHoy = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      const fetchJson = async (path) => {
        const res = await apiFetch(path);
        if (!res.ok) return null;
        return res.json();
      };
      const [activosData, recaudosData] = await Promise.all([
        fetchJson(`/ventas/activas/t/${selectedStore.tienda.id}/`),
        fetchJson(`/recaudos/list/${fechaHoy}/t/${selectedStore.tienda.id}/`),
      ]);
      const activos = Array.isArray(activosData) ? activosData : [];
      const recaudosHoy = Array.isArray(recaudosData) ? recaudosData : [];
      const vencidos = activos.filter(c => c.estado_venta === "Vencido");
      const moraGrave = vencidos.filter(c => (c.dias_atrasados || 0) >= 15);
      const montoMora = vencidos.reduce((acc, c) => acc + Math.round(parseFloat(c.saldo_actual) || 0), 0);
      const fallasHoy = recaudosHoy.filter(r => r.visita_blanco).length;
      const proximosVencer = activos.filter(c => {
        if (c.estado_venta !== "Vigente" && c.estado_venta !== "Atrasado") return false;
        const cuotas = parseFloat(c.cuotas);
        const pagos = parseFloat(c.pagos_realizados);
        const atraso = parseFloat(c.dias_atrasados);
        if (isNaN(cuotas) || isNaN(pagos) || isNaN(atraso)) return false;
        const visitasRestantes = Math.round(cuotas - pagos - atraso);
        return visitasRestantes >= 0 && visitasRestantes <= 3;
      });
      const montoProximosVencer = proximosVencer.reduce((acc, c) => acc + Math.round(parseFloat(c.saldo_actual) || 0), 0);
      setAlertas({
        vencidos: vencidos.length,
        moraGrave: moraGrave.length,
        montoMora,
        fallasHoy,
        cajaNegativa: (selectedStore.tienda.caja ?? 0) < 0,
        proximosVencer: proximosVencer.length,
        montoProximosVencer,
      });
    } catch (err) {
      console.error("Error al cargar alertas:", err);
    }
  };

  useEffect(() => {
    setTienda({
      tienda: selectedStore.tienda,
      membresia: selectedStore.membresia,
      fecha_vencimiento: selectedStore.fecha_vencimiento,
    });
    fetchTienda();
    fetchAlertas();
  }, [selectedStore.tienda.id]);

  if (authLoading || !tienda) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-10 w-64 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  const t = tienda.tienda;
  const dias = calcDiasRestantes(tienda.fecha_vencimiento);
  const memStatus = calcEstadoMembresia(tienda.fecha_vencimiento);
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
                onClick={() => window.open(`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '56963511337'}?text=Hola,%20quisiera%20renovar%20para%20${t.nombre}`, "_blank")}
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
                : memStatus === "grace"
                  ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
            }`}>
              {memStatus === "ok" ? `Plan ${tienda.membresia?.nombre}` : memStatus === "grace" ? "Período de gracia" : dias <= 0 ? "Vence hoy" : `${dias}d para vencer`}
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
        <div className="hidden md:flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl">
          <FiAlertCircle className="text-amber-500 shrink-0" size={18} />
          <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide flex-1">
            {dias <= 0 ? 'Tu membresía vence hoy' : <>Tu membresía vence en <span className="text-amber-900 dark:text-amber-300">{dias} día{dias !== 1 ? 's' : ''}</span></>} — {formatDate(tienda.fecha_vencimiento)}
          </p>
          <button
            onClick={() => router.push("/dashboard/membresias")}
            className="shrink-0 px-4 py-2 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            Renovar
          </button>
        </div>
      )}

      {/* ── Alerta período de gracia ────────────────────────────── */}
      {memStatus === "grace" && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 rounded-2xl">
          <FiAlertTriangle className="text-rose-500 shrink-0" size={18} />
          <p className="text-[11px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wide flex-1">
            Membresía vencida · período de gracia activo. Renueva para no perder el acceso.
          </p>
          <button
            onClick={() => router.push("/dashboard/membresias")}
            className="shrink-0 px-4 py-2 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            Renovar
          </button>
        </div>
      )}

      {/* ── Alertas operativas ──────────────────────────────────── */}
      {(alertas.vencidos > 0 || alertas.fallasHoy > 0 || alertas.cajaNegativa || alertas.proximosVencer > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {alertas.proximosVencer > 0 && (
            <button
              onClick={() => router.push("/dashboard/ventas")}
              className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40 rounded-2xl hover:border-amber-400 transition-all group text-left"
            >
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                <FiClock size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-amber-700 dark:text-amber-400 tracking-tight">
                  {alertas.proximosVencer} crédito{alertas.proximosVencer !== 1 ? "s" : ""} a ≤3 cuotas de vencer
                </p>
                <p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest">
                  {formatMoney(alertas.montoProximosVencer)} por cobrar
                </p>
              </div>
              <FiChevronRight className="text-amber-300 group-hover:translate-x-1 transition-transform shrink-0" size={16} />
            </button>
          )}

          {alertas.vencidos > 0 && (
            <button
              onClick={() => router.push("/dashboard/reportes/cartera")}
              className="flex items-center gap-4 p-4 bg-rose-50 dark:bg-rose-900/15 border border-rose-200 dark:border-rose-800/40 rounded-2xl hover:border-rose-400 transition-all group text-left"
            >
              <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                <FiAlertTriangle size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-rose-700 dark:text-rose-400 tracking-tight">
                  {alertas.vencidos} crédito{alertas.vencidos !== 1 ? "s" : ""} vencido{alertas.vencidos !== 1 ? "s" : ""}
                </p>
                <p className="text-[10px] font-bold text-rose-500/70 uppercase tracking-widest">
                  {alertas.moraGrave > 0 && `${alertas.moraGrave} con +15d mora · `}{formatMoney(alertas.montoMora)} en riesgo
                </p>
              </div>
              <FiChevronRight className="text-rose-300 group-hover:translate-x-1 transition-transform shrink-0" size={16} />
            </button>
          )}

          {alertas.fallasHoy > 0 && (
            <button
              onClick={() => router.push("/dashboard/reportes/visitas")}
              className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/40 rounded-2xl hover:border-amber-400 transition-all group text-left"
            >
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                <FiAlertCircle size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-amber-700 dark:text-amber-400 tracking-tight">
                  {alertas.fallasHoy} visita{alertas.fallasHoy !== 1 ? "s" : ""} fallida{alertas.fallasHoy !== 1 ? "s" : ""} hoy
                </p>
                <p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest">
                  Clientes no contactados
                </p>
              </div>
              <FiChevronRight className="text-amber-300 group-hover:translate-x-1 transition-transform shrink-0" size={16} />
            </button>
          )}

          {alertas.cajaNegativa && (
            <button
              onClick={() => router.push("/dashboard/cierre-caja")}
              className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40 rounded-2xl hover:border-red-400 transition-all group text-left"
            >
              <div className="p-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                <FiDollarSign size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-red-700 dark:text-red-400 tracking-tight">
                  Caja negativa
                </p>
                <p className="text-[10px] font-bold text-red-500/70 uppercase tracking-widest">
                  Balance requiere atención inmediata
                </p>
              </div>
              <FiChevronRight className="text-red-300 group-hover:translate-x-1 transition-transform shrink-0" size={16} />
            </button>
          )}
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
          <p className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none mb-1">{formatMoney(t.caja)}</p>
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
          <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-1">{formatMoney(t.ventas_netas_mes)}</p>
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
          <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-2">{formatMoney(t.dinero_x_cobrar)}</p>
          {(t.caja + t.dinero_x_cobrar) > 0 && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">En calle</span>
                <span className="text-[9px] font-black text-blue-500">{Math.round((t.dinero_x_cobrar / (t.caja + t.dinero_x_cobrar)) * 100)}%</span>
              </div>
              <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(100, (t.dinero_x_cobrar / (t.caja + t.dinero_x_cobrar)) * 100)}%` }}
                />
              </div>
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
          <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-1">{formatMoney(t.recaudos_dia)}</p>
          {t.ventas_netas_dia > 0 && (
            <p className="text-[10px] font-bold text-slate-400">+{formatMoney(t.ventas_netas_dia)} ventas</p>
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
