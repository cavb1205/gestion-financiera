// app/dashboard/liquidar/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
   FiDollarSign,
   FiCalendar,
   FiRefreshCw,
   FiChevronLeft,
   FiCheck,
   FiX,
   FiClock,
   FiUser,
   FiSearch,
   FiActivity,
   FiTarget,
   FiAlertCircle,
   FiPieChart,
   FiArrowRight,
   FiInfo,
   FiFilter
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export default function LiquidarCreditosPage() {
   const { token, selectedStore, isAuthenticated, loading: authLoading } = useAuth();
   const [creditos, setCreditos] = useState([]);
   const [recaudos, setRecaudos] = useState([]);
   const [creditosActivos, setCreditosActivos] = useState([]);
   const [filteredCreditos, setFilteredCreditos] = useState([]);
   const [loading, setLoading] = useState(true);
   const [selectedDate, setSelectedDate] = useState("");
   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage] = useState(10);
   const [searchTerm, setSearchTerm] = useState("");
   const router = useRouter();
   const dateInputRef = useRef(null);

   // Establecer fecha actual por defecto
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

   // Obtener datos
   useEffect(() => {
      const fetchData = async () => {
         if (!token || !selectedStore || !selectedDate) return;

         setLoading(true);
         try {
            const [creditosRes, activosRes, recaudosRes] = await Promise.all([
               fetch(`${process.env.NEXT_PUBLIC_API_URL}/ventas/activas/liquidar/${selectedDate}/t/${selectedStore.tienda.id}/`, {
                  headers: { Authorization: `Bearer ${token}` }
               }),
               fetch(`${process.env.NEXT_PUBLIC_API_URL}/ventas/activas/t/${selectedStore.tienda.id}/`, {
                  headers: { Authorization: `Bearer ${token}` }
               }),
               fetch(`${process.env.NEXT_PUBLIC_API_URL}/recaudos/list/${selectedDate}/t/${selectedStore.tienda.id}/`, {
                  headers: { Authorization: `Bearer ${token}` }
               })
            ]);

            if (!creditosRes.ok || !activosRes.ok || !recaudosRes.ok) throw new Error("Error al sincronizar datos de liquidación.");

            const [creditosData, activosData, recaudosData] = await Promise.all([
               creditosRes.json(),
               activosRes.json(),
               recaudosRes.json()
            ]);

            setCreditos(Array.isArray(creditosData) ? creditosData : []);
            setCreditosActivos(Array.isArray(activosData) ? activosData : []);
            setRecaudos(Array.isArray(recaudosData) ? recaudosData : []);
            setFilteredCreditos(Array.isArray(creditosData) ? creditosData : []);
         } catch (error) {
            console.error("Error:", error);
            toast.error(error.message);
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, [token, selectedStore, selectedDate]);

   useEffect(() => {
      if (selectedDate) {
         localStorage.setItem("liquidarFecha", selectedDate);
      }
   }, [selectedDate]);

   // Filtrado de búsqueda
   useEffect(() => {
      const filtered = creditos.filter(c => {
         const fullName = `${c.cliente.nombres} ${c.cliente.apellidos}`.toLowerCase();
         return fullName.includes(searchTerm.toLowerCase());
      });
      setFilteredCreditos(filtered);
      setCurrentPage(1);
   }, [searchTerm, creditos]);

   // Paginación
   const totalPages = Math.ceil(filteredCreditos.length / itemsPerPage);
   const currentItems = filteredCreditos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

   const formatCurrency = (value) => {
      return new Intl.NumberFormat("es-CO", {
         style: "currency",
         currency: "COP",
         minimumFractionDigits: 0,
      }).format(value);
   };

   const getStatusBadge = (estado) => {
      switch (estado) {
         case "Vigente":
            return <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-200 dark:border-emerald-800">Vigente</span>;
         case "Atrasado":
            return <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-200 dark:border-amber-800 border-dashed animate-pulse">Atrasado</span>;
         case "Vencido":
            return <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-rose-200 dark:border-rose-800 shadow-sm shadow-rose-200 dark:shadow-none">Vencido</span>;
         default:
            return <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg">{estado}</span>;
      }
   };

   const handleAbonar = (credito) => {
      const valorAbono = Math.min(parseFloat(credito.saldo_actual), parseFloat(credito.valor_cuota));
      const abono = {
         fecha_recaudo: selectedDate,
         valor_recaudo: valorAbono,
         saldo_actual: credito.saldo_actual,
         venta: credito.id,
         tienda: selectedStore.tienda.id,
      };
      localStorage.setItem("abono", JSON.stringify(abono));
      localStorage.setItem("cliente", JSON.stringify(credito.cliente));
      router.push(`/dashboard/liquidar/abonar`);
   };

   const handleReportarFalla = (credito) => {
      const noPago = {
         fecha_recaudo: selectedDate,
         valor_recaudo: 0,
         venta: credito.id,
         tienda: selectedStore.tienda.id,
         visita_blanco: { comentario: "", tipo_falla: "Casa o Local Cerrado" },
      };
      localStorage.setItem("noPago", JSON.stringify(noPago));
      localStorage.setItem("cliente", JSON.stringify(credito.cliente));
      router.push(`/dashboard/liquidar/reportar`);
   };

   if (authLoading || !isAuthenticated || !selectedStore) return <LoadingSpinner />;

   // Totales
   const totalRecaudar = creditosActivos.reduce((acc, c) => acc + parseFloat(c.valor_cuota), 0);
   const totalPendientes = filteredCreditos.reduce((acc, c) => acc + parseFloat(c.valor_cuota), 0);
   const totalRealizados = recaudos.reduce((acc, r) => acc + parseFloat(r.valor_recaudo), 0);

   return (
      <div className="min-h-screen bg-transparent pb-12">
         <div className="w-full">


            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
               <div className="flex items-center gap-5">
                  <div className="bg-emerald-600 p-4 rounded-[1.5rem] shadow-xl shadow-emerald-200 dark:shadow-none">
                     <FiActivity className="text-white text-3xl" />
                  </div>
                  <div>
                     <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase">Liquidación Diaria</h1>
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                        Operación de Cartera • <span className="text-emerald-500">{selectedStore.tienda.nombre}</span>
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <button
                     onClick={() => {
                        const today = new Date();
                        const formattedDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                        setSelectedDate(formattedDate);
                     }}
                     className="px-6 py-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest hover:text-emerald-600 transition-all shadow-sm"
                  >
                     Ir a Hoy
                  </button>
                  <button
                     onClick={() => router.refresh()}
                     className="p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
                  >
                     <FiRefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                  </button>
               </div>
            </div>

            {/* Global Metrics Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
               <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group shadow-2xl">
                  <div className="relative z-10">
                     <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                           <FiTarget size={24} />
                        </div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Meta de Cobro</span>
                     </div>
                     <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                        {formatCurrency(totalRecaudar)}
                     </p>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Capital Total Proyectado</p>
                  </div>
                  <div className="absolute -right-5 -bottom-5 text-indigo-500/5 group-hover:scale-110 transition-transform">
                     <FiTarget size={120} />
                  </div>
               </div>

               <div className="glass p-8 rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group shadow-2xl">
                  <div className="relative z-10">
                     <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-2xl">
                           <FiClock size={24} />
                        </div>
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Pendiente</span>
                     </div>
                     <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                        {formatCurrency(totalPendientes)}
                     </p>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Resta por Auditoría</p>
                  </div>
               </div>

               <div className="bg-emerald-600 p-8 rounded-[2.5rem] border border-emerald-500 relative overflow-hidden group shadow-2xl shadow-emerald-200 dark:shadow-none">
                  <div className="relative z-10 text-white">
                     <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                           <FiCheck size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Recaudado</span>
                     </div>
                     <p className="text-3xl font-black tracking-tighter mb-1">
                        {formatCurrency(totalRealizados)}
                     </p>
                     <p className="text-[10px] font-bold uppercase tracking-widest leading-none opacity-60">Efectivo Ingresado</p>
                  </div>
                  <div className="absolute -right-5 -bottom-5 text-white/5 opacity-50 group-hover:scale-110 transition-transform">
                     <FiPieChart size={120} />
                  </div>
               </div>
            </div>

            {/* Filters & Search Container */}
            <div className="glass rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl mb-10">
               <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex flex-col lg:flex-row items-center gap-8">
                  <div className="w-full lg:w-1/3 space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Periodo Contable</label>
                     <div
                        className="relative group cursor-pointer"
                        onClick={() => {
                           try {
                              if (dateInputRef.current) dateInputRef.current.showPicker();
                           } catch (err) {
                              dateInputRef.current?.focus();
                           }
                        }}
                     >
                        <FiCalendar className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 transition-all pointer-events-none z-10" />
                        <input
                           ref={dateInputRef}
                           type="date"
                           value={selectedDate}
                           onChange={(e) => setSelectedDate(e.target.value)}
                           onClick={(e) => {
                              try {
                                 e.target.showPicker();
                              } catch (err) {
                                 // Silently ignore if showPicker is not supported
                              }
                           }}
                           className="w-full pl-14 pr-6 py-4.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner outline-none relative z-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                     </div>
                  </div>

                  <div className="flex-1 w-full space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Filtro de Inteligencia</label>
                     <div className="relative group">
                        <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-all pointer-events-none z-10" size={20} />
                        <input
                           type="text"
                           placeholder="Escanea o escribe el nombre del cliente..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="w-full pl-16 pr-6 py-4.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner outline-none placeholder:text-slate-300"
                        />
                     </div>
                  </div>

                  <div className="w-full lg:w-auto pt-6 lg:pt-0">
                     <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <FiFilter className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                           {filteredCreditos.length} Resultados
                        </span>
                     </div>
                  </div>
               </div>

               {/* Table Section */}
               <div className="hidden md:block overflow-x-auto min-h-[400px]">
                  {loading ? (
                     <div className="flex flex-col items-center justify-center py-20">
                        <LoadingSpinner />
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando Auditoría</p>
                     </div>
                  ) : filteredCreditos.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-24 px-10 text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300">
                           <FiSearch size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Cero Registros Encontrados</h3>
                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-tighter">No hay créditos pendientes de liquidación para el periodo {selectedDate}</p>
                     </div>
                  ) : (
                     <table className="w-full border-collapse">
                        <thead>
                           <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                              <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Perfil de Cliente</th>
                              <th className="px-4 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Compromiso</th>
                              <th className="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ciclos</th>
                              <th className="px-4 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado de Riesgo</th>
                              <th className="px-4 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operación</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                           {currentItems.map((credito) => (
                              <tr key={credito.id} className="group hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all">
                                 <td className="px-4 py-6 whitespace-nowrap">
                                    <div className="flex items-center gap-4">
                                       <button
                                          onClick={() => router.push(`/dashboard/ventas/${credito.id}`)}
                                          className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-sm uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                       >
                                          {credito.cliente.nombres.charAt(0)}
                                       </button>
                                       <div className="group/name cursor-pointer" onClick={() => router.push(`/dashboard/ventas/${credito.id}`)}>
                                          <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none group-hover/name:text-indigo-600 transition-colors">
                                             {credito.cliente.nombres} {credito.cliente.apellidos}
                                          </p>
                                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Ref: #{credito.id}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-4 py-6 text-right whitespace-nowrap">
                                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none mb-1">
                                       {formatCurrency(credito.valor_cuota)}
                                    </p>
                                    <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest leading-none">
                                       Saldo: {formatCurrency(credito.saldo_actual)}
                                    </p>
                                 </td>
                                 <td className="px-4 py-6 text-center whitespace-nowrap">
                                    <div className="flex flex-col items-center">
                                       <span className="text-xs font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                                          {credito.pagos_realizados}/{credito.cuotas}
                                       </span>
                                       <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                          <div
                                             className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                             style={{ width: `${(credito.pagos_realizados / credito.cuotas) * 100}%` }}
                                          ></div>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-4 py-6 whitespace-nowrap">
                                    <div className="flex flex-col items-start gap-1.5">
                                       {getStatusBadge(credito.estado_venta)}
                                       {credito.dias_atrasados > 0 && (
                                          <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
                                             {Math.round(credito.dias_atrasados)} Días Mora
                                          </span>
                                       )}
                                    </div>
                                 </td>
                                 <td className="px-4 py-6 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2 transition-all">
                                       <button
                                          onClick={() => handleReportarFalla(credito)}
                                          className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 rounded-xl hover:text-rose-600 hover:shadow-xl transition-all border border-slate-100 dark:border-slate-700"
                                          title="Reportar Falla"
                                       >
                                          <FiX size={16} />
                                       </button>
                                       <button
                                          onClick={() => handleAbonar(credito)}
                                          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                                       >
                                          Abonar
                                          <FiArrowRight />
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}
               </div>

               {/* Mobile View - Cards Layout */}
               <div className="md:hidden space-y-4 px-4 pb-8">
                  {loading ? (
                     <div className="flex flex-col items-center justify-center py-20">
                        <LoadingSpinner />
                     </div>
                  ) : filteredCreditos.length === 0 ? (
                     <div className="glass p-10 text-center rounded-[2.5rem]">
                        <FiSearch size={30} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin Pendientes</p>
                     </div>
                  ) : (
                     currentItems.map((credito) => (
                        <div key={credito.id} className="glass p-6 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-xl space-y-6">
                           <div className="flex items-start justify-between gap-4" onClick={() => router.push(`/dashboard/ventas/${credito.id}`)}>
                              <div className="flex-1">
                                 <p className="text-[17px] font-black text-slate-800 dark:text-white uppercase leading-tight mb-2">
                                    {credito.cliente.nombres} {credito.cliente.apellidos}
                                 </p>
                                 <div className="flex flex-wrap items-center gap-2">
                                    {getStatusBadge(credito.estado_venta)}
                                    {credito.dias_atrasados > 0 && (
                                       <span className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-rose-100 dark:border-rose-800">{Math.round(credito.dias_atrasados)}d Mora</span>
                                    )}
                                 </div>
                              </div>
                              <div className="text-right shrink-0">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Cuota Hoy</p>
                                 <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter leading-none">
                                    {formatCurrency(credito.valor_cuota)}
                                 </p>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-6 p-5 bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl border border-slate-100 dark:border-slate-800">
                              <div className="space-y-1">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Saldo Pendiente</p>
                                 <p className="text-sm font-black text-rose-500 tracking-tight">{formatCurrency(credito.saldo_actual)}</p>
                              </div>
                              <div className="text-right space-y-1">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Progreso</p>
                                 <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{credito.pagos_realizados} / {credito.cuotas}</p>
                              </div>
                           </div>

                           <div className="flex items-center gap-3">
                              <button
                                 onClick={() => handleReportarFalla(credito)}
                                 className="p-5 bg-white dark:bg-slate-900 text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-800 active:scale-90 transition-all shadow-sm"
                                 title="Reportar Falla"
                              >
                                 <FiX size={20} />
                              </button>
                              <button
                                 onClick={() => handleAbonar(credito)}
                                 className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-3"
                              >
                                 Abonar Cuota <FiArrowRight />
                              </button>
                           </div>
                        </div>
                     ))
                  )}
               </div>

               {/* Pagination */}
               {totalPages > 1 && (
                  <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Página {currentPage} de {totalPages} • Total {filteredCreditos.length} Compromisos
                     </p>
                     <div className="flex items-center gap-2">
                        <button
                           disabled={currentPage === 1}
                           onClick={() => setCurrentPage(prev => prev - 1)}
                           className="p-3 bg-white dark:bg-slate-900 text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:text-indigo-600 transition-all font-black text-sm"
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

            {/* Informative Footer */}
            <div className="glass p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800 shadow-2xl relative overflow-hidden">
               <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="flex items-start gap-6 max-w-2xl">
                     <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                        <FiInfo size={28} />
                     </div>
                     <div>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Protocolo de Liquidación Activo</h4>
                        <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                           Los recaudos registrados se sincronizan inmediatamente con la bóveda central. Asegúrese de validar el efectivo físico contra los reportes generados al cierre de la ruta.
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-6">
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Auditoría en Tiempo Real</p>
                        <p className="text-xs font-black text-emerald-500 uppercase">Estado: Conectado</p>
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
