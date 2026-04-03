// app/dashboard/admin/rutas/page.js
"use client";

import { useState, useEffect, useMemo } from "react";
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
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [activating, setActivating] = useState(null); // "mensual-<id>" | "anual-<id>"
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [creating, setCreating] = useState(false);

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

  useEffect(() => {
    if (user?.is_superuser) fetchTiendas();
  }, [user]);

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
    if (filterEstado !== "Todos") {
      result = result.filter((t) => t.estado === filterEstado);
    }
    return result;
  }, [tiendas, searchTerm, filterEstado]);

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
    return { total: tiendas.length, activas, pendientes, vencidas };
  }, [tiendas]);

  const getDaysRemaining = (fechaVencimiento) => {
    if (!fechaVencimiento) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(fechaVencimiento + "T00:00:00");
    return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
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

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!newNombre.trim()) return;
    setCreating(true);
    try {
      const response = await apiFetch("/tiendas/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newNombre.trim(), administrador: user.id }),
      });
      if (!response.ok) throw new Error("Error al crear la ruta");
      toast.success(`Ruta "${newNombre.trim()}" creada con membresía de prueba (7 días)`);
      setNewNombre("");
      setShowCreateModal(false);
      fetchTiendas();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCreating(false);
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95"
            >
              <FiPlus size={16} />
              Nueva Ruta
            </button>
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
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
          <div className="glass p-6 md:p-8 rounded-[2rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Total Rutas
            </p>
            <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
              {metrics.total}
            </p>
          </div>
          <div className="glass p-6 md:p-8 rounded-[2rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">
              Activas
            </p>
            <p className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
              {metrics.activas}
            </p>
          </div>
          <div className="glass p-6 md:p-8 rounded-[2rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">
              Pendientes
            </p>
            <p className="text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tighter">
              {metrics.pendientes}
            </p>
          </div>
          <div className="glass p-6 md:p-8 rounded-[2rem] border-white/60 dark:border-slate-800 relative overflow-hidden">
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2">
              Vencidas
            </p>
            <p className="text-2xl md:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tighter">
              {metrics.vencidas}
            </p>
          </div>
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
            <div className="flex items-center gap-2">
              {["Todos", "Activa", "Pendiente Pago", "Vencida"].map(
                (estado) => (
                  <button
                    key={estado}
                    onClick={() => setFilterEstado(estado)}
                    className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                      filterEstado === estado
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300"
                    }`}
                  >
                    {estado === "Pendiente Pago" ? "Pendiente" : estado}
                  </button>
                )
              )}
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
            <div className="overflow-x-auto">
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
                    <th className="hidden md:table-cell px-4 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      Vencimiento
                    </th>
                    <th className="hidden md:table-cell px-4 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
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
                      const days = getDaysRemaining(tm.fecha_vencimiento);
                      const cfg = STATUS_CONFIG[tm.estado] || STATUS_CONFIG.Activa;
                      const daysColor =
                        days > 15
                          ? "text-emerald-600"
                          : days > 5
                          ? "text-amber-600"
                          : "text-rose-600";

                      return (
                        <tr
                          key={tm.id}
                          className="group hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all"
                        >
                          {/* Ruta / Admin */}
                          <td className="px-4 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm shrink-0">
                                {tm.tienda?.nombre?.charAt(0) || "?"}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                                  {tm.tienda?.nombre}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                                  <FiUser size={10} className="text-indigo-400" />
                                  {tm.tienda?.administrador || "Sin admin"}
                                </p>
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
                          <td className="hidden md:table-cell px-4 py-5 text-center">
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              {formatDate(tm.fecha_vencimiento)}
                            </p>
                          </td>

                          {/* Días */}
                          <td className="hidden md:table-cell px-4 py-5 text-center">
                            <p
                              className={`text-sm font-black ${daysColor} tracking-tight`}
                            >
                              {days > 0 ? days : 0}
                            </p>
                          </td>

                          {/* Acciones */}
                          <td className="px-4 py-5">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  handleActivar(tm.id, "mensual")
                                }
                                disabled={activating === `mensual-${tm.id}`}
                                className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
                                title="Activar plan mensual (30 días)"
                              >
                                {activating === `mensual-${tm.id}` ? (
                                  <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-600 rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <FiZap size={12} />
                                    Mensual
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  handleActivar(tm.id, "anual")
                                }
                                disabled={activating === `anual-${tm.id}`}
                                className="px-3 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
                                title="Activar plan anual (365 días)"
                              >
                                {activating === `anual-${tm.id}` ? (
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <FiStar size={12} />
                                    Anual
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
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
            Las rutas nuevas se crean con membresía de prueba de 7 días.
          </p>
        </div>
      </div>

      {/* ── Modal Nueva Ruta ──────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative glass rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-white/60 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2.5 rounded-xl">
                  <FiPlus className="text-white" size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    Nueva Ruta
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Membresía de prueba 7 días
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCrear} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Nombre de la ruta
                </label>
                <input
                  type="text"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Ej: Ruta Norte, Tienda Centro..."
                  autoFocus
                  required
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-[13px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !newNombre.trim()}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95"
                >
                  {creating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiPlus size={14} />
                      Crear Ruta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
