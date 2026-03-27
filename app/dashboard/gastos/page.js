// app/dashboard/gastos/page.js
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FiPlus,
  FiFilter,
  FiRefreshCw,
  FiDollarSign,
  FiCalendar,
  FiTrash2,
  FiEdit,
  FiTag,
  FiSearch,
  FiPieChart,
  FiActivity,
  FiInfo,
  FiAlertCircle,
  FiArrowUpRight,
  FiArrowDownRight,
  FiTrendingDown,
} from "react-icons/fi";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney, parseMoney } from "../../utils/format";
import Pagination from "../../components/Pagination";

export default function GastosPage() {
  const { selectedStore, isAuthenticated, loading: authLoading } = useAuth();
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tiposGasto, setTiposGasto] = useState([]);
  const [filters, setFilters] = useState({
    fechaInicio: "",
    fechaFin: "",
    tipoGasto: "Todos",
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [gastoToDelete, setGastoToDelete] = useState(null);

  // Paginación en el cliente
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();

  // Obtener tipos de gasto
  const fetchTiposGasto = async () => {
    try {
      const response = await apiFetch(`/gastos/tipo/`);
      if (!response.ok) throw new Error("Error al obtener los tipos de gasto");
      const data = await response.json();
      setTiposGasto(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Obtener gastos
  const fetchGastos = async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const response = await apiFetch(
        `/gastos/t/${selectedStore.tienda.id}/`
      );
      if (!response.ok) throw new Error("Error al obtener los gastos");
      const data = await response.json();
      setGastos(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!gastoToDelete) return;
    setIsDeleting(true);
    try {
      const response = await apiFetch(
        `/gastos/${gastoToDelete.id}/delete/t/${selectedStore.tienda.id}/`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || "Error al eliminar el gasto.");
      }

      toast.success("Gasto eliminado exitosamente");
      fetchGastos();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
      setGastoToDelete(null);
    }
  };

  useEffect(() => {
    if (selectedStore) {
      fetchTiposGasto();
      fetchGastos();
    }
  }, [selectedStore]);

  const filteredGastos = useMemo(() => {
    return gastos.filter((gasto) => {
      if (filters.fechaInicio && gasto.fecha < filters.fechaInicio) return false;
      if (filters.fechaFin && gasto.fecha > filters.fechaFin) return false;
      if (filters.tipoGasto !== "Todos" && gasto.tipo_gasto.id.toString() !== filters.tipoGasto) return false;
      return true;
    });
  }, [gastos, filters]);

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredGastos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredGastos.length / itemsPerPage);


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ fechaInicio: "", fechaFin: "", tipoGasto: "Todos" });
    setCurrentPage(1);
  };


  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-transparent">
        <LoadingSpinner />
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Auditando Egresos de Caja</p>
      </div>
    );
  }

  const totalGastosMonto = filteredGastos.reduce((acc, gasto) => acc + parseMoney(gasto.valor), 0);

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-rose-600 p-4 rounded-[1.5rem] shadow-xl shadow-rose-200 dark:shadow-none">
               <FiArrowDownRight className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Control de Gastos</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
                Flujo de Egreso • <span className="text-rose-500">{selectedStore?.tienda?.nombre}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchGastos}
              className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-rose-600 transition-all shadow-sm group"
            >
              <FiRefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
            </button>
            <Link 
              href="/dashboard/gastos/crear"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-rose-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <FiPlus size={20} />
              Registrar Gasto
            </Link>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl">
                  <FiDollarSign size={24} />
                </div>
                <div className="group relative">
                  <FiInfo className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" size={12} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter">
                    Suma acumulada de todos los egresos registrados en el periodo seleccionado.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                  </div>
                </div>
              </div>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tighter mb-1 select-all">
                {formatMoney(totalGastosMonto)}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Inversión Operativa Total</p>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 rounded-2xl">
                  <FiTag size={24} />
                </div>
                <div className="group relative">
                  <FiInfo className="text-slate-300 hover:text-indigo-500 cursor-help transition-colors" size={12} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-4 bg-slate-900/95 backdrop-blur-xl text-[10px] text-slate-200 font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 pointer-events-none z-50 shadow-2xl border border-white/10 text-center uppercase tracking-tighter">
                    Cantidad total de movimientos de salida registrados.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/95"></div>
                  </div>
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                {filteredGastos.length}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Registros Emitidos</p>
            </div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative col-span-1 md:col-span-2 overflow-hidden flex items-center justify-between group">
             <div className="relative z-10">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-2 tracking-widest">Gasto Promedio por Operación</p>
                <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                   {formatMoney(filteredGastos.length > 0 ? totalGastosMonto / filteredGastos.length : 0)}
                </h3>
             </div>
             <div className="opacity-10 group-hover:opacity-20 transition-opacity">
                <FiPieChart size={80} className="text-rose-600" />
             </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 mb-8 p-8">
           <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 w-full">
                <div className="space-y-2">
                  <label htmlFor="fechaInicio" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Desde</label>
                  <input
                    id="fechaInicio"
                    type="date"
                    name="fechaInicio"
                    value={filters.fechaInicio}
                    onChange={handleFilterChange}
                    className="block w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-rose-500/10 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="fechaFin" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Hasta</label>
                  <input
                    id="fechaFin"
                    type="date"
                    name="fechaFin"
                    value={filters.fechaFin}
                    onChange={handleFilterChange}
                    className="block w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-rose-500/10 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="tipoGasto" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoría</label>
                  <select
                    id="tipoGasto"
                    name="tipoGasto"
                    value={filters.tipoGasto}
                    onChange={handleFilterChange}
                    className="block w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest appearance-none focus:ring-4 focus:ring-rose-500/10 transition-all cursor-pointer"
                  >
                    <option value="Todos">Todas las Categorías</option>
                    {tiposGasto.map(t => <option key={t.id} value={t.id}>{t.tipo_gasto}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-end h-full">
                <button 
                  onClick={resetFilters}
                  className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-rose-500 transition-all"
                >
                  Resetear Filtros
                </button>
              </div>
           </div>
        </div>

        {/* Table Section */}
        <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha</th>
                  <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clasificación</th>
                  <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Descripción / Nota</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Importe</th>
                  <th className="px-4 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-24 text-center">
                      <div className="bg-rose-50 dark:bg-rose-900/20 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <FiTrendingDown className="text-4xl text-rose-400" />
                      </div>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Sin gastos reportados</h3>
                      <p className="text-xs font-bold text-slate-400 mb-6 max-w-xs mx-auto">No se encontraron egresos vinculados a este periodo.</p>
                      <button
                        onClick={() => router.push("/dashboard/gastos/crear")}
                        className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200 dark:shadow-none active:scale-95 transition-all"
                      >
                        Registrar Primer Gasto
                      </button>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((gasto) => (
                    <tr key={gasto.id} className="group hover:bg-slate-50/50 dark:hover:bg-rose-500/5 transition-all">
                      <td className="px-4 py-6 whitespace-nowrap">
                         <div className="flex items-center gap-2 text-slate-500">
                            <FiCalendar className="text-slate-300" />
                            <span className="text-xs font-bold">{gasto.fecha}</span>
                         </div>
                      </td>
                      <td className="px-4 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
                              <FiTag size={14} />
                           </div>
                           <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{gasto.tipo_gasto.tipo_gasto}</span>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                         <p className="text-xs font-bold text-slate-400 truncate max-w-xs">{gasto.comentario || "Sin descripción de gestión"}</p>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-right">
                        <p className="text-sm font-black text-rose-600 dark:text-rose-400 tracking-tight leading-none">
                          {formatMoney(gasto.valor)}
                        </p>
                      </td>
                      <td className="px-4 py-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                           <button 
                            onClick={() => router.push(`/dashboard/gastos/${gasto.id}/editar`)}
                            className="p-3 bg-white dark:bg-slate-800 text-slate-400 rounded-xl hover:text-indigo-600 hover:shadow-lg transition-all"
                           >
                              <FiEdit size={16} />
                           </button>
                           <button 
                            onClick={() => setGastoToDelete(gasto)}
                            className="p-3 bg-white dark:bg-slate-800 text-slate-400 rounded-xl hover:text-rose-600 hover:shadow-lg transition-all"
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

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredGastos.length}
            itemsPerPage={itemsPerPage}
          />
        </div>

        {/* Modal de confirmación de eliminación */}
        {gastoToDelete && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
            <div className="glass max-w-md w-full rounded-[2.5rem] border-white/20 p-10 shadow-2xl">
               <div className="text-center">
                  <div className="w-24 h-24 bg-rose-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-rose-200">
                     <FiAlertCircle size={48} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-4 uppercase">¿Eliminar Registro?</h2>
                  <p className="text-sm font-bold text-slate-400 mb-10 leading-relaxed uppercase tracking-tighter">Esta acción reversará el egreso de caja y no podrá ser auditado posteriormente.</p>
               </div>

               <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 mb-10">
                  <div className="space-y-4">
                     <div className="flex justify-between">
                        <span className="text-[10px] font-black text-slate-300 uppercase">Clasificación</span>
                        <span className="text-xs font-black text-slate-800 dark:text-white">{gastoToDelete.tipo_gasto.tipo_gasto}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-[10px] font-black text-slate-300 uppercase">Monto</span>
                        <span className="text-xs font-black text-rose-600">{formatMoney(gastoToDelete.valor)}</span>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full py-5 bg-rose-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all"
                  >
                    {isDeleting ? "Sincronizando..." : "Confirmar Eliminación"}
                  </button>
                  <button
                    onClick={() => setGastoToDelete(null)}
                    disabled={isDeleting}
                    className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest"
                  >
                    Cancelar
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
