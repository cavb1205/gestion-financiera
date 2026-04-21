// app/dashboard/liquidar/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch } from "@/app/utils/api";
import {
   FiCalendar,
   FiRefreshCw,
   FiCheck,
   FiX,
   FiClock,
   FiSearch,
   FiActivity,
   FiTarget,
   FiArrowRight,
   FiInfo,
   FiFilter,
   FiPhone,
   FiMapPin,
   FiMessageCircle,
   FiDollarSign,
} from "react-icons/fi";
import { toast } from "react-toastify";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { formatMoney, parseMoney } from "../../utils/format";
import Pagination from "../../components/Pagination";

export default function LiquidarCreditosPage() {
   const { selectedStore, user, isAuthenticated, loading: authLoading } = useAuth();
   const isWorker = !(user?.is_staff || user?.is_superuser);
   const [gpsPermission, setGpsPermission] = useState(null); // null | "granted" | "denied" | "prompt"
   const [gpsBannerDismissed, setGpsBannerDismissed] = useState(false);
   const [creditos, setCreditos] = useState([]);
   const [recaudos, setRecaudos] = useState([]);
   const [creditosActivos, setCreditosActivos] = useState([]);
   const [filteredCreditos, setFilteredCreditos] = useState([]);
   const [caja, setCaja] = useState(null);
   const [loading, setLoading] = useState(true);
   const [selectedDate, setSelectedDate] = useState("");
   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage] = useState(10);
   const [searchTerm, setSearchTerm] = useState("");
   const router = useRouter();
   const dateInputRef = useRef(null);

   // Establecer fecha actual por defecto (workers siempre ven solo hoy)
   useEffect(() => {
      const today = new Date();
      const formattedDate = new Date(
         today.getTime() - today.getTimezoneOffset() * 60000
      )
         .toISOString()
         .split("T")[0];

      if (isWorker) {
         setSelectedDate(formattedDate);
      } else {
         const storedDate = localStorage.getItem("liquidarFecha");
         setSelectedDate(storedDate || formattedDate);
      }
   }, [isWorker]);

   // Verificar/solicitar permiso GPS (solo workers)
   useEffect(() => {
      if (!isWorker || typeof navigator === "undefined" || !navigator.geolocation) {
         if (isWorker) setGpsPermission("denied");
         return;
      }

      const checkPermission = () => {
         if (navigator.permissions) {
            navigator.permissions.query({ name: "geolocation" }).then((result) => {
               if (result.state === "granted") {
                  setGpsPermission("granted");
               } else if (result.state === "denied") {
                  setGpsPermission("denied");
               } else {
                  // "prompt" — disparar el diálogo nativo
                  navigator.geolocation.getCurrentPosition(
                     () => setGpsPermission("granted"),
                     (error) => setGpsPermission(error.code === error.PERMISSION_DENIED ? "denied" : "granted"),
                     { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
                  );
               }
            });
         } else {
            navigator.geolocation.getCurrentPosition(
               () => setGpsPermission("granted"),
               (error) => setGpsPermission(error.code === error.PERMISSION_DENIED ? "denied" : "granted"),
               { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
            );
         }
      };

      checkPermission();

      // Re-verificar cuando el usuario vuelve a la pestaña (ej. después de cambiar ajustes)
      const handleVisibility = () => {
         if (document.visibilityState === "visible") checkPermission();
      };
      document.addEventListener("visibilitychange", handleVisibility);
      return () => document.removeEventListener("visibilitychange", handleVisibility);
   }, [isWorker]);

   // Obtener datos
   useEffect(() => {
      const fetchData = async () => {
         if (!selectedStore || !selectedDate) return;

         setLoading(true);
         try {
            const fetchJson = async (path) => {
               const res = await apiFetch(path);
               if (!res.ok) return null;
               return res.json();
            };

            const [creditosData, activosData, recaudosData, tiendaData] = await Promise.all([
               fetchJson(`/ventas/activas/liquidar/${selectedDate}/t/${selectedStore.tienda.id}/`),
               fetchJson(`/ventas/activas/t/${selectedStore.tienda.id}/`),
               fetchJson(`/recaudos/list/${selectedDate}/t/${selectedStore.tienda.id}/`),
               fetchJson(`/tiendas/detail/`),
            ]);

            setCreditos(Array.isArray(creditosData) ? creditosData : []);
            setCreditosActivos(Array.isArray(activosData) ? activosData : []);
            setRecaudos(Array.isArray(recaudosData) ? recaudosData : []);
            if (tiendaData?.tienda?.caja !== undefined) setCaja(tiendaData.tienda.caja);
            setFilteredCreditos(Array.isArray(creditosData) ? creditosData : []);
         } catch (error) {
            console.error("Error:", error);
            toast.error(error.message);
         } finally {
            setLoading(false);
         }
      };

      fetchData();
   }, [selectedStore, selectedDate]);

   useEffect(() => {
      if (selectedDate) {
         localStorage.setItem("liquidarFecha", selectedDate);
      }
   }, [selectedDate]);

   // Filtrado de búsqueda
   useEffect(() => {
      const filtered = creditos.filter(c => {
         const fullName = `${c.cliente?.nombres ?? ''} ${c.cliente?.apellidos ?? ''}`.toLowerCase();
         return fullName.includes(searchTerm.toLowerCase());
      });
      setFilteredCreditos(filtered);
      setCurrentPage(1);
   }, [searchTerm, creditos]);

   // Paginación
   const indexOfLastItem = currentPage * itemsPerPage;
   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
   const totalPages = Math.ceil(filteredCreditos.length / itemsPerPage);
   const currentItems = filteredCreditos.slice(indexOfFirstItem, indexOfLastItem);

   const getStatusBadge = (estado) => {
      switch (estado) {
         case "Vigente":
            return <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-200 dark:border-emerald-800">Vigente</span>;
         case "Atrasado":
            return <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-200 dark:border-amber-800 border-dashed">Atrasado</span>;
         case "Vencido":
            return <span className="px-2.5 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-rose-200 dark:border-rose-800">Vencido</span>;
         default:
            return <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg">{estado}</span>;
      }
   };

   const calcVisitasRestantes = (c) => {
      const cuotas = parseFloat(c.cuotas);
      const pagos = parseFloat(c.pagos_realizados);
      const atraso = parseFloat(c.dias_atrasados);
      if (isNaN(cuotas) || isNaN(pagos) || isNaN(atraso)) return null;
      return Math.round(cuotas - pagos - atraso);
   };

   const getMoraBorderColor = (dias) => {
      if (dias >= 30) return "border-l-rose-500";
      if (dias >= 15) return "border-l-orange-500";
      if (dias >= 5) return "border-l-amber-500";
      if (dias > 0) return "border-l-yellow-500";
      return "border-l-emerald-500";
   };

   const formatPhone = (phone) => {
      if (!phone) return null;
      return phone.replace(/\s+/g, "").replace(/^0/, "");
   };

   const buildWhatsAppUrl = (credito) => {
      const raw = (credito.cliente.telefono_principal || "").replace(/[^0-9]/g, "");
      const nombre = credito.cliente.nombres;
      const saldo = formatMoney(credito.saldo_actual);
      const cuota = formatMoney(credito.valor_cuota);
      const abonado = formatMoney(credito.total_abonado);
      const mora = Math.round(credito.dias_atrasados || 0);
      const pagosRealizados = Math.round(credito.pagos_realizados || 0);
      const totalCuotas = Math.round(credito.cuotas || 0);
      const estadoTexto = credito.estado_venta === "Vencido"
         ? `vencido con *${mora} días* de mora`
         : `con saldo pendiente`;
      const msg =
         `Hola ${nombre}, le recordamos que tiene un crédito ${estadoTexto}.\n\n` +
         `💰 Saldo pendiente: *${saldo}*\n` +
         `✅ Total abonado: *${abonado}*\n` +
         `📅 Progreso: *${pagosRealizados}/${totalCuotas} días*\n` +
         `📋 Valor cuota: *${cuota}*\n\n` ;
      return `https://api.whatsapp.com/send?phone=${raw}&text=${encodeURIComponent(msg)}`;
   };

   const handleAbonar = (credito) => {
      const valorAbono = Math.min(parseMoney(credito.saldo_actual), parseMoney(credito.valor_cuota));
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
   const totalRecaudar = creditosActivos.reduce((acc, c) => acc + parseMoney(c.valor_cuota), 0);
   const totalPendientes = filteredCreditos.reduce((acc, c) => acc + parseMoney(c.valor_cuota), 0);
   const totalRealizados = recaudos.reduce((acc, r) => acc + parseMoney(r.valor_recaudo), 0);
   const porcentajeAvance = totalRecaudar > 0 ? Math.round((totalRealizados / totalRecaudar) * 100) : 0;

   return (
      <div className="min-h-screen bg-transparent pb-12">
         <div className="w-full">

            {/* Header Section */}
            <div className="flex items-center justify-between mb-6 gap-4">
               <div className="flex items-center gap-3 md:gap-5 min-w-0">
                  <div className="bg-emerald-600 p-3 md:p-4 rounded-[1.25rem] md:rounded-[1.5rem] shadow-xl shadow-emerald-200 dark:shadow-none shrink-0">
                     <FiActivity className="text-white text-xl md:text-3xl" />
                  </div>
                  <div className="min-w-0">
                     <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none uppercase truncate">Liquidación Diaria</h1>
                     <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 px-0.5 truncate">
                        <span className="text-emerald-500">{selectedStore.tienda.nombre}</span>
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-2 shrink-0">
                  {!isWorker && (
                     <button
                        onClick={() => {
                           const today = new Date();
                           const formattedDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                           setSelectedDate(formattedDate);
                        }}
                        className="px-4 py-3 md:px-6 md:py-4 bg-white dark:bg-slate-900 text-slate-500 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest hover:text-emerald-600 transition-all shadow-sm"
                     >
                        Hoy
                     </button>
                  )}
                  <button
                     onClick={() => router.refresh()}
                     className="p-3 md:p-4 bg-white dark:bg-slate-900 text-slate-500 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 hover:text-indigo-600 transition-all shadow-sm group"
                  >
                     <FiRefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                  </button>
               </div>
            </div>

            {/* Banner GPS — solo workers cuando el permiso no está concedido */}
            {isWorker && !gpsBannerDismissed && gpsPermission === "denied" && (
               <div className="flex items-start gap-4 px-5 py-4 mb-6 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-[1.5rem]">
                  <FiMapPin className="text-rose-500 shrink-0 mt-0.5" size={16} />
                  <div className="flex-1 min-w-0">
                     <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest leading-none mb-1">Ubicación bloqueada</p>
                     <p className="text-[9px] font-bold text-rose-400 uppercase tracking-tight leading-relaxed">
                        Para activarla: abre la configuración de tu navegador → Permisos del sitio → Ubicación → permite esta página. Los cobros funcionan sin GPS pero quedarán sin ubicación registrada.
                     </p>
                  </div>
                  <button onClick={() => setGpsBannerDismissed(true)} className="text-rose-300 hover:text-rose-500 transition-colors shrink-0 text-lg leading-none">&times;</button>
               </div>
            )}

            {/* Caja Disponible — solo workers */}
            {isWorker && caja !== null && (
               <div className={`flex items-center justify-between px-6 py-5 rounded-[1.5rem] md:rounded-[2rem] mb-6 border ${caja >= 0 ? 'bg-emerald-600 border-emerald-500 shadow-xl shadow-emerald-200 dark:shadow-none' : 'bg-rose-600 border-rose-500 shadow-xl shadow-rose-200 dark:shadow-none'}`}>
                  <div className="flex items-center gap-4">
                     <div className="p-2.5 bg-white/20 rounded-xl">
                        <FiDollarSign className="text-white" size={22} />
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-white/70 uppercase tracking-[0.25em]">Caja Disponible</p>
                        <p className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none">{formatMoney(caja)}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                        {caja >= 0 ? 'Para nuevos créditos' : 'Saldo negativo'}
                     </p>
                  </div>
               </div>
            )}

            {/* Global Metrics Area */}
            <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8">
               <div className="glass p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group shadow-xl">
                  <div className="relative z-10">
                     <div className="flex items-center justify-between mb-2 md:mb-4">
                        <div className="p-2 md:p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl md:rounded-2xl">
                           <FiTarget size={16} className="md:w-6 md:h-6" />
                        </div>
                        <span className="hidden md:block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Meta</span>
                     </div>
                     <p className="text-base md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-0.5 md:mb-1">
                        {formatMoney(totalRecaudar)}
                     </p>
                     <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Meta Total</p>
                  </div>
               </div>

               <div className="glass p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-white/60 dark:border-slate-800 relative overflow-hidden group shadow-xl">
                  <div className="relative z-10">
                     <div className="flex items-center justify-between mb-2 md:mb-4">
                        <div className="p-2 md:p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl md:rounded-2xl">
                           <FiClock size={16} className="md:w-6 md:h-6" />
                        </div>
                        <span className="hidden md:block text-[10px] font-black text-rose-400 uppercase tracking-widest">Pendiente</span>
                     </div>
                     <p className="text-base md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-0.5 md:mb-1">
                        {formatMoney(totalPendientes)}
                     </p>
                     <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Falta Cobrar</p>
                  </div>
               </div>

               <div className="bg-emerald-600 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-emerald-500 relative overflow-hidden group shadow-xl shadow-emerald-200 dark:shadow-none">
                  <div className="relative z-10 text-white">
                     <div className="flex items-center justify-between mb-2 md:mb-4">
                        <div className="p-2 md:p-3 bg-white/20 rounded-xl md:rounded-2xl">
                           <FiCheck size={16} className="md:w-6 md:h-6" />
                        </div>
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{porcentajeAvance}%</span>
                     </div>
                     <p className="text-base md:text-3xl font-black tracking-tighter mb-0.5 md:mb-1">
                        {formatMoney(totalRealizados)}
                     </p>
                     <div className="w-full h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-white/60 rounded-full transition-all duration-700" style={{ width: `${Math.min(porcentajeAvance, 100)}%` }} />
                     </div>
                  </div>
               </div>
            </div>

            {/* Filters & Search Container */}
            <div className="glass rounded-[2.5rem] border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl mb-10">
               <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex flex-col lg:flex-row items-center gap-6 md:gap-8">
                  <div className="w-full lg:w-1/3 space-y-2">
                     <label htmlFor="periodo-contable" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Periodo Contable</label>
                     {isWorker ? (
                        <div className="flex items-center gap-3 px-6 py-4.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-3xl">
                           <FiCalendar className="text-emerald-500" />
                           <span className="text-[13px] font-black text-slate-800 dark:text-white">{selectedDate}</span>
                           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest ml-auto">Hoy</span>
                        </div>
                     ) : (
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
                              id="periodo-contable"
                              ref={dateInputRef}
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              onClick={(e) => {
                                 try { e.target.showPicker(); } catch (err) { /* noop */ }
                              }}
                              className="w-full pl-14 pr-6 py-4.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner outline-none relative z-0 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                           />
                        </div>
                     )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                     <label htmlFor="buscar-cliente" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Buscar Cliente</label>
                     <div className="relative group">
                        <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-all pointer-events-none z-10" size={20} />
                        <input
                           id="buscar-cliente"
                           type="text"
                           placeholder="Nombre del cliente..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="w-full pl-16 pr-6 py-4.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl text-[13px] font-black text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-inner outline-none placeholder:text-slate-300"
                        />
                     </div>
                  </div>

                  <div className="w-full lg:w-auto pt-4 lg:pt-0">
                     <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <FiFilter className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                           {filteredCreditos.length} Resultados
                        </span>
                     </div>
                  </div>
               </div>

               {/* Desktop Table */}
               <div className="hidden md:block overflow-x-auto min-h-[400px]">
                  {loading ? (
                     <div className="flex flex-col items-center justify-center py-20">
                        <LoadingSpinner />
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando datos</p>
                     </div>
                  ) : filteredCreditos.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-24 px-10 text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300">
                           <FiSearch size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Sin Registros</h3>
                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-tighter">No hay créditos pendientes para el periodo {selectedDate}</p>
                     </div>
                  ) : (
                     <table className="w-full border-collapse">
                        <thead>
                           <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                              <th className="px-5 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Cliente</th>
                              <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Contacto</th>
                              <th className="px-4 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Cuota</th>
                              <th className="px-4 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Progreso</th>
                              <th className="px-4 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Estado</th>
                              <th className="px-5 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Acción</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                           {currentItems.map((credito) => {
                              const mora = Math.round(credito.dias_atrasados || 0);
                              const phone = formatPhone(credito.cliente.telefono_principal);
                              const vr = calcVisitasRestantes(credito);
                              const proxVencer = (credito.estado_venta === "Vigente" || credito.estado_venta === "Atrasado") && vr !== null && vr >= 0 && vr <= 3;
                              return (
                                 <tr key={credito.id} className={`group transition-all border-l-4 ${getMoraBorderColor(mora)} ${proxVencer ? "bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-100/60 dark:hover:bg-amber-950/60" : "hover:bg-slate-50/50 dark:hover:bg-indigo-500/5"}`}>
                                    <td className="px-5 py-5 whitespace-nowrap">
                                       <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm uppercase shrink-0">
                                             {credito.cliente.nombres.charAt(0)}
                                          </div>
                                          <div
                                             className="cursor-pointer group/name"
                                             onClick={() => router.push(`/dashboard/ventas/${credito.id}`)}
                                          >
                                             <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none group-hover/name:text-indigo-600 transition-colors">
                                                {credito.cliente.nombres} {credito.cliente.apellidos}
                                             </p>
                                             <p className="text-[9px] font-bold text-slate-400 mt-1">Saldo: <span className="text-rose-500">{formatMoney(credito.saldo_actual)}</span></p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-4 py-5 whitespace-nowrap">
                                       <div className="flex items-center gap-1.5">
                                          {phone && (
                                             <>
                                                <a
                                                   href={`tel:${phone}`}
                                                   className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
                                                   title="Llamar"
                                                   onClick={(e) => e.stopPropagation()}
                                                >
                                                   <FiPhone size={13} />
                                                </a>
                                                <a
                                                   href={buildWhatsAppUrl(credito)}
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all"
                                                   title="WhatsApp"
                                                   onClick={(e) => e.stopPropagation()}
                                                >
                                                   <FiMessageCircle size={13} />
                                                </a>
                                                <span className="text-[10px] font-bold text-slate-400 ml-1">{credito.cliente.telefono_principal}</span>
                                             </>
                                          )}
                                          {!phone && (
                                             <span className="text-[10px] font-bold text-slate-300">Sin teléfono</span>
                                          )}
                                       </div>
                                       {credito.cliente.direccion && (
                                          <a
                                             href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(credito.cliente.direccion)}`}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="flex items-center gap-1 mt-1 group/map hover:text-indigo-500 transition-colors"
                                             onClick={(e) => e.stopPropagation()}
                                          >
                                             <FiMapPin size={10} className="text-slate-300 group-hover/map:text-indigo-500 shrink-0" />
                                             <span className="text-[9px] font-bold text-slate-400 group-hover/map:text-indigo-500 truncate max-w-[160px] underline decoration-dotted underline-offset-2">{credito.cliente.direccion}</span>
                                          </a>
                                       )}
                                    </td>
                                    <td className="px-4 py-5 text-right whitespace-nowrap">
                                       <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                                          {formatMoney(credito.valor_cuota)}
                                       </p>
                                    </td>
                                    <td className="px-4 py-5 text-center whitespace-nowrap">
                                       <div className="flex flex-col items-center">
                                          <span className="text-xs font-black text-slate-800 dark:text-white tracking-tighter mb-1">
                                             {Math.round(credito.pagos_realizados)}/{credito.cuotas}
                                          </span>
                                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                             <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${(Math.round(credito.pagos_realizados) / credito.cuotas) * 100}%` }}
                                             />
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-4 py-5 whitespace-nowrap">
                                       <div className="flex flex-col items-start gap-1">
                                          {getStatusBadge(credito.estado_venta)}
                                          {proxVencer && (
                                             <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-300 dark:border-amber-700 animate-pulse">
                                                ⚠ {vr === 0 ? "Última cuota" : `${vr} ${vr === 1 ? "cuota" : "cuotas"} p/ vencer`}
                                             </span>
                                          )}
                                          {mora > 0 && (
                                             <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
                                                {mora}d mora
                                             </span>
                                          )}
                                          {mora < 0 && (
                                             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                                {Math.abs(mora)}d adelantado
                                             </span>
                                          )}
                                       </div>
                                    </td>
                                    <td className="px-5 py-5 text-right whitespace-nowrap">
                                       <div className="flex items-center justify-end gap-2">
                                          <button
                                             onClick={() => handleReportarFalla(credito)}
                                             className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 rounded-lg hover:text-rose-600 hover:shadow-lg transition-all border border-slate-100 dark:border-slate-700"
                                             title="Reportar Falla"
                                          >
                                             <FiX size={15} />
                                          </button>
                                          <button
                                             onClick={() => handleAbonar(credito)}
                                             className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                                          >
                                             Abonar <FiArrowRight size={13} />
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

               {/* Mobile View - Cards Layout */}
               <div className="md:hidden space-y-3 px-4 py-6">
                  {loading ? (
                     <div className="flex flex-col items-center justify-center py-20">
                        <LoadingSpinner />
                     </div>
                  ) : filteredCreditos.length === 0 ? (
                     <div className="glass p-10 text-center rounded-[2rem]">
                        <FiSearch size={30} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin Pendientes</p>
                     </div>
                  ) : (
                     currentItems.map((credito) => {
                        const mora = Math.round(credito.dias_atrasados || 0);
                        const phone = formatPhone(credito.cliente.telefono_principal);
                        const vr = calcVisitasRestantes(credito);
                        const proxVencer = (credito.estado_venta === "Vigente" || credito.estado_venta === "Atrasado") && vr !== null && vr >= 0 && vr <= 3;
                        return (
                           <div key={credito.id} className={`glass p-5 rounded-[2rem] border-l-4 ${getMoraBorderColor(mora)} border-white/60 dark:border-slate-800 shadow-lg space-y-4 ${proxVencer ? "bg-amber-50/60 dark:bg-amber-950/30" : ""}`}>
                              {/* Client name → clickable to detail */}
                              <div className="flex items-start justify-between gap-3">
                                 <div
                                    className="flex-1 cursor-pointer min-w-0"
                                    onClick={() => router.push(`/dashboard/ventas/${credito.id}`)}
                                 >
                                    <p className="text-[15px] font-black text-slate-800 dark:text-white uppercase leading-tight mb-1.5 active:text-indigo-600 transition-colors">
                                       {credito.cliente.nombres} {credito.cliente.apellidos}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                       {getStatusBadge(credito.estado_venta)}
                                       {proxVencer && (
                                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-300 dark:border-amber-700 animate-pulse">
                                             ⚠ {vr === 0 ? "Última cuota" : `${vr}c p/ vencer`}
                                          </span>
                                       )}
                                       {mora > 0 && (
                                          <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-rose-100 dark:border-rose-800">{mora}d Mora</span>
                                       )}
                                       {mora < 0 && (
                                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 dark:border-emerald-800">{Math.abs(mora)}d Adelantado</span>
                                       )}
                                    </div>
                                 </div>
                                 <div className="text-right shrink-0">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cuota</p>
                                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tighter leading-none">
                                       {formatMoney(credito.valor_cuota)}
                                    </p>
                                 </div>
                              </div>

                              {/* Contact row */}
                              <div className="flex items-center gap-2 flex-wrap">
                                 {phone ? (
                                    <>
                                       <a
                                          href={`tel:${phone}`}
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-[10px] font-black active:scale-95 transition-all"
                                       >
                                          <FiPhone size={12} /> {credito.cliente.telefono_principal}
                                       </a>
                                       <a
                                          href={buildWhatsAppUrl(credito)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-[10px] font-black active:scale-95 transition-all"
                                       >
                                          <FiMessageCircle size={12} /> WhatsApp
                                       </a>
                                    </>
                                 ) : (
                                    <span className="text-[10px] font-bold text-slate-300">Sin teléfono</span>
                                 )}
                                 {credito.cliente.direccion && (
                                    <a
                                       href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(credito.cliente.direccion)}`}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="flex items-center gap-1 text-[10px] font-bold text-slate-400 active:text-indigo-500 transition-colors"
                                    >
                                       <FiMapPin size={10} className="shrink-0 text-rose-400" />
                                       <span className="truncate underline decoration-dotted underline-offset-2">{credito.cliente.direccion}</span>
                                    </a>
                                 )}
                              </div>

                              {/* Financial info */}
                              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                                 <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo</p>
                                    <p className="text-sm font-black text-rose-500 tracking-tight">{formatMoney(credito.saldo_actual)}</p>
                                 </div>
                                 <div className="text-right space-y-0.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progreso</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">{Math.round(credito.pagos_realizados)}/{credito.cuotas}</p>
                                 </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-3">
                                 <button
                                    onClick={() => handleReportarFalla(credito)}
                                    className="p-4 bg-white dark:bg-slate-900 text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 active:scale-90 transition-all shadow-sm"
                                    title="Reportar Falla"
                                 >
                                    <FiX size={18} />
                                 </button>
                                 <button
                                    onClick={() => handleAbonar(credito)}
                                    className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-emerald-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2"
                                 >
                                    Abonar Cuota <FiArrowRight />
                                 </button>
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
                  totalItems={filteredCreditos.length}
                  itemsPerPage={itemsPerPage}
               />
            </div>

            {/* Informative Footer */}
            <div className="flex items-center gap-4 px-5 py-4 bg-white/40 dark:bg-slate-900/40 rounded-[1.5rem] border border-white/60 dark:border-slate-800/50 opacity-60">
               <FiInfo className="text-amber-500 shrink-0" size={16} />
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Los recaudos se sincronizan en tiempo real. Valide el efectivo físico al cierre de ruta.
               </p>
               <FiActivity className="text-emerald-500/50 animate-pulse shrink-0" size={16} />
            </div>

         </div>
      </div>
   );
}
