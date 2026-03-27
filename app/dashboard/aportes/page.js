// app/dashboard/aportes/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";
import {
  FiDollarSign,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiUser,
  FiCalendar,
  FiSearch,
  FiActivity,
  FiClock,
  FiPieChart,
  FiArrowUpRight,
} from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/app/components/ConfirmModal";
import { toast } from "react-toastify";
import LoadingSpinner from "../../components/LoadingSpinner";
import { formatMoney, parseMoney } from "../../utils/format";
import Pagination from "../../components/Pagination";

export default function AportesPage() {
  const router = useRouter();
  const { selectedStore, isAuthenticated, loading: authLoading } = useAuth();
  const [aportes, setAportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [aporteAEliminar, setAporteAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const fetchAportes = async () => {
    try {
      if (!selectedStore) return;

      setLoading(true);
      const response = await apiFetch(
        `/aportes/t/${selectedStore.tienda.id}/`
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar los aportes");
      }

      const data = await response.json();
      const aportesData = Array.isArray(data) ? data : [];
      setAportes(aportesData);
      setCurrentPage(1); 
    } catch (err) {
      setError(err.message);
      console.error("Error al obtener aportes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarAporte = async () => {
    if (!aporteAEliminar) return;

    setEliminando(true);
    try {
      const response = await apiFetch(
        `/aportes/${aporteAEliminar.id}/delete/t/${selectedStore.tienda.id}/`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("No se pudo eliminar el aporte");
      }

      setAportes(aportes.filter((aporte) => aporte.id !== aporteAEliminar.id));
      toast.success("Aporte eliminado correctamente");
      setAporteAEliminar(null);
    } catch (err) {
      toast.error(err.message);
      console.error("Error al eliminar aporte:", err);
    } finally {
      setEliminando(false);
    }
  };

  useEffect(() => {
    if (selectedStore) {
      fetchAportes();
    }
  }, [selectedStore]);

  const filteredAportes = aportes.filter(
    (aporte) =>
      aporte.trabajador.trabajador
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (aporte.comentario && aporte.comentario.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAportes = filteredAportes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAportes.length / itemsPerPage);

  const totalAportes = filteredAportes.reduce(
    (total, aporte) => total + parseMoney(aporte.valor),
    0
  );

  if (authLoading || loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="w-full">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-indigo-600 p-4 rounded-[1.5rem] shadow-xl shadow-indigo-200 dark:shadow-none">
               <FiPieChart className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Inyección de Capital</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
                Fondos de Inversión • <span className="text-indigo-500">{selectedStore?.tienda?.nombre}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchAportes}
              className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm"
            >
              <FiRefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <Link 
              href="/dashboard/aportes/crear"
              className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <FiPlus size={20} />
              Registrar Aporte
            </Link>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                  <FiDollarSign size={24} />
                </div>
                <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                   <FiArrowUpRight /> Total
                </div>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1 select-all">
                {formatMoney(totalAportes)}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capital Total Inyectado</p>
            </div>
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 rounded-2xl">
                  <FiActivity size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Registros</span>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                {filteredAportes.length}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operaciones Realizadas</p>
            </div>
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-slate-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          </div>

          <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
                  <FiClock size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Historial</span>
              </div>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                {filteredAportes.length > 0
                  ? new Date(filteredAportes[0].fecha).toLocaleDateString()
                  : "N/A"}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Último Movimiento</p>
            </div>
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          </div>
        </div>

        {/* Search & Table Section */}
        <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-transparent">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <FiSearch size={20} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por inversionista o descripción de aporte..."
                className="block w-full pl-14 pr-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[15px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/20 p-4">
                  <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha</th>
                  <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Origen de Fondos</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor Inyectado</th>
                  <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Comentarios</th>
                  <th className="px-4 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentAportes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-8 py-24 text-center">
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <FiDollarSign className="text-4xl text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Sin aportes registrados</h3>
                      <p className="text-xs font-bold text-slate-400 mb-6 max-w-xs mx-auto">Registra tu primer aporte de capital para comenzar.</p>
                      <button
                        onClick={() => router.push("/dashboard/aportes/crear")}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-all"
                      >
                        Registrar Primer Aporte
                      </button>
                    </td>
                  </tr>
                ) : (
                  currentAportes.map((aporte) => (
                    <tr key={aporte.id} className="group hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all">
                      <td className="px-4 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-500">
                          <FiCalendar className="text-slate-300" />
                          <span className="text-xs font-bold">{new Date(aporte.fecha).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 font-black text-xs uppercase">
                            {aporte.trabajador.trabajador.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{aporte.trabajador.trabajador}</p>
                            <p className="text-[10px] font-bold text-slate-400">ID: {aporte.trabajador.identificacion}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-right">
                        <p className="text-base font-black text-indigo-600 dark:text-indigo-400 tracking-tighter leading-none mb-1">
                          {formatMoney(parseFloat(aporte.valor))}
                        </p>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.1em]">Capital Activo</p>
                      </td>
                      <td className="px-4 py-6">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 max-w-xs line-clamp-2 italic leading-relaxed">
                          &quot;{aporte.comentario || 'Sin observaciones adicionales'}&quot;
                        </p>
                      </td>
                      <td className="px-4 py-6 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              localStorage.setItem("aporteEditar", JSON.stringify(aporte));
                              router.push(`/dashboard/aportes/${aporte.id}/editar`);
                            }}
                            className="p-3 bg-white dark:bg-slate-800 text-slate-400 rounded-xl hover:text-indigo-600 hover:shadow-lg transition-all active:scale-95"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => setAporteAEliminar(aporte)}
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

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredAportes.length}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          />
        </div>

        {/* Modal de Confirmación */}
        {aporteAEliminar && (
          <ConfirmModal
            isOpen={!!aporteAEliminar}
            onClose={() => setAporteAEliminar(null)}
            onConfirm={handleEliminarAporte}
            title="Revocar Inyección"
            message={`¿Está seguro que desea eliminar este aporte de capital de ${aporteAEliminar?.trabajador?.trabajador} por valor de ${formatMoney(parseFloat(aporteAEliminar?.valor))}? Esta acción afectará el balance de caja.`}
            confirmText="Sí, Revocar Fondos"
            cancelText="Cancelar"
            isLoading={eliminando}
          />
        )}
      </div>
    </div>
  );
}
