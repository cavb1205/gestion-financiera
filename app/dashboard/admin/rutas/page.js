// app/dashboard/admin/rutas/page.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";
import {
  FiShield,
  FiRefreshCw,
  FiSearch,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiZap,
  FiStar,
  FiUser,
  FiActivity,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiCheck,
  FiX,
  FiCopy,
  FiCalendar,
  FiTrash2,
  FiUsers,
  FiShoppingCart,
  FiLogIn,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import Pagination from "@/app/components/Pagination";

const STATUS_CONFIG = {
  Activa: {
    label: "Activa",
    icon: FiCheckCircle,
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  "Pendiente Pago": {
    label: "Pendiente",
    icon: FiAlertTriangle,
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-600",
    dot: "bg-amber-500",
  },
  Vencida: {
    label: "Vencida",
    icon: FiXCircle,
    bg: "bg-rose-50 dark:bg-rose-900/20",
    text: "text-rose-600",
    dot: "bg-rose-500",
  },
};

export default function AdminRutasPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, selectStore, clearStore } = useAuth();
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [activating, setActivating] = useState(null); // "mensual-<id>" | "anual-<id>"
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [solicitudesRevision, setSolicitudesRevision] = useState([]);
  const [revisionOpen, setRevisionOpen] = useState(true);
  const [reviewing, setReviewing] = useState(null); // "aprobar-<codigo>" | "rechazar-<codigo>"
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [entering, setEntering] = useState(null); // tm.id en proceso de "entrar"

  const entrarRuta = async (tm) => {
    setEntering(tm.id);
    try {
      const res = await apiFetch(`/tiendas/detail/admin/${tm.tienda.id}/`);
      if (!res.ok) throw new Error("No se pudo cargar la ruta.");
      const data = await res.json();
      selectStore(data);
      router.push("/dashboard");
    } catch (error) {
      toast.error(error.message);
      setEntering(null);
    }
  };

  const fetchTiendas = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/tiendas/list/`);
      if (!response.ok) throw new Error("Error al obtener las rutas");
      const data = await response.json();
      setTiendas(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSolicitudesRevision = async () => {
    try {
      const res = await apiFetch("/tiendas/solicitudes/revision/");
      if (!res.ok) return;
      const data = await res.json();
      setSolicitudesRevision(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (user?.is_superuser) {
      fetchTiendas();
      fetchSolicitudesRevision();
    }
  }, [user]);

  // Si root llega aquí impersonando una ruta, sale de ella.
  // Solo al montar — así no interfiere cuando se selecciona "Entrar".
  useEffect(() => {
    if (user?.username === 'root') clearStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRevisar = async (codigo, resultado) => {
    const key = `${resultado}-${codigo}`;
    setReviewing(key);
    try {
      const res = await apiFetch(`/tiendas/solicitud/${codigo}/revisar/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultado,
          motivo: resultado === "aprobada" ? "Aprobado manualmente" : "Rechazado manualmente",
        }),
      });
      if (!res.ok) throw new Error("Error al procesar la solicitud.");
      toast.success(resultado === "aprobada" ? "✅ Solicitud aprobada." : "❌ Solicitud rechazada.");
      fetchSolicitudesRevision();
      fetchTiendas();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setReviewing(null);
    }
  };

  // Nombres que aparecen en ≥2 rutas distintas (distintos admins o mismos)
  const nombresDuplicados = useMemo(() => {
    const counts = {};
    tiendas.forEach((t) => {
      const key = t.tienda?.nombre?.toLowerCase().trim();
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
    return new Set(Object.entries(counts).filter(([, c]) => c > 1).map(([k]) => k));
  }, [tiendas]);

  const filteredTiendas = useMemo(() => {
    let result = [...tiendas];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.tienda?.nombre?.toLowerCase().includes(term) ||
          t.tienda?.administrador?.toLowerCase().includes(term)
      );
    }
    if (filterEstado === "Duplicadas") {
      result = result.filter((t) =>
        nombresDuplicados.has(t.tienda?.nombre?.toLowerCase().trim())
      );
    } else if (filterEstado !== "Todos") {
      result = result.filter((t) => t.estado === filterEstado);
    }
    return result;
  }, [tiendas, searchTerm, filterEstado, nombresDuplicados]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEstado]);

  const totalPages = Math.ceil(filteredTiendas.length / itemsPerPage);
  const currentItems = filteredTiendas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const metrics = useMemo(() => {
    const activas = tiendas.filter((t) => t.estado === "Activa").length;
    const pendientes = tiendas.filter((t) => t.estado === "Pendiente Pago").length;
    const vencidas = tiendas.filter((t) => t.estado === "Vencida").length;
    const duplicadas = tiendas.filter((t) =>
      nombresDuplicados.has(t.tienda?.nombre?.toLowerCase().trim())
    ).length;
    return { total: tiendas.length, activas, pendientes, vencidas, duplicadas };
  }, [tiendas, nombresDuplicados]);

  const getMembresiaInfo = (fechaVencimiento) => {
    if (!fechaVencimiento) return { days: 0, graceDays: 0, status: "expired", label: "—" };
    const [y, m, d] = fechaVencimiento.split("-").map(Number);
    const vence = new Date(y, m - 1, d);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const pendientePago = new Date(vence); pendientePago.setDate(pendientePago.getDate() + 1);
    const vencida = new Date(vence); vencida.setDate(vencida.getDate() + 3);
    const days = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24));
    const graceDays = Math.ceil((vencida - hoy) / (1000 * 60 * 60 * 24));

    let status, label;
    if (hoy >= vencida) { status = "expired"; label = "Bloqueada"; }
    else if (hoy >= pendientePago) { status = "grace"; label = `Gracia · ${graceDays}d`; }
    else if (days === 0) { status = "today"; label = `Vence hoy · ${graceDays}d gracia`; }
    else { status = days <= 7 ? "warn" : "ok"; label = `${days}d`; }

    return { days, graceDays, status, label };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "\u2014";
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleEliminar = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/tiendas/${deleteTarget.tienda.id}/admin/delete/`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar la ruta");
      toast.success(data.message || "Ruta eliminada");
      setDeleteTarget(null);
      fetchTiendas();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleActivar = async (tiendaMembresiaId, tipo) => {
    const key = `${tipo}-${tiendaMembresiaId}`;
    setActivating(key);
    try {
      const endpoint =
        tipo === "mensual"
          ? `/tiendas/activate/mounth/${tiendaMembresiaId}/`
          : `/tiendas/activate/year/${tiendaMembresiaId}/`;

      const response = await apiFetch(endpoint);
      if (!response.ok) throw new Error("Error al activar el plan.");
      toast.success(
        `Plan ${tipo === "mensual" ? "mensual (30d)" : "anual (365d)"} activado`
      );
      fetchTiendas();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActivating(null);
    }
  };

  if (authLoading || !isAuthenticated) return <LoadingSpinner />;

  if (!user?.is_superuser) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <FiShield className="text-rose-500 mb-4" size={48} />
        <p className="text-lg font-black text-slate-800 dark:text-white uppercase">
          Acceso Restringido
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Solo el usuario root puede acceder a esta sección.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-indigo-600 p-4 rounded-[1.5rem] shadow-xl shadow-indigo-200 dark:shadow-none">
              <FiShield className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">
                Administrar Rutas
              </h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
                Panel Root{" "}
                <span className="text-indigo-500">
                  {metrics.total} Sucursales
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={fetchTiendas}
            className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
          >
            <FiRefreshCw
              size={20}
              className="group-hover:rotate-180 transition-transform duration-500"
            />
          </button>
        </div>

        {/* Solicitudes en revisión */}
        {solicitudesRevision.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setRevisionOpen((o) => !o)}
              className="w-full flex items-center justify-between px-6 py-4 glass rounded-[1.5rem] border-amber-200 dark:border-amber-800/40 shadow-lg mb-3 hover:border-amber-400 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-xl flex items-center justify-center">
                  <FiClock size={15} />
                </div>
                <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">
                  Solicitudes Pendientes de Revisión
                </span>
                <span className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-black">
                  {solicitudesRevision.length}
                </span>
              </div>
              {revisionOpen ? <FiChevronUp size={16} className="text-slate-400" /> : <FiChevronDown size={16} className="text-slate-400" />}
            </button>

            {revisionOpen && (
              <div className="space-y-3">
                {solicitudesRevision.map((sol) => (
                  <div key={sol.codigo} className="glass rounded-[1.5rem] border-amber-100 dark:border-amber-800/30 p-5 shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Info */}
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tienda</p>
                          <p className="text-[12px] font-black text-slate-800 dark:text-white truncate">{sol.tienda_nombre}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Plan · Monto</p>
                          <p className="text-[12px] font-black text-indigo-600">{sol.plan} · ${Number(sol.monto_plan).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Monto detectado</p>
                          <p className="text-[12px] font-black text-slate-700 dark:text-slate-200">
                            {sol.monto_detectado ? `$${Number(sol.monto_detectado).toLocaleString()}` : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Confianza IA</p>
                          <p className={`text-[12px] font-black ${sol.confianza_ia >= 0.8 ? "text-emerald-600" : "text-amber-600"}`}>
                            {sol.confianza_ia != null ? `${Math.round(sol.confianza_ia * 100)}%` : "—"}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleRevisar(sol.codigo, "aprobada")}
                          disabled={!!reviewing}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-60"
                        >
                          {reviewing === `aprobada-${sol.codigo}` ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : <FiCheck size={12} />}
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleRevisar(sol.codigo, "rechazada")}
                          disabled={!!reviewing}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-500 text-rose-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-60"
                        >
                          {reviewing === `rechazada-${sol.codigo}` ? (
                            <div className="w-3 h-3 border-2 border-rose-400/30 border-t-rose-500 rounded-full animate-spin" />
                          ) : <FiX size={12} />}
                          Rechazar
                        </button>
                      </div>
                    </div>

                    {sol.motivo_rechazo && (
                      <p className="mt-2 text-[10px] text-amber-600 font-semibold">
                        Motivo IA: {sol.motivo_rechazo}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-10">
          <div className="glass p-6 md:p-8 rounded-[2rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Rutas</p>
            <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{metrics.total}</p>
          </div>
          <div className="glass p-6 md:p-8 rounded-[2rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">Activas</p>
            <p className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{metrics.activas}</p>
          </div>
          <div className="glass p-6 md:p-8 rounded-[2rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">Pendientes</p>
            <p className="text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tighter">{metrics.pendientes}</p>
          </div>
          <div className="glass p-6 md:p-8 rounded-[2rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2">Vencidas</p>
            <p className="text-2xl md:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tighter">{metrics.vencidas}</p>
          </div>
          <button
            onClick={() => setFilterEstado(filterEstado === "Duplicadas" ? "Todos" : "Duplicadas")}
            className={`glass p-6 md:p-8 rounded-[2rem] border-white/60 dark:border-slate-800 relative overflow-hidden text-left transition-all ${
              filterEstado === "Duplicadas"
                ? "ring-2 ring-violet-500 border-violet-400/60"
                : metrics.duplicadas > 0 ? "hover:ring-2 hover:ring-violet-400/50" : "opacity-60 cursor-default"
            }`}
            disabled={metrics.duplicadas === 0}
            title="Ver solo rutas con nombre compartido entre distintos admins"
          >
            <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <FiCopy size={10} /> Homónimas
            </p>
            <p className="text-2xl md:text-3xl font-black text-violet-600 dark:text-violet-400 tracking-tighter">{metrics.duplicadas}</p>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="glass p-6 md:p-8 rounded-[2.5rem] mb-8 border-white/60 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full group">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre de ruta o administrador..."
                className="block w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {["Todos", "Activa", "Pendiente Pago", "Vencida", "Duplicadas"].map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFilterEstado(estado)}
                  className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                    filterEstado === estado
                      ? estado === "Duplicadas"
                        ? "bg-violet-600 border-violet-600 text-white shadow-lg"
                        : "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                      : estado === "Duplicadas" && metrics.duplicadas > 0
                        ? "bg-white dark:bg-slate-800 border-violet-300 dark:border-violet-700 text-violet-600 hover:bg-violet-50"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300"
                  }`}
                >
                  {estado === "Pendiente Pago" ? "Pendiente" : estado}
                  {estado === "Duplicadas" && metrics.duplicadas > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-violet-500 text-white rounded-md text-[8px]">
                      {metrics.duplicadas}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center">
            <LoadingSpinner />
            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">
              Cargando Rutas
            </p>
          </div>
        ) : (
          <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-2xl">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      Ruta / Admin
                    </th>
                    <th className="px-4 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      Plan
                    </th>
                    <th className="px-4 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      Estado
                    </th>
                    <th className="px-4 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      Vencimiento
                    </th>
                    <th className="px-4 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      Días
                    </th>
                    <th className="px-4 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-8 py-20 text-center">
                        <FiShield className="text-slate-300 mx-auto mb-4" size={40} />
                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase">
                          Sin resultados
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          No se encontraron rutas con los filtros aplicados.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((tm) => {
                      const { days, status: memStatus, label: daysLabel } = getMembresiaInfo(tm.fecha_vencimiento);
                      const cfg = STATUS_CONFIG[tm.estado] || STATUS_CONFIG.Activa;
                      const daysColor =
                        memStatus === "ok"
                          ? "text-emerald-600"
                          : memStatus === "warn" || memStatus === "today"
                          ? "text-amber-600"
                          : "text-rose-600";
                      const esHomonima = nombresDuplicados.has(
                        tm.tienda?.nombre?.toLowerCase().trim()
                      );
                      const clientes = tm.tienda?.cantidad_clientes ?? 0;
                      const ventas = tm.tienda?.cantidad_ventas ?? 0;
                      const esVacia = clientes === 0 && ventas === 0;

                      return (
                        <tr
                          key={tm.id}
                          className={`group hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all ${
                            esVacia
                              ? "bg-rose-50/30 dark:bg-rose-900/5"
                              : esHomonima
                                ? "bg-violet-50/30 dark:bg-violet-900/5"
                                : ""
                          }`}
                        >
                          {/* Ruta / Admin */}
                          <td className="px-4 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                esHomonima
                                  ? "bg-violet-500/15 text-violet-600"
                                  : "bg-indigo-500/10 text-indigo-600"
                              }`}>
                                {esHomonima ? <FiCopy size={16} /> : (tm.tienda?.nombre?.charAt(0) || "?")}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                                    {tm.tienda?.nombre}
                                  </p>
                                  <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-md text-[9px] font-black tracking-widest shrink-0">
                                    #{tm.tienda?.id}
                                  </span>
                                  {esVacia && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg text-[8px] font-black uppercase tracking-widest shrink-0">
                                      <FiTrash2 size={8} /> Vacía
                                    </span>
                                  )}
                                  {esHomonima && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg text-[8px] font-black uppercase tracking-widest shrink-0">
                                      <FiCopy size={8} /> Homónima
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                  <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <FiUser size={10} className="text-indigo-400" />
                                    {tm.tienda?.administrador || "Sin admin"}
                                  </p>
                                  <p className="text-[9px] font-bold text-slate-400 flex items-center gap-2">
                                    <span className="flex items-center gap-1"><FiUsers size={9} />{clientes}</span>
                                    <span className="flex items-center gap-1"><FiShoppingCart size={9} />{ventas}</span>
                                  </p>
                                  {esHomonima && tm.tienda?.fecha_registro && (
                                    <p className="text-[9px] font-bold text-violet-400 flex items-center gap-1">
                                      <FiCalendar size={9} />
                                      {formatDate(tm.tienda.fecha_registro)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Plan */}
                          <td className="px-4 py-5 text-center">
                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                              {tm.membresia?.nombre || "\u2014"}
                            </span>
                          </td>

                          {/* Estado */}
                          <td className="px-4 py-5 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.text}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${
                                  tm.estado === "Activa" ? "animate-pulse" : ""
                                }`}
                              />
                              {cfg.label}
                            </span>
                          </td>

                          {/* Vencimiento */}
                          <td className="px-4 py-5 text-center">
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              {formatDate(tm.fecha_vencimiento)}
                            </p>
                          </td>

                          {/* Días */}
                          <td className="px-4 py-5 text-center">
                            <p
                              className={`text-sm font-black ${daysColor} tracking-tight`}
                            >
                              {daysLabel}
                            </p>
                          </td>

                          {/* Acciones */}
                          <td className="px-4 py-5">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => entrarRuta(tm)}
                                disabled={entering === tm.id}
                                className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
                                title="Entrar a la ruta y ver todo como su administrador"
                              >
                                {entering === tm.id ? (
                                  <div className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-600 rounded-full animate-spin" />
                                ) : (
                                  <><FiLogIn size={12} /> Entrar</>
                                )}
                              </button>
                              <button
                                onClick={() => handleActivar(tm.id, "mensual")}
                                disabled={activating === `mensual-${tm.id}`}
                                className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
                                title="Activar plan mensual (30 días)"
                              >
                                {activating === `mensual-${tm.id}` ? (
                                  <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-600 rounded-full animate-spin" />
                                ) : (
                                  <><FiZap size={12} /> Mensual</>
                                )}
                              </button>
                              <button
                                onClick={() => handleActivar(tm.id, "anual")}
                                disabled={activating === `anual-${tm.id}`}
                                className="px-3 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
                                title="Activar plan anual (365 días)"
                              >
                                {activating === `anual-${tm.id}` ? (
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <><FiStar size={12} /> Anual</>
                                )}
                              </button>
                              {esVacia && (
                                <button
                                  onClick={() => setDeleteTarget(tm)}
                                  className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                                  title="Eliminar ruta vacía"
                                >
                                  <FiTrash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {currentItems.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <FiShield className="text-slate-300 mx-auto mb-4" size={36} />
                  <p className="text-sm font-black text-slate-800 dark:text-white uppercase">Sin resultados</p>
                  <p className="text-xs text-slate-400 mt-1">No se encontraron rutas con los filtros aplicados.</p>
                </div>
              ) : (
                currentItems.map((tm) => {
                  const { status: memStatus, label: daysLabel } = getMembresiaInfo(tm.fecha_vencimiento);
                  const cfg = STATUS_CONFIG[tm.estado] || STATUS_CONFIG.Activa;
                  const daysColor =
                    memStatus === "ok"
                      ? "text-emerald-600"
                      : memStatus === "warn" || memStatus === "today"
                      ? "text-amber-600"
                      : "text-rose-600";
                  const esHomonima = nombresDuplicados.has(
                    tm.tienda?.nombre?.toLowerCase().trim()
                  );
                  const clientes = tm.tienda?.cantidad_clientes ?? 0;
                  const ventas = tm.tienda?.cantidad_ventas ?? 0;
                  const esVacia = clientes === 0 && ventas === 0;

                  return (
                    <div key={tm.id} className={`px-5 py-4 ${
                      esVacia ? "bg-rose-50/40 dark:bg-rose-900/5" : esHomonima ? "bg-violet-50/40 dark:bg-violet-900/5" : ""
                    }`}>
                      <div className="flex items-center gap-2 mb-2 px-1 flex-wrap">
                        {esVacia && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-md text-[9px] font-black uppercase tracking-widest">
                            <FiTrash2 size={9} /> Vacía · Sin actividad
                          </span>
                        )}
                        {esHomonima && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-md text-[9px] font-black uppercase tracking-widest">
                            <FiCopy size={9} /> Homónima · {formatDate(tm.tienda?.fecha_registro)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                          esVacia ? "bg-rose-500/15 text-rose-600" : esHomonima ? "bg-violet-500/15 text-violet-600" : "bg-indigo-500/10 text-indigo-600"
                        }`}>
                          {esVacia ? <FiTrash2 size={14} /> : esHomonima ? <FiCopy size={14} /> : (tm.tienda?.nombre?.charAt(0) || "?")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                              {tm.tienda?.nombre}
                            </p>
                            <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md shrink-0">
                              #{tm.tienda?.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <FiUser size={10} className="text-indigo-400" />
                              {tm.tienda?.administrador || "Sin admin"}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5">
                              <span className="flex items-center gap-0.5"><FiUsers size={9} />{clientes}</span>
                              <span className="flex items-center gap-0.5"><FiShoppingCart size={9} />{ventas}</span>
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${tm.estado === "Activa" ? "animate-pulse" : ""}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plan</p>
                          <p className="text-[10px] font-black text-slate-700 dark:text-slate-200">{tm.membresia?.nombre || "—"}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vence</p>
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{formatDate(tm.fecha_vencimiento)}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Días</p>
                          <p className={`text-[11px] font-black ${daysColor}`}>{daysLabel}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => entrarRuta(tm)}
                        disabled={entering === tm.id}
                        className="w-full flex items-center justify-center gap-2 py-2.5 mb-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                      >
                        {entering === tm.id ? (
                          <div className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-600 rounded-full animate-spin" />
                        ) : <><FiLogIn size={12} /> Entrar a la ruta</>}
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleActivar(tm.id, "mensual")}
                          disabled={activating === `mensual-${tm.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                        >
                          {activating === `mensual-${tm.id}` ? (
                            <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-600 rounded-full animate-spin" />
                          ) : <><FiZap size={11} /> Mensual</>}
                        </button>
                        <button
                          onClick={() => handleActivar(tm.id, "anual")}
                          disabled={activating === `anual-${tm.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                          {activating === `anual-${tm.id}` ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : <><FiStar size={11} /> Anual</>}
                        </button>
                        {esVacia && (
                          <button
                            onClick={() => setDeleteTarget(tm)}
                            className="px-3 py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                            title="Eliminar ruta vacía"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredTiendas.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 flex items-start gap-4 px-5 py-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-white/60 dark:border-slate-800/50">
          <FiActivity className="text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" size={16} />
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Al activar un plan, la fecha de vencimiento se recalcula desde hoy.
            Solo se pueden eliminar rutas con 0 clientes y 0 ventas.
          </p>
        </div>
      </div>

      {/* Modal eliminar ruta vacía */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 md:p-8 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                <FiTrash2 className="text-rose-600" size={18} />
              </div>
              <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                Eliminar ruta
              </h2>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-5">
              <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase mb-1">
                {deleteTarget.tienda?.nombre} <span className="text-slate-400">#{deleteTarget.tienda?.id}</span>
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Admin: {deleteTarget.tienda?.administrador || "—"}
              </p>
            </div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Esta ruta no tiene clientes ni ventas. Se eliminará permanentemente junto con su membresía. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={deleting}
                className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <><FiTrash2 size={12} /> Eliminar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
