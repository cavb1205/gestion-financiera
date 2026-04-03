// app/dashboard/cierre-caja/page.js
"use client";

import { useState, useEffect } from "react";
import {
  FiLock,
  FiCalendar,
  FiDollarSign,
  FiRefreshCw,
  FiTrash2,
  FiCheck,
  FiInfo,
  FiActivity,
  FiShield,
  FiClock,
} from "react-icons/fi";
import { useAuth } from "@/app/context/AuthContext";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import ConfirmModal from "@/app/components/ConfirmModal";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { formatMoney } from "../../utils/format";
import { apiFetch } from "../../utils/api";
import Pagination from "../../components/Pagination";

export default function CierreCajaPage() {
  const { selectedStore, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [cierres, setCierres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Delete modal
  const [cierreToDelete, setCierreToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Caja anterior
  const [cajaAnterior, setCajaAnterior] = useState(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !selectedStore)) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, selectedStore, router]);

  // Fetch lista de cierres
  const fetchCierres = async () => {
    if (!selectedStore) return;
    setLoading(true);
    try {
      const response = await apiFetch(
        `/tiendas/cierres/t/${selectedStore.tienda.id}/`
      );
      if (!response.ok) throw new Error("Error al obtener los cierres de caja");
      const data = await response.json();
      if (data.message) {
        setCierres([]);
      } else {
        setCierres(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch caja anterior para la fecha seleccionada
  const fetchCajaAnterior = async () => {
    if (!selectedStore || !selectedDate) return;
    try {
      const response = await apiFetch(
        `/tiendas/cierre/${selectedDate}/t/${selectedStore.tienda.id}/`
      );
      if (!response.ok) throw new Error("Error al consultar caja anterior");
      const data = await response.json();
      if (data.message) {
        setCajaAnterior(null);
      } else {
        setCajaAnterior(data);
      }
    } catch {
      setCajaAnterior(null);
    }
  };

  useEffect(() => {
    if (selectedStore) {
      fetchCierres();
    }
  }, [selectedStore]);

  useEffect(() => {
    if (selectedStore && selectedDate) {
      fetchCajaAnterior();
    }
  }, [selectedStore, selectedDate]);

  // Crear cierre
  const handleCrearCierre = async () => {
    if (!selectedDate) {
      toast.error("Seleccione una fecha para el cierre");
      return;
    }

    // Verificar si ya existe un cierre para esa fecha
    const yaExiste = cierres.some(c => c.fecha_cierre === selectedDate);
    if (yaExiste) {
      toast.error("Ya existe un cierre de caja para esta fecha");
      return;
    }

    setCreating(true);
    try {
      const response = await apiFetch(
        `/tiendas/cierre/post/${selectedDate}/t/${selectedStore.tienda.id}/`,
        {
          method: "POST",
        }
      );
      if (!response.ok) throw new Error("Error al crear el cierre de caja");
      toast.success("Cierre de caja registrado exitosamente");
      fetchCierres();
      fetchCajaAnterior();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  // Eliminar cierre
  const handleDeleteCierre = async () => {
    if (!cierreToDelete) return;
    setDeleting(true);
    try {
      const response = await apiFetch(
        `/tiendas/cierre/delete/${cierreToDelete.id}/`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Error al eliminar el cierre");
      toast.success("Cierre de caja eliminado");
      setCierreToDelete(null);
      fetchCierres();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Paginación
  const totalPages = Math.ceil(cierres.length / itemsPerPage);
  const paginatedCierres = cierres.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("es", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="py-4 md:py-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
              <FiLock size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
              Cierre de Caja
            </h1>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
            Registro de cortes diarios &bull; Balance operativo
          </p>
        </div>

        <button
          onClick={fetchCierres}
          className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
        >
          <FiRefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {/* Crear Cierre Section */}
      <div className="glass rounded-[2.5rem] p-8 md:p-10 border-white/60 dark:border-slate-800 mb-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
            <FiShield size={20} />
          </div>
          <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">
            Nuevo Cierre
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          {/* Fecha */}
          <div className="space-y-2">
            <label htmlFor="fecha-cierre" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              Fecha del Cierre
            </label>
            <input
              id="fecha-cierre"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          {/* Caja Anterior */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              Caja del Día Anterior
            </label>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl">
              <p className="text-[13px] font-black text-slate-800 dark:text-white">
                {cajaAnterior ? formatMoney(cajaAnterior.valor) : "Sin registro"}
              </p>
              {cajaAnterior && (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {formatDate(cajaAnterior.fecha_cierre)}
                </p>
              )}
            </div>
          </div>

          {/* Botón Crear */}
          <button
            onClick={handleCrearCierre}
            disabled={creating}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {creating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Procesando...
              </>
            ) : (
              <>
                <FiCheck size={20} />
                Registrar Cierre
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 flex items-start gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <FiInfo size={14} className="shrink-0 mt-0.5" />
          <span>El valor del cierre se calcula automáticamente basado en el balance actual de la tienda.</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                <FiActivity size={24} />
              </div>
            </div>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter mb-1">
              {cierres.length}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Cierres Registrados
            </p>
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
                <FiDollarSign size={24} />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter mb-1 select-all">
              {cierres.length > 0 ? formatMoney(cierres[0].valor) : "$0"}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Último Cierre
            </p>
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
                <FiClock size={24} />
              </div>
            </div>
            <p className="text-lg font-black text-slate-800 dark:text-white tracking-tighter mb-1">
              {cierres.length > 0 ? formatDate(cierres[0].fecha_cierre) : "—"}
            </p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Fecha Último Cierre
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-[2.5rem] overflow-hidden border-white/60 dark:border-slate-800">
        {/* Table Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">
            Historial de Cierres
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {cierres.length} registros
          </span>
        </div>

        {cierres.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <FiLock size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
              No hay cierres registrados
            </p>
            <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 mt-2 uppercase tracking-widest">
              Registre su primer cierre de caja para comenzar
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Fecha
                    </th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Valor de Caja
                    </th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCierres.map((cierre) => (
                    <tr
                      key={cierre.id}
                      className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl flex items-center justify-center">
                            <FiCalendar size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 dark:text-white">
                              {formatDate(cierre.fecha_cierre)}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              ID: {cierre.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {formatMoney(cierre.valor)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => setCierreToDelete(cierre)}
                          className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                          title="Eliminar cierre"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/50">
              {paginatedCierres.map((cierre) => (
                <div key={cierre.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-2xl flex items-center justify-center">
                      <FiCalendar size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-white">
                        {formatDate(cierre.fecha_cierre)}
                      </p>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatMoney(cierre.valor)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCierreToDelete(cierre)}
                    className="p-3 text-slate-300 hover:text-rose-600 rounded-xl transition-all"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={cierres.length}
              itemsPerPage={itemsPerPage}
            />
          </>
        )}
      </div>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!cierreToDelete}
        onClose={() => setCierreToDelete(null)}
        onConfirm={handleDeleteCierre}
        title="¿Eliminar Cierre?"
        message={cierreToDelete ? `Se eliminará el cierre de caja del ${formatDate(cierreToDelete.fecha_cierre)} por ${formatMoney(cierreToDelete.valor)}. Esta acción no se puede deshacer.` : ""}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        isLoading={deleting}
      />
    </div>
  );
}
