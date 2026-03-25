// app/dashboard/utilidades/page.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  FiTrendingUp,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiUser,
  FiCalendar,
  FiSearch,
  FiDollarSign,
  FiChevronLeft,
  FiChevronRight,

  FiInfo,
  FiPieChart,
  FiActivity,
  FiAlertCircle,
  FiArrowUpRight,
} from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import EliminarUtilidad from "@/app/components/utilidades/EliminarUtilidad";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatMoney, parseMoney } from "../../utils/format";

export default function UtilidadesPage() {
  const { selectedStore, token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [utilidades, setUtilidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [utilidadAEliminar, setUtilidadAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUtilidades = async () => {
    try {
      if (!selectedStore || !token) return;

      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilidades/t/${selectedStore.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar las utilidades");
      }

      const data = await response.json();
      const utilidadesData = Array.isArray(data) ? data : [];
      setUtilidades(utilidadesData);
    } catch (err) {
      setError(err.message);
      console.error("Error al obtener utilidades:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarUtilidad = async () => {
    if (!utilidadAEliminar) return;

    setEliminando(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/utilidades/${utilidadAEliminar.id}/delete/t/${selectedStore.tienda.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo eliminar la utilidad");
      }

      setUtilidades(
        utilidades.filter((utilidad) => utilidad.id !== utilidadAEliminar.id)
      );
      toast.success("Utilidad eliminada correctamente");
      setUtilidadAEliminar(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEliminando(false);
    }
  };

  useEffect(() => {
    if (selectedStore && token) {
      fetchUtilidades();
    }
  }, [selectedStore, token]);

  const filteredUtilidades = useMemo(() => {
    return utilidades.filter(
      (utilidad) =>
        utilidad.trabajador.trabajador
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (utilidad.comentario || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [utilidades, searchTerm]);

  const totalUtilidades = filteredUtilidades.reduce(
    (total, utilidad) => total + parseMoney(utilidad.valor),
    0
  );

  useEffect(() => {
    const pages = Math.ceil(filteredUtilidades.length / itemsPerPage);
    setTotalPages(pages || 1);
    if (currentPage > pages && pages > 0) {
      setCurrentPage(pages);
    }
  }, [filteredUtilidades, itemsPerPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUtilidades = filteredUtilidades.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const getPageNumbers = (current, total) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, 5];
    if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
    return [current - 2, current - 1, current, current + 1, current + 2];
  };


  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Consolidando Reparto de Utilidades</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-emerald-600 p-4 rounded-[1.5rem] shadow-xl shadow-emerald-200 dark:shadow-none">
               <FiTrendingUp className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Utilidades</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                Gestión de Reparto • <span className="text-emerald-500">{selectedStore?.tienda?.nombre}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchUtilidades}
              className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-emerald-600 transition-all shadow-sm group"
            >
              <FiRefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
            </button>
            <Link 
              href="/dashboard/utilidades/crear"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <FiPlus size={20} />
              Nueva Utilidad
            </Link>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
                  <FiDollarSign size={24} />
                </div>
                <div className="group relative">
                  <FiInfo className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" size={12} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter text-center">
                    Monto total de las utilidades repartidas en el periodo consultado.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                  </div>
                </div>
              </div>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter mb-1 select-all">
                {formatMoney(totalUtilidades)}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Monto Distribuido</p>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 rounded-2xl">
                  <FiUser className="text-indigo-600" size={24} />
                </div>
                <div className="group relative">
                  <FiInfo className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" size={12} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter text-center">
                    Número total de transacciones de utilidad registradas.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                  </div>
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                {filteredUtilidades.length}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Registros Emitidos</p>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative col-span-1 md:col-span-2 overflow-hidden flex items-center justify-between group">
             <div className="relative z-10">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2 tracking-widest leading-none">Utilidad Promedio por Giro</p>
                <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                   {formatMoney(filteredUtilidades.length > 0 ? totalUtilidades / filteredUtilidades.length : 0)}
                </h3>
             </div>
             <div className="opacity-10 group-hover:opacity-20 transition-opacity">
                <FiPieChart size={80} className="text-emerald-600" />
             </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 mb-8 p-8">
           <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="relative flex-1 w-full group">
                <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por colaborador o justificante..."
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-3xl text-[14px] font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-4 w-full lg:w-auto">
                 <div className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrar</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="bg-transparent border-none text-xs font-black text-slate-800 dark:text-white focus:ring-0 cursor-pointer p-0"
                    >
                      <option value={5}>05</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                 </div>
                 {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="px-6 py-4 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl hover:bg-emerald-100 transition-all"
                    >
                      Limpiar
                    </button>
                 )}
              </div>
           </div>
        </div>

        {/* Table Section */}
        <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ejecución</th>
                  <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Colaborador Beneficiario</th>
                  <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Concepto de Reparto</th>
                  <th className="px-4 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monto Neto</th>
                  <th className="px-4 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentUtilidades.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-24 text-center">
                      <div className="bg-slate-50 dark:bg-slate-800/50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <FiPieChart className="text-4xl text-slate-200" />
                      </div>
                      <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Sin distribuciones reportadas</h3>
                      <p className="text-sm font-bold text-slate-400 mt-2 px-1">No se encontraron utilidades vinculadas a este criterio.</p>
                    </td>
                  </tr>
                ) : (
                  currentUtilidades.map((utilidad) => (
                    <tr key={utilidad.id} className="group hover:bg-slate-50/50 dark:hover:bg-emerald-500/5 transition-all">
                      <td className="px-4 py-6 whitespace-nowrap">
                         <div className="flex items-center gap-2 text-slate-500">
                            <FiCalendar className="text-slate-300" />
                            <span className="text-xs font-bold">{new Date(utilidad.fecha).toLocaleDateString()}</span>
                         </div>
                      </td>
                      <td className="px-4 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 font-black text-xs uppercase">
                              {utilidad.trabajador.trabajador.charAt(0)}
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{utilidad.trabajador.trabajador}</p>
                              <p className="text-[10px] font-bold text-slate-400">ID: {utilidad.trabajador.identificacion}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                         <p className="text-xs font-bold text-slate-400 truncate max-w-xs">{utilidad.comentario || "Reparto general de utilidades operativas"}</p>
                      </td>
                      <td className="px-4 py-6 whitespace-nowrap text-right">
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                          {formatMoney(utilidad.valor)}
                        </p>
                      </td>
                      <td className="px-4 py-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2 transition-opacity">
                           <button
                            onClick={() => {
                              localStorage.setItem("utilidadEditar", JSON.stringify(utilidad));
                              router.push(`/dashboard/utilidades/${utilidad.id}/editar`);
                            }}
                            className="p-3 bg-white dark:bg-slate-800 text-slate-400 rounded-xl hover:text-indigo-600 hover:shadow-lg transition-all active:scale-95"
                           >
                              <FiEdit size={16} />
                           </button>
                           <button
                            onClick={() => setUtilidadAEliminar(utilidad)}
                            className="p-3 bg-white dark:bg-slate-800 text-slate-400 rounded-xl hover:text-rose-600 hover:shadow-lg transition-all active:scale-95"
                           >
                              <FiTrash2 size={16} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-8 py-5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">
                {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredUtilidades.length)} de {filteredUtilidades.length}
              </p>
              <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                >
                  <FiChevronLeft size={16} />
                </button>
                {getPageNumbers(currentPage, totalPages).map(n => (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className={`w-9 h-9 rounded-xl text-[11px] font-black transition-all active:scale-95 ${
                      currentPage === n
                        ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-lg'
                        : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de confirmación de eliminación */}
        <EliminarUtilidad
          isOpen={!!utilidadAEliminar}
          onClose={() => setUtilidadAEliminar(null)}
          onConfirm={handleEliminarUtilidad}
          isLoading={eliminando}
          utilidad={utilidadAEliminar}
        />
      </div>
    </div>
  );
}
