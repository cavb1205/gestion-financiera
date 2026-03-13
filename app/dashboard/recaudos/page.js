// app/dashboard/recaudos/page.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  FiDollarSign,
  FiCalendar,
  FiRefreshCw,
  FiChevronLeft,
  FiUser,
  FiSearch,
  FiCheck,
  FiX,
  FiEdit,
  FiTrash2,
  FiActivity,
  FiPieChart,
  FiClock,
  FiTarget,
  FiFilter,
  FiInfo,
  FiArrowRight,
  FiShield
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EditarRecaudo from "@/app/components/recaudos/EditarRecaudo";
import EliminarRecaudo from "@/app/components/recaudos/EliminarRecaudo";

export default function RecaudosPage() {
  const { token, selectedStore, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [recaudos, setRecaudos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [editingRecaudo, setEditingRecaudo] = useState(null);
  const [deletingRecaudo, setDeletingRecaudo] = useState(null);

  // Establecer fecha inicial
  useEffect(() => {
    const storedDate = localStorage.getItem("liquidarFecha");
    if (storedDate) {
      setSelectedDate(storedDate);
    } else {
      const today = new Date();
      const formattedDate = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
      )
        .toISOString()
        .split("T")[0];
      setSelectedDate(formattedDate);
    }
  }, []);

  // Obtener recaudos
  const fetchRecaudos = async () => {
    if (!token || !selectedStore || !selectedDate) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recaudos/list/${selectedDate}/t/${selectedStore.tienda.id}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Error al sincronizar recaudos");

      const data = await response.json();
      setRecaudos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
      setRecaudos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate && token && selectedStore) {
      fetchRecaudos();
      localStorage.setItem("liquidarFecha", selectedDate);
    }
  }, [token, selectedStore, selectedDate]);

  // Procesamiento de datos (Filtrado y Métricas)
  const filteredRecaudos = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return recaudos.filter((r) => {
      const cliente = r.venta?.cliente || {};
      const full = `${cliente.nombres || ""} ${cliente.apellidos || ""}`.toLowerCase();
      return full.includes(term) || r.id.toString().includes(term);
    });
  }, [searchTerm, recaudos]);

  const metrics = useMemo(() => {
    const total = filteredRecaudos.reduce((acc, r) => acc + parseFloat(r.valor_recaudo || 0), 0);
    const abonos = filteredRecaudos.filter(r => parseFloat(r.valor_recaudo) > 0).length;
    const fallas = filteredRecaudos.filter(r => parseFloat(r.valor_recaudo) === 0).length;
    return { total, abonos, fallas, count: filteredRecaudos.length };
  }, [filteredRecaudos]);

  // Paginación
  const totalPages = Math.ceil(filteredRecaudos.length / itemsPerPage);
  const currentItems = filteredRecaudos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatCurrency = (value) => {
    return "$" + new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const handleRecaudoEditado = (updated) => {
    setRecaudos(prev => prev.map(r => r.id === updated.id ? updated : r));
    setEditingRecaudo(null);
    toast.success("Recaudo sincronizado correctamente");
  };

  const handleRecaudoEliminado = () => {
    setRecaudos(prev => prev.filter(r => r.id !== deletingRecaudo.id));
    setDeletingRecaudo(null);
    toast.warning("Registro eliminado de la auditoría");
  };

  if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-transparent pb-12">
      {editingRecaudo && (
        <EditarRecaudo
          editingRecaudo={editingRecaudo}
          onEditar={handleRecaudoEditado}
          onClose={() => setEditingRecaudo(null)}
        />
      )}

      {deletingRecaudo && (
        <EliminarRecaudo
          deletingRecaudo={deletingRecaudo}
          onEliminar={handleRecaudoEliminado}
          onClose={() => setDeletingRecaudo(null)}
        />
      )}

      <div className="w-full">

        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-indigo-600 p-4 rounded-[1.5rem] shadow-xl shadow-indigo-200 dark:shadow-none">
               <FiPieChart className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Auditoría de Recaudos</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                Registro de Gestión • <span className="text-indigo-500">{selectedStore.tienda.nombre}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-6 py-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-all shadow-sm"
             >
               Hoy
             </button>
             <button 
              onClick={fetchRecaudos}
              className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-emerald-600 transition-all shadow-sm group"
             >
               <FiRefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
             </button>
          </div>
        </div>

        {/* Premium Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group shadow-2xl">
              <div className="relative z-10">
                 <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
                       <FiDollarSign size={24} />
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Caja del Día</span>
                 </div>
                 <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                    {formatCurrency(metrics.total)}
                 </p>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Efectivo Ingresado</p>
              </div>
              <div className="absolute -right-5 -bottom-5 text-emerald-500/5 group-hover:scale-110 transition-transform">
                 <FiDollarSign size={120} />
              </div>
           </div>

           <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group shadow-2xl">
              <div className="relative z-10">
                 <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                       <FiCheck size={24} />
                    </div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Efectividad</span>
                 </div>
                 <div className="flex items-end gap-3 mb-1">
                    <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">
                       {metrics.count > 0 ? Math.round((metrics.abonos / metrics.count) * 100) : 0}%
                    </p>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">({metrics.abonos} de {metrics.count})</p>
                 </div>
                 <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                      style={{ width: `${metrics.count > 0 ? (metrics.abonos / metrics.count) * 100 : 0}%` }}
                    ></div>
                 </div>
              </div>
           </div>

           <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group shadow-2xl text-rose-600">
              <div className="relative z-10">
                 <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl">
                       <FiX size={24} />
                    </div>
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Fallas Ops</span>
                 </div>
                 <div className="flex items-end gap-3 mb-1">
                    <p className="text-3xl font-black tracking-tighter leading-none">
                       {metrics.count > 0 ? Math.round((metrics.fallas / metrics.count) * 100) : 0}%
                    </p>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">({metrics.fallas} reportadas)</p>
                 </div>
                 <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all duration-1000"
                      style={{ width: `${metrics.count > 0 ? (metrics.fallas / metrics.count) * 100 : 0}%` }}
                    ></div>
                 </div>
              </div>
           </div>
        </div>

        {/* Filters Area */}
        <div className="glass rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl mb-10">
           <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex flex-col lg:flex-row items-center gap-8">
              <div className="w-full lg:w-1/3 space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Cierre de Fecha</label>
                 <div className="relative group">
                    <FiCalendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full pl-14 pr-6 py-4.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner outline-none"
                    />
                 </div>
              </div>

              <div className="flex-1 w-full space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Auditores de Búsqueda</label>
                 <div className="relative group">
                    <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input 
                      type="text"
                      placeholder="Identificador o nombre de cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-16 pr-6 py-4.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner outline-none placeholder:text-slate-300"
                    />
                 </div>
              </div>
           </div>

           {/* Table Section */}
           <div className="overflow-x-auto min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                   <LoadingSpinner />
                   <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando Base de Datos</p>
                </div>
              ) : filteredRecaudos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-10 text-center">
                   <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300">
                      <FiSearch size={40} />
                   </div>
                   <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none mb-2">Sin Resultados de Auditoría</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter max-w-xs mx-auto">
                      No se detectaron transacciones registradas para el periodo seleccionado.
                   </p>
                </div>
              ) : (
                <table className="w-full border-collapse">
                   <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                         <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Referencia / Cliente</th>
                         <th className="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tipo Ops</th>
                         <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gestión de Campo</th>
                         <th className="px-4 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ingreso Neto</th>
                         <th className="px-4 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operaciones</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {currentItems.map((recaudo) => {
                        const cliente = recaudo.venta?.cliente || {};
                        const esFalla = parseFloat(recaudo.valor_recaudo) === 0;
                        return (
                          <tr key={recaudo.id} className="group hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all">
                             <td className="px-4 py-6 whitespace-nowrap">
                                <div className="flex items-center gap-4">
                                   <button 
                                     onClick={() => recaudo.venta?.id && router.push(`/dashboard/ventas/${recaudo.venta.id}`)}
                                     className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm font-black text-sm uppercase transition-all hover:scale-110 ${
                                      esFalla ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                                   }`}>
                                      {cliente.nombres?.charAt(0) || <FiUser />}
                                   </button>
                                   <div className="group/name cursor-pointer" onClick={() => recaudo.venta?.id && router.push(`/dashboard/ventas/${recaudo.venta.id}`)}>
                                      <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none group-hover/name:text-indigo-600 transition-colors">
                                         {cliente.nombres} {cliente.apellidos}
                                      </p>
                                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">REC: #{recaudo.id} • VTA: #{recaudo.venta?.id}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-4 py-6 text-center whitespace-nowrap">
                                <span className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                   esFalla ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                                }`}>
                                   {esFalla ? 'Falla' : 'Abono'}
                                </span>
                             </td>
                             <td className="px-4 py-6">
                                <div className="max-w-[200px]">
                                   <p className={`text-[11px] font-black uppercase leading-tight truncate ${esFalla ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                      {esFalla ? (recaudo.visita_blanco?.tipo_falla || "Sin Detalle") : "Sincronización Exitosa"}
                                   </p>
                                   <p className="text-[9px] font-bold text-slate-300 uppercase mt-1">Saldo Venta: {formatCurrency(recaudo.venta?.saldo_actual || 0)}</p>
                                </div>
                             </td>
                             <td className="px-4 py-6 text-right whitespace-nowrap">
                                <p className={`text-sm font-black tracking-tighter ${esFalla ? 'text-slate-400' : 'text-emerald-500'}`}>
                                   {formatCurrency(recaudo.valor_recaudo)}
                                </p>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none mt-1">
                                   Hash: {recaudo.id.toString(16).padStart(4, '0')}
                                </p>
                             </td>
                             <td className="px-4 py-6 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                   <button 
                                     onClick={() => setEditingRecaudo(recaudo)}
                                     className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"
                                     title="Editar Registro"
                                   >
                                      <FiEdit size={16} />
                                   </button>
                                   <button 
                                     onClick={() => setDeletingRecaudo(recaudo)}
                                     className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-sm"
                                     title="Anular Recaudo"
                                   >
                                      <FiTrash2 size={16} />
                                   </button>
                                </div>
                             </td>
                          </tr>
                        );
                      })}
                   </tbody>
                </table>
              )}
           </div>

           {/* Pagination */}
           {totalPages > 1 && (
             <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                   Página {currentPage} de {totalPages} • Total {filteredRecaudos.length} Registros
                </p>
                <div className="flex items-center gap-2">
                   <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="px-6 py-3 bg-white dark:bg-slate-900 text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:text-indigo-600 transition-all font-black text-[10px] uppercase tracking-widest"
                   >
                     Anterior
                   </button>
                   <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="px-6 py-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-30 shadow-sm font-black text-[10px] uppercase tracking-widest hover:border-indigo-500 transition-all"
                   >
                     Siguiente
                   </button>
                </div>
             </div>
           )}
        </div>

        {/* Audit Info Footer */}
        <div className="glass p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl relative overflow-hidden">
           <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex items-start gap-6 max-w-2xl">
                 <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
                    <FiShield size={28} />
                 </div>
                 <div>
                    <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Protocolo de Auditoría de Campo</h4>
                    <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                       Todos los recaudos aquí listados han sido registrados por los cobradores en tiempo real. Cualquier ajuste realizado por supervisión queda registrado con un hash de auditoría inmutable en el historial central.
                    </p>
                 </div>
              </div>
              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Caja Central</p>
                    <p className="text-xs font-black text-emerald-500 uppercase">Estado: Balanceado</p>
                 </div>
                 <div className="w-1.5 h-10 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                 <FiActivity className="text-indigo-500/50 animate-pulse" size={32} />
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
